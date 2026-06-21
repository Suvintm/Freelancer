import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import { useTheme } from '../hooks/useTheme';
import { api } from '../api/client';
import { 
  ArrowLeft, 
  Video, 
  Image as ImageIcon, 
  Youtube, 
  UploadCloud, 
  X, 
  MapPin, 
  User as UserIcon, 
  Trash2, 
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

type UploadType = 'reel' | 'post' | 'yt_video' | 'thumbnail_vote';

interface TempFeedItem {
  _id: string;
  type: UploadType;
  user: string;
  location: string;
  comment: string;
  videoUrl?: string;
  images?: string[];
  createdAt: string;
}

export default function TempUploadPortal() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const user = useSelector(selectUser);

  // Form states
  const [activeTab, setActiveTab] = useState<UploadType>('reel');
  const [username, setUsername] = useState(user?.username || 'suvix_creator');
  const [location, setLocation] = useState('');
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [ytChannelName, setYtChannelName] = useState('');
  const [ytSubscribeLink, setYtSubscribeLink] = useState('');
  const [watchOnYtLink, setWatchOnYtLink] = useState('');
  
  // File states
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [existingItems, setExistingItems] = useState<TempFeedItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // File input refs
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  const fetchExistingItems = useCallback(async () => {
    setIsLoadingItems(true);
    try {
      const response = await api.get('/temp-feed');
      if (response.data.success) {
        setExistingItems(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching temp feed items:', error);
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      // Force execution to be asynchronous to avoid React cascading render warnings
      await Promise.resolve();
      if (active) {
        fetchExistingItems();
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [fetchExistingItems]);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setStatusMessage({ type: 'error', text: 'Please select a valid video file.' });
        return;
      }
      setSelectedVideo(file);
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
      setStatusMessage(null);
    }
  };

  const handleImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileList = Array.from(files);
      const invalidFiles = fileList.filter(f => !f.type.startsWith('image/'));
      if (invalidFiles.length > 0) {
        setStatusMessage({ type: 'error', text: 'All selected files must be images.' });
        return;
      }

      setSelectedImages(prev => [...prev, ...fileList]);
      const newPreviews = fileList.map(f => URL.createObjectURL(f));
      setImagePreviews(prev => [...prev, ...newPreviews]);
      setStatusMessage(null);
    }
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeSelectedVideo = () => {
    setSelectedVideo(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append('type', activeTab);
      formData.append('user', username);
      formData.append('location', location);
      formData.append('tags', tags);
      
      if (activeTab === 'yt_video') {
        formData.append('ytChannelName', ytChannelName);
        formData.append('ytSubscribeLink', ytSubscribeLink);
      }
      
      if (watchOnYtLink) {
        formData.append('watchOnYtLink', watchOnYtLink);
      }
      
      if (activeTab === 'reel') {
        formData.append('comment', description);
        if (!selectedVideo) {
          throw new Error('Please select a video file.');
        }
        formData.append('video', selectedVideo);
      } else if (activeTab === 'yt_video') {
        formData.append('comment', caption);
        if (!selectedVideo) {
          throw new Error('Please select a video file.');
        }
        formData.append('video', selectedVideo);
      } else if (activeTab === 'post' || activeTab === 'thumbnail_vote') {
        formData.append('comment', caption);
        if (activeTab === 'thumbnail_vote' && selectedImages.length < 2) {
          throw new Error('Please select at least 2 images for a thumbnail vote.');
        } else if (selectedImages.length === 0) {
          throw new Error('Please select at least one image.');
        }
        selectedImages.forEach((image) => {
          formData.append('images', image);
        });
      }

      const response = await api.post('/temp-feed', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 600000, // 10 minutes for large video uploads
      });

      if (response.data.success) {
        setStatusMessage({ type: 'success', text: `${activeTab.toUpperCase()} uploaded successfully!` });
        resetForm();
        fetchExistingItems();
      } else {
        throw new Error(response.data.message || 'Upload failed.');
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      setStatusMessage({ 
        type: 'error', 
        text: err.response?.data?.message || err.message || 'An error occurred during upload.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setLocation('');
    setCaption('');
    setDescription('');
    setTags('');
    setYtChannelName('');
    setYtSubscribeLink('');
    setWatchOnYtLink('');
    setSelectedVideo(null);
    setVideoPreview('');
    setSelectedImages([]);
    setImagePreviews([]);
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (imagesInputRef.current) imagesInputRef.current.value = '';
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this feed item from MongoDB and Cloudinary?')) return;
    
    try {
      const response = await api.delete(`/temp-feed/${id}`);
      if (response.data.success) {
        setExistingItems(prev => prev.filter(item => item._id !== id));
      } else {
        alert(response.data.message || 'Deletion failed.');
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Error deleting feed item.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-8 pb-32">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/home')}
          className={`p-2 rounded-full transition-colors ${
            isDarkMode ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'
          }`}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-black font-display tracking-tight text-text-main">
            Temporary Upload Portal
          </h1>
          <p className="text-[12px] text-text-muted">
            Upload custom feed items to test the dynamic home feed (MongoDB + Cloudinary).
          </p>
        </div>
      </div>

      {/* Tabs Selection */}
      <div className={`p-1 rounded-xl flex gap-1 ${isDarkMode ? 'bg-zinc-900/60 border border-border-secondary' : 'bg-zinc-100 border-[1.5px] border-zinc-900'}`}>
        <button
          onClick={() => { setActiveTab('reel'); resetForm(); setStatusMessage(null); }}
          className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-[12px] font-bold transition-all ${
            activeTab === 'reel'
              ? (isDarkMode ? 'bg-white text-black shadow-md' : 'bg-zinc-950 text-white shadow-md')
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          <Video size={16} />
          Upload Reel
        </button>
        <button
          onClick={() => { setActiveTab('post'); resetForm(); setStatusMessage(null); }}
          className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-[12px] font-bold transition-all ${
            activeTab === 'post'
              ? (isDarkMode ? 'bg-white text-black shadow-md' : 'bg-zinc-950 text-white shadow-md')
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          <ImageIcon size={16} />
          Upload Post
        </button>
        <button
          onClick={() => { setActiveTab('yt_video'); resetForm(); setStatusMessage(null); }}
          className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-[12px] font-bold transition-all ${
            activeTab === 'yt_video'
              ? (isDarkMode ? 'bg-white text-black shadow-md' : 'bg-zinc-950 text-white shadow-md')
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          <Youtube size={16} />
          YT Video
        </button>
        <button
          onClick={() => { setActiveTab('thumbnail_vote'); resetForm(); setStatusMessage(null); }}
          className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-[12px] font-bold transition-all ${
            activeTab === 'thumbnail_vote'
              ? (isDarkMode ? 'bg-white text-black shadow-md' : 'bg-zinc-950 text-white shadow-md')
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          <UploadCloud size={16} />
          Thumb Vote
        </button>
      </div>

      {/* Upload Form Card */}
      <form 
        onSubmit={handleSubmit}
        className={`rounded-3xl border p-6 space-y-6 transition-all ${
          isDarkMode ? 'bg-black border-border-main shadow-2xl' : 'bg-white border-zinc-950 border-[1.5px] shadow-md'
        }`}
      >
        {statusMessage && (
          <div className={`p-4 rounded-xl flex items-start gap-3 border ${
            statusMessage.type === 'success'
              ? 'bg-green-500/10 border-green-500/20 text-green-500'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
            <span className="text-[12px] font-medium">{statusMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Metadata Inputs */}
          <div className="space-y-4">
            {/* Creator Username */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">
                Creator Username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"><UserIcon size={14} /></span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. suvix_creator"
                  required
                  className={`w-full h-11 rounded-xl pl-10 pr-4 text-[13px] font-medium transition-all focus:outline-none ${
                    isDarkMode 
                      ? 'bg-zinc-950/60 border border-border-secondary text-white placeholder-text-muted/40 focus:border-zinc-500' 
                      : 'bg-white border-[1.5px] border-zinc-950 text-zinc-950 placeholder-zinc-400 focus:bg-zinc-50'
                  }`}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">
                Location
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"><MapPin size={14} /></span>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Dubai, UAE"
                  className={`w-full h-11 rounded-xl pl-10 pr-4 text-[13px] font-medium transition-all focus:outline-none ${
                    isDarkMode 
                      ? 'bg-zinc-950/60 border border-border-secondary text-white placeholder-text-muted/40 focus:border-zinc-500' 
                      : 'bg-white border-[1.5px] border-zinc-950 text-zinc-950 placeholder-zinc-400 focus:bg-zinc-50'
                  }`}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">
                Tags
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">#</span>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. funny, tech, viral"
                  className={`w-full h-11 rounded-xl pl-10 pr-4 text-[13px] font-medium transition-all focus:outline-none ${
                    isDarkMode 
                      ? 'bg-zinc-950/60 border border-border-secondary text-white placeholder-text-muted/40 focus:border-zinc-500' 
                      : 'bg-white border-[1.5px] border-zinc-950 text-zinc-950 placeholder-zinc-400 focus:bg-zinc-50'
                  }`}
                />
              </div>
            </div>

            {/* Watch on YT Link (Available for all tabs) */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">
                "Watch on YT" Link (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"><Youtube size={14} /></span>
                <input
                  type="url"
                  value={watchOnYtLink}
                  onChange={(e) => setWatchOnYtLink(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className={`w-full h-11 rounded-xl pl-10 pr-4 text-[13px] font-medium transition-all focus:outline-none ${
                    isDarkMode 
                      ? 'bg-zinc-950/60 border border-border-secondary text-white placeholder-text-muted/40 focus:border-zinc-500' 
                      : 'bg-white border-[1.5px] border-zinc-950 text-zinc-950 placeholder-zinc-400 focus:bg-zinc-50'
                  }`}
                />
              </div>
            </div>

            {/* Description/Caption textareas */}
            {activeTab === 'reel' ? (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">
                  Reel Description
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-text-muted"><FileText size={14} /></span>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter reel caption details here..."
                    className={`w-full rounded-xl pl-10 pr-4 py-3 text-[13px] font-medium transition-all focus:outline-none ${
                      isDarkMode 
                        ? 'bg-zinc-950/60 border border-border-secondary text-white placeholder-text-muted/40 focus:border-zinc-500' 
                        : 'bg-white border-[1.5px] border-zinc-950 text-zinc-950 placeholder-zinc-400 focus:bg-zinc-50'
                    }`}
                  />
                </div>
              </div>
            ) : (activeTab === 'post' || activeTab === 'thumbnail_vote') ? (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">
                  {activeTab === 'thumbnail_vote' ? 'Vote Context/Caption' : 'Post Caption'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-text-muted"><FileText size={14} /></span>
                  <textarea
                    rows={4}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder={activeTab === 'thumbnail_vote' ? 'e.g. Help me choose!' : 'Describe your post...'}
                    className={`w-full rounded-xl pl-10 pr-4 py-3 text-[13px] font-medium transition-all focus:outline-none ${
                      isDarkMode 
                        ? 'bg-zinc-950/60 border border-border-secondary text-white placeholder-text-muted/40 focus:border-zinc-500' 
                        : 'bg-white border-[1.5px] border-zinc-950 text-zinc-950 placeholder-zinc-400 focus:bg-zinc-50'
                    }`}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">
                    YT Video Description
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-text-muted"><FileText size={14} /></span>
                    <textarea
                      rows={2}
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Enter description..."
                      className={`w-full rounded-xl pl-10 pr-4 py-3 text-[13px] font-medium transition-all focus:outline-none ${
                        isDarkMode 
                          ? 'bg-zinc-950/60 border border-border-secondary text-white placeholder-text-muted/40 focus:border-zinc-500' 
                          : 'bg-white border-[1.5px] border-zinc-950 text-zinc-950 placeholder-zinc-400 focus:bg-zinc-50'
                      }`}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">
                    YT Channel Name
                  </label>
                  <input
                    type="text"
                    value={ytChannelName}
                    onChange={(e) => setYtChannelName(e.target.value)}
                    placeholder="e.g. MKBHD"
                    className={`w-full h-11 rounded-xl px-4 text-[13px] font-medium transition-all focus:outline-none ${
                      isDarkMode 
                        ? 'bg-zinc-950/60 border border-border-secondary text-white placeholder-text-muted/40 focus:border-zinc-500' 
                        : 'bg-white border-[1.5px] border-zinc-950 text-zinc-950 placeholder-zinc-400 focus:bg-zinc-50'
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">
                    YT Subscribe Link
                  </label>
                  <input
                    type="text"
                    value={ytSubscribeLink}
                    onChange={(e) => setYtSubscribeLink(e.target.value)}
                    placeholder="e.g. https://youtube.com/..."
                    className={`w-full h-11 rounded-xl px-4 text-[13px] font-medium transition-all focus:outline-none ${
                      isDarkMode 
                        ? 'bg-zinc-950/60 border border-border-secondary text-white placeholder-text-muted/40 focus:border-zinc-500' 
                        : 'bg-white border-[1.5px] border-zinc-950 text-zinc-950 placeholder-zinc-400 focus:bg-zinc-50'
                    }`}
                  />
                </div>
              </>
            )}
          </div>

          {/* Right: Media Files upload */}
          <div className="flex flex-col">
            <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted mb-1.5">
              Media File
            </span>
            
            {(activeTab === 'reel' || activeTab === 'yt_video') ? (
              // Reel/Video File Uploader
              <div className="flex-1 flex flex-col">
                {!videoPreview ? (
                  <div 
                    onClick={() => videoInputRef.current?.click()}
                    className={`flex-1 min-h-[160px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
                      isDarkMode 
                        ? 'bg-zinc-950/40 border-border-main hover:bg-zinc-950/80 hover:border-zinc-500' 
                        : 'bg-zinc-50 border-zinc-300 hover:bg-zinc-100/60 hover:border-zinc-900'
                    }`}
                  >
                    <UploadCloud size={32} className="text-text-muted mb-2.5" />
                    <p className="text-[12px] font-semibold text-text-main">Click or Drag video to upload</p>
                    <p className="text-[10px] text-text-muted mt-1">MP4, MOV, or WebM format</p>
                    <input 
                      type="file" 
                      ref={videoInputRef} 
                      onChange={handleVideoSelect} 
                      accept="video/*" 
                      className="hidden" 
                    />
                  </div>
                ) : (
                  <div className={`relative flex-1 rounded-2xl overflow-hidden aspect-[4/5] border ${
                    isDarkMode ? 'border-border-main bg-zinc-950' : 'border-zinc-950 border-[1.5px] bg-zinc-50'
                  }`}>
                    <video 
                      src={videoPreview} 
                      controls 
                      className="w-full h-full object-cover" 
                    />
                    <button
                      type="button"
                      onClick={removeSelectedVideo}
                      className="absolute top-3 right-3 bg-black/75 hover:bg-black text-white p-1.5 rounded-full transition-colors z-10 shadow"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col space-y-3">
                <div 
                  className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-colors ${
                    isDarkMode 
                      ? 'border-border-secondary bg-zinc-950/40 hover:bg-zinc-900/60 hover:border-zinc-500' 
                      : 'border-zinc-300 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-400'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImagesSelect}
                    ref={imagesInputRef}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
                    <ImageIcon size={24} />
                  </div>
                  <p className="text-[13px] font-bold text-text-main mb-1">
                    Upload Images
                  </p>
                  <p className="text-[11px] font-medium text-text-muted mb-4 text-center">
                    {activeTab === 'thumbnail_vote' 
                      ? 'Select 2 to 4 images.'
                      : 'Select one or more images.'} PNG, JPG, WEBP up to 10MB
                  </p>
                  <button
                    type="button"
                    onClick={() => imagesInputRef.current?.click()}
                    className={`px-5 py-2.5 rounded-full text-[12px] font-bold transition-all ${
                      isDarkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-950 text-white hover:bg-zinc-800'
                    }`}
                  >
                    Browse Files
                  </button>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[180px] p-1 border border-transparent rounded-xl">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-border-secondary bg-border-secondary shadow-sm group">
                        <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeSelectedImage(index)}
                          className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white p-1 rounded-full opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                        <span className="absolute bottom-1 left-1 bg-black/60 px-1 py-0.5 rounded text-[8px] text-white font-bold leading-none">
                          {index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full h-11 rounded-xl flex items-center justify-center gap-2 text-[13px] font-black uppercase tracking-widest text-white shadow-lg active:scale-[0.98] transition-all bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 disabled:opacity-50 disabled:pointer-events-none`}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Uploading to Cloudinary...
            </>
          ) : (
            `Publish ${activeTab.toUpperCase()}`
          )}
        </button>
      </form>

      {/* Dashboard Section - Manage uploaded items */}
      <div className="space-y-4">
        <h2 className="text-[14px] font-black font-display uppercase tracking-widest text-text-main">
          Manage Uploaded Content ({existingItems.length})
        </h2>

        {isLoadingItems ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-text-muted" />
          </div>
        ) : existingItems.length === 0 ? (
          <div className={`text-center py-12 rounded-3xl border border-dashed ${
            isDarkMode ? 'border-border-main text-text-muted' : 'border-zinc-300 text-zinc-500'
          }`}>
            <p className="text-[12px]">No custom uploads in MongoDB yet.</p>
            <p className="text-[10px] opacity-75 mt-1">Upload reels or posts above to see them list here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {existingItems.map((item) => (
              <div 
                key={item._id}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  isDarkMode ? 'bg-zinc-950/40 border-border-main hover:bg-zinc-900/40' : 'bg-white border-zinc-950 border-[1.5px] hover:bg-zinc-50/50 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-lg bg-zinc-800 shrink-0 overflow-hidden border border-border-secondary">
                    {item.type === 'post' && item.images && item.images[0] ? (
                      <img src={item.images[0]} alt="Post Thumbnail" className="w-full h-full object-cover" />
                    ) : item.videoUrl ? (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white">
                        <Video size={16} />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white">
                        <X size={16} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded leading-none ${
                        item.type === 'reel' ? 'bg-rose-500/10 text-rose-500' :
                        item.type === 'yt_video' ? 'bg-red-500/10 text-red-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {item.type === 'yt_video' ? 'YT Video' : item.type}
                      </span>
                      <span className="text-[10px] font-bold text-text-main truncate">@{item.user}</span>
                    </div>
                    <p className="text-[11px] text-text-muted truncate mt-1">
                      {item.comment || 'No caption'}
                    </p>
                    <p className="text-[9px] text-text-muted/65 mt-0.5">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(item._id)}
                  className={`p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0 ${
                    !isDarkMode && 'border border-transparent hover:border-rose-200'
                  }`}
                  title="Delete from MongoDB and Cloudinary"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
