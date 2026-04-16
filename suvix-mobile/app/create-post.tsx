import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { api } from '../src/api/client';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUploadStore } from '../src/store/useUploadStore';

const { width } = Dimensions.get('window');

/**
 * 📸 CREATE POST SCREEN (Instagram Style)
 * 
 * Flow:
 * 1. Pick Image/Video
 * 2. Enter Caption
 * 3. Upload to S3 (Direct)
 * 4. Confirm to Backend (Triggers Worker)
 * 5. Create Social Post
 */
export default function CreatePostScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [media, setMedia] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [caption, setCaption] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { startUpload, updateProgress, setProcessing, setFailed } = useUploadStore();

  const handlePickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your photos to create a post.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setMedia(result.assets[0]);
    }
  };

  const handlePost = async () => {
    if (!media) {
      Alert.alert('Error', 'Please select an image or video first.');
      return;
    }

    setIsPosting(true);

    try {
      // 1. Get Signed URL from Backend
      const filename = media.uri.split('/').pop() || 'upload.jpg';
      const type = media.type === 'video' ? 'VIDEO' : 'IMAGE';
      
      const { data: urlData } = await api.get('/media/signed-url', {
        params: {
          filename,
          contentType: media.mimeType || (type === 'VIDEO' ? 'video/mp4' : 'image/jpeg'),
          type,
        },
      });

      if (!urlData.success) throw new Error('Failed to get upload URL');

      // 2. Upload directly to S3 (Stable XHR Binary Upload)
      const uploadFile = () => {
        startUpload(type as 'IMAGE' | 'VIDEO');
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', urlData.uploadUrl);
          xhr.setRequestHeader('Content-Type', media.mimeType || (type === 'VIDEO' ? 'video/mp4' : 'image/jpeg'));
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              updateProgress(percent);
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200) {
              resolve(xhr.response);
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('XHR Network Error'));
          xhr.send({ uri: media.uri }); // React Native XHR automatically handles file:// URIs
        });
      };

      await uploadFile();

      // 3. Confirm Upload (Triggers Worker Flow)
      setProcessing();
      const { data: confirmData } = await api.post('/media/confirm', {
        mediaId: urlData.mediaId,
      });

      if (!confirmData.success) throw new Error('Failed to confirm upload');

      // 4. Create the Social Post (Links media to user's feed)
      await api.post('/social/posts', {
        caption,
        mediaIds: [urlData.mediaId],
        type,
        isReel: type === 'VIDEO',
      });

      // 5. Success! Navigate back immediately
      // The background worker (Phase 2) will handle the processing in the background
      // and update the global progress bar we created.
      router.back();

    } catch (error: any) {
      console.error('❌ [CREATE_POST] Failure:', error);
      setFailed(error.message);
      Alert.alert('Post Failed', error.message || 'Something went wrong while posting.');
      setIsPosting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={[styles.container, { backgroundColor: theme.primary }]}
    >
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} disabled={isPosting}>
          <MaterialCommunityIcons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>New Post</Text>
        <TouchableOpacity onPress={handlePost} disabled={!media || isPosting}>
          {isPosting ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <Text style={[styles.postBtnText, { color: media ? theme.accent : theme.textSecondary }]}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Media Preview Area */}
        <TouchableOpacity 
          style={[styles.mediaPlaceholder, { backgroundColor: theme.secondary, borderColor: theme.border }]} 
          onPress={handlePickMedia}
          disabled={isPosting}
        >
          {media ? (
            media.type === 'video' ? (
              <Video
                source={{ uri: media.uri }}
                style={styles.previewMedia}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay
                isMuted
              />
            ) : (
              <Image source={{ uri: media.uri }} style={styles.previewMedia} />
            )
          ) : (
            <View style={styles.placeholderInfo}>
              <MaterialCommunityIcons name="image-plus" size={48} color={theme.textSecondary} />
              <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>Select Photo or Video</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Caption Input */}
        <View style={styles.inputSection}>
          <TextInput
            style={[styles.captionInput, { color: theme.text, backgroundColor: theme.secondary, borderColor: theme.border }]}
            placeholder="Write a caption..."
            placeholderTextColor={theme.textSecondary}
            multiline
            maxLength={1000}
            value={caption}
            onChangeText={setCaption}
            disabled={isPosting}
          />
        </View>

        {/* Role Specific Info (Dynamic placeholder) */}
        <View style={[styles.infoCard, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="information-outline" size={18} color={theme.textSecondary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Your post will be processed in high quality. Large videos may take a moment to appear on your profile.
          </Text>
        </View>

        {/* Upload progress is now handled by TopNavbar */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  postBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  mediaPlaceholder: {
    width: width,
    height: width, // Square Instagram aspect ratio
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  previewMedia: {
    width: '100%',
    height: '100%',
  },
  placeholderInfo: {
    alignItems: 'center',
    gap: 10,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputSection: {
    padding: 15,
  },
  captionInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 15,
    minHeight: 100,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  infoCard: {
    flexDirection: 'row',
    marginHorizontal: 15,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  postingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBox: {
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    width: '80%',
    gap: 15,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressSub: {
    fontSize: 12,
    fontWeight: '600',
  },
});
