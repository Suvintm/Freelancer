import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import { api } from '../api/client';
import { uploadMediaDetailed } from '../utils/s3Uploader';
import { motion, AnimatePresence } from 'framer-motion';
import CreateImagePostWizard from '../components/create-post/CreateImagePostWizard';
import type { CreatePostData } from '../components/create-post/CreateImagePostWizard';
import { addUpload, updateUploadProgress, updateUploadStatus } from '../store/slices/uploadSlice';
import { 
  Image as ImageIcon, 
  Video, 
  Youtube, 
  BarChart2, 
  UploadCloud,
  X,
  Loader2,
  ChevronRight
} from 'lucide-react';

type TabType = 'POST' | 'REEL' | 'YOUTUBE' | 'POLL';

export default function CreateContent() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const channels = useMemo(() => user?.youtubeProfile || [], [user?.youtubeProfile]);
  const isYoutubeCreator = channels.length > 0 || user?.role === 'YOUTUBE_CREATOR';

  // Default to POST
  const [activeTab, setActiveTab] = useState<TabType>('POST');

  // Unified State
  const [caption, setCaption] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  // YouTube specific
  const [youtubeLink, setYoutubeLink] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs = [
    { id: 'POST', label: 'Post', icon: ImageIcon, desc: 'Share photos and images' },
    { id: 'REEL', label: 'Reel', icon: Video, desc: 'Share a short vertical video' },
    ...(isYoutubeCreator ? [{ id: 'YOUTUBE', label: 'YouTube', icon: Youtube, desc: 'Share a YouTube video link' }] : []),
    { id: 'POLL', label: 'Poll', icon: BarChart2, desc: 'Ask your audience' },
  ] as { id: TabType; label: string; icon: React.ElementType; desc: string }[];

  const handleTabChange = (tab: TabType) => {
    if (tab === 'POLL') {
      navigate('/create-poll');
      return;
    }
    setActiveTab(tab);
    resetForm();
  };

  const resetForm = () => {
    setCaption('');
    setSelectedFiles([]);
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setYoutubeLink('');
    setSelectedChannelId('');
    setStatus(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (activeTab === 'REEL') {
      const file = files[0];
      if (!file.type.startsWith('video/')) {
        setStatus({ type: 'error', text: 'Please select a valid video file for your reel.' });
        return;
      }
      setSelectedFiles([file]);
      setPreviewUrls([URL.createObjectURL(file)]);
    } 
    else if (activeTab === 'POST') {
      const validImages = files.filter(f => f.type.startsWith('image/'));
      if (validImages.length === 0) {
        setStatus({ type: 'error', text: 'Please select valid image files.' });
        return;
      }
      setSelectedFiles(prev => [...prev, ...validImages]);
      setPreviewUrls(prev => [...prev, ...validImages.map(f => URL.createObjectURL(f))]);
    }
    else if (activeTab === 'YOUTUBE') {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        setStatus({ type: 'error', text: 'Please select an image for your thumbnail.' });
        return;
      }
      setSelectedFiles([file]);
      setPreviewUrls([URL.createObjectURL(file)]);
    }
    setStatus(null);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleWizardSubmit = async (data: CreatePostData) => {
    setIsSubmitting(true);
    setStatus(null);
    const uploadId = Date.now().toString();
    let progressInterval: ReturnType<typeof setInterval>;

    try {
      if (data.mediaItems.length === 0) {
        throw new Error("Please select a media file to upload.");
      }

      dispatch(addUpload({
        id: uploadId,
        type: 'post',
        status: 'uploading',
        progress: 0,
        message: 'Uploading post...'
      }));

      let currentProgress = 0;
      progressInterval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 15) + 5;
        if (currentProgress > 90) {
          currentProgress = 90;
        }
        dispatch(updateUploadProgress({ id: uploadId, progress: currentProgress }));
      }, 500);

      // 1. Upload Media
      const uploadedMediaIds: string[] = [];
      for (const item of data.mediaItems) {
        const file = item.file;
        const { mediaId } = await uploadMediaDetailed(file, 'IMAGE', 'post');
        uploadedMediaIds.push(mediaId);
      }

      // 2. Submit Post Data
      const payload = {
        caption: data.caption,
        mediaIds: uploadedMediaIds,
        location_name: data.location,
        visibility: data.visibility,
        allow_comments: data.allowComments,
        hide_like_count: data.hideLikeCount,
        scheduled_at: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : undefined
      };

      const response = await api.post('/social/posts', payload);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Upload failed');
      }

      clearInterval(progressInterval!);
      dispatch(updateUploadProgress({ id: uploadId, progress: 100 }));
      dispatch(updateUploadStatus({ id: uploadId, status: 'success', message: 'Post uploaded successfully!' }));

      setStatus({ type: 'success', text: 'Successfully uploaded!' });
      setTimeout(() => {
        navigate('/home');
      }, 1500);

    } catch (err: unknown) {
      clearInterval(progressInterval!);
      dispatch(updateUploadStatus({ id: uploadId, status: 'failed', message: 'Failed to upload post' }));
      
      console.error(err);
      if (err instanceof Error) {
        setStatus({ type: 'error', text: err.message || 'Something went wrong.' });
      } else {
        setStatus({ type: 'error', text: 'Something went wrong.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);
    const uploadId = Date.now().toString();
    let progressInterval: ReturnType<typeof setInterval>;

    try {
      if (activeTab === 'YOUTUBE') {
        if (!youtubeLink.trim() || !selectedChannelId) {
          throw new Error("YouTube link and Channel selection are required.");
        }
      } else {
        if (selectedFiles.length === 0) {
          throw new Error("Please select a media file to upload.");
        }
      }

      const uploadType = activeTab === 'REEL' ? 'reel' : activeTab === 'YOUTUBE' ? 'youtube' : 'post';
      dispatch(addUpload({
        id: uploadId,
        type: uploadType,
        status: 'uploading',
        progress: 0,
        message: `Uploading ${uploadType}...`
      }));

      let currentProgress = 0;
      progressInterval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 15) + 5;
        if (currentProgress > 90) {
          currentProgress = 90;
        }
        dispatch(updateUploadProgress({ id: uploadId, progress: currentProgress }));
      }, 500);

      // 1. Upload Media
      const uploadedMediaIds: string[] = [];
      for (const file of selectedFiles) {
        const type = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
        let moduleContext: 'reels' | 'youtube_post' | 'post' = 'post';
        if (activeTab === 'REEL') moduleContext = 'reels';
        else if (activeTab === 'YOUTUBE') moduleContext = 'youtube_post';

        const { mediaId } = await uploadMediaDetailed(file, type, moduleContext);
        uploadedMediaIds.push(mediaId);
      }

      // 2. Submit Post Data
      let endpoint = '';
      let payload: Record<string, unknown> = {};

      if (activeTab === 'REEL') {
        endpoint = '/social/reels';
        payload = { caption, mediaIds: uploadedMediaIds };
      } else if (activeTab === 'YOUTUBE') {
        endpoint = '/social/posts/youtube';
        payload = { 
          caption, 
          youtube_link: youtubeLink, 
          youtube_channel_id: selectedChannelId,
          mediaIds: uploadedMediaIds // optional thumbnail
        };
      }

      const response = await api.post(endpoint, payload);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Upload failed');
      }

      clearInterval(progressInterval!);
      dispatch(updateUploadProgress({ id: uploadId, progress: 100 }));
      dispatch(updateUploadStatus({ id: uploadId, status: 'success', message: `${activeTab === 'REEL' ? 'Reel' : activeTab === 'YOUTUBE' ? 'YouTube post' : 'Post'} uploaded successfully!` }));

      setStatus({ type: 'success', text: 'Successfully uploaded!' });
      setTimeout(() => {
        navigate('/home');
      }, 1500);

    } catch (err: unknown) {
      clearInterval(progressInterval!);
      dispatch(updateUploadStatus({ id: uploadId, status: 'failed', message: `Failed to upload ${activeTab === 'REEL' ? 'reel' : activeTab === 'YOUTUBE' ? 'YouTube post' : 'post'}` }));
      
      console.error(err);
      if (err instanceof Error) {
        setStatus({ type: 'error', text: err.message || 'Something went wrong.' });
      } else {
        setStatus({ type: 'error', text: 'Something went wrong.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 p-2 md:p-8 flex justify-center m-0 overflow-x-hidden">
      <div className="w-full max-w-4xl pt-4 pb-24">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Create</h1>
          <p className="text-zinc-500 dark:text-zinc-400">What would you like to share today?</p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-4 md:grid-cols-4 gap-3 mb-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-lg scale-[1.02]' 
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                } border border-zinc-200 dark:border-zinc-800`}
              >
                <Icon className={`w-8 h-8 mb-2 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
                <span className="font-semibold">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 border-2 border-zinc-900 dark:border-white rounded-2xl pointer-events-none"
                    initial={false}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Form Container */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm"
          >
            {activeTab === 'POST' ? (
              <>
                <CreateImagePostWizard onSubmit={handleWizardSubmit} isSubmitting={isSubmitting} />
                {status && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
                      status.type === 'error' 
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50' 
                        : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                    }`}
                  >
                    {status.type === 'error' ? <X className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}
                    {status.text}
                  </motion.div>
                )}
              </>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Media Upload Area */}
              {(activeTab === 'REEL' || activeTab === 'YOUTUBE') && (
                <div>
                  <label className="block text-sm font-medium mb-3 text-zinc-700 dark:text-zinc-300">
                    {activeTab === 'REEL' ? 'Video File *' : 'Thumbnail (Optional)'}
                  </label>
                  
                  {previewUrls.length > 0 ? (
                    <div className="grid gap-4 grid-cols-1 max-w-sm">
                      {previewUrls.map((url, i) => (
                        <div key={url} className="relative group rounded-xl overflow-hidden aspect-[4/5] bg-zinc-100 dark:bg-zinc-800 shadow-inner">
                          {activeTab === 'REEL' ? (
                            <video src={url} className="w-full h-full object-cover" controls />
                          ) : (
                            <img src={url} alt={`preview ${i}`} className="w-full h-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-16 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 dark:hover:border-zinc-500 rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-zinc-50 dark:bg-zinc-800/30 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/60 group"
                    >
                      <div className="p-4 bg-white dark:bg-zinc-900 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-8 h-8 text-zinc-900 dark:text-white" />
                      </div>
                      <p className="text-zinc-900 dark:text-zinc-100 font-semibold">
                        Click to upload {activeTab === 'REEL' ? 'a video' : 'a thumbnail'}
                      </p>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2">
                        {activeTab === 'REEL' ? 'MP4, WebM up to 100MB' : 'JPG, PNG up to 10MB'}
                      </p>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple={false}
                    accept={activeTab === 'REEL' ? 'video/*' : 'image/*'}
                  />
                </div>
              )}

              {/* YouTube Specific Fields */}
              {activeTab === 'YOUTUBE' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">YouTube Link *</label>
                    <input
                      type="url"
                      required
                      value={youtubeLink}
                      onChange={(e) => setYoutubeLink(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-black dark:focus:ring-white focus:bg-white dark:focus:bg-zinc-900 outline-none transition-all placeholder:text-zinc-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">Select Channel *</label>
                    <select
                      required
                      value={selectedChannelId}
                      onChange={(e) => setSelectedChannelId(e.target.value)}
                      className="w-full p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-black dark:focus:ring-white focus:bg-white dark:focus:bg-zinc-900 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Choose a connected channel...</option>
                      {channels.map((ch: { id: string; channel_name: string }) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.channel_name || 'Unnamed Channel'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Caption */}
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">Caption</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption for your post..."
                  rows={4}
                  className="w-full p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-black dark:focus:ring-white focus:bg-white dark:focus:bg-zinc-900 outline-none transition-all resize-none placeholder:text-zinc-400"
                />
              </div>

              {/* Status Message */}
              {status && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
                    status.type === 'error' 
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50' 
                      : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                  }`}
                >
                  {status.type === 'error' ? <X className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}
                  {status.text}
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl font-bold flex items-center justify-center space-x-2 bg-zinc-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <span>Share {activeTab === 'REEL' ? 'Reel' : 'Video'}</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
