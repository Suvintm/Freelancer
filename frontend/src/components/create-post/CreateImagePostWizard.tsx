import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Settings,
  Sliders,
  MapPin,
  Users,
  Music,
  Lock,
  MessageSquareOff,
  EyeOff,
  Calendar,
  Type
} from 'lucide-react';

export interface MediaItem {
  id: string;
  file: File;
  previewUrl: string;
  brightness: number;
  contrast: number;
  saturation: number;
  altText: string;
}

export interface CreatePostData {
  mediaItems: MediaItem[];
  caption: string;
  location: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  allowComments: boolean;
  hideLikeCount: boolean;
  scheduledAt: string;
}

interface CreateImagePostWizardProps {
  onSubmit: (data: CreatePostData) => Promise<void>;
  isSubmitting: boolean;
}

export default function CreateImagePostWizard({ onSubmit, isSubmitting }: CreateImagePostWizardProps) {
  const [step, setStep] = useState(1);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop state
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // Step 3 State
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  
  // Step 4 State
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [allowComments, setAllowComments] = useState(true);
  const [hideLikeCount, setHideLikeCount] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validImages = files.filter(f => f.type.startsWith('image/'));
    if (validImages.length === 0) return;

    const newItems = validImages.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      brightness: 100,
      contrast: 100,
      saturation: 100,
      altText: ''
    }));

    setMediaItems(prev => [...prev, ...newItems].slice(0, 10)); // Max 10
  };

  const removeMedia = (id: string) => {
    setMediaItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(i => i.id !== id);
    });
    if (selectedMediaId === id) setSelectedMediaId(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === targetId) return;

    const items = [...mediaItems];
    const draggedIndex = items.findIndex(i => i.id === draggedItemId);
    const targetIndex = items.findIndex(i => i.id === targetId);

    const [draggedItem] = items.splice(draggedIndex, 1);
    items.splice(targetIndex, 0, draggedItem);
    
    setMediaItems(items);
    setDraggedItemId(null);
  };

  const updateMediaFilter = (id: string, filter: keyof MediaItem, value: number | string) => {
    setMediaItems(prev => prev.map(item => 
      item.id === id ? { ...item, [filter]: value } : item
    ));
  };

  const handleNext = () => {
    if (step === 1 && mediaItems.length === 0) return;
    setStep(prev => Math.min(prev + 1, 4));
  };

  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const handleFinalSubmit = () => {
    onSubmit({
      mediaItems,
      caption,
      location,
      visibility,
      allowComments,
      hideLikeCount,
      scheduledAt
    });
  };

  // Step 1: Selection
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Select Media</h2>
        <p className="text-zinc-500 text-sm">Upload up to 10 photos. Drag to reorder.</p>
      </div>

      {mediaItems.length > 0 ? (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
          {mediaItems.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, item.id)}
              className={`relative group rounded-xl overflow-hidden aspect-square bg-zinc-100 dark:bg-zinc-800 cursor-move ${
                draggedItemId === item.id ? 'opacity-50' : 'opacity-100'
              }`}
            >
              <img 
                src={item.previewUrl} 
                alt="preview" 
                className="w-full h-full object-cover transition-transform group-hover:scale-105" 
              />
              <button
                type="button"
                onClick={() => removeMedia(item.id)}
                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black text-white rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {mediaItems.length < 10 && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 cursor-pointer aspect-square bg-zinc-50 dark:bg-zinc-800/50 transition-colors"
            >
              <UploadCloud className="w-6 h-6 text-zinc-400 mb-1" />
              <span className="text-xs text-zinc-500 font-medium">Add more</span>
            </div>
          )}
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-16 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-zinc-50 dark:bg-zinc-800/30 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/60 group"
        >
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8 text-zinc-900 dark:text-white" />
          </div>
          <p className="text-zinc-900 dark:text-zinc-100 font-semibold">Click to upload images</p>
        </div>
      )}
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple accept="image/*" />
    </div>
  );

  // Step 2: Edit
  const renderStep2 = () => {
    const selectedMedia = mediaItems.find(i => i.id === selectedMediaId) || mediaItems[0];
    if (!selectedMedia) return null;

    return (
      <div className="flex flex-col md:flex-row gap-6">
        {/* Editor Preview */}
        <div className="w-full md:w-2/3">
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/5] flex items-center justify-center shadow-inner">
            <img 
              src={selectedMedia.previewUrl} 
              alt="edit preview" 
              className="max-w-full max-h-full object-contain transition-all duration-200"
              style={{
                filter: `brightness(${selectedMedia.brightness}%) contrast(${selectedMedia.contrast}%) saturate(${selectedMedia.saturation}%)`
              }}
            />
          </div>
          {/* Thumbnails to select which to edit */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 custom-scrollbar">
            {mediaItems.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedMediaId(item.id)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  (selectedMediaId === item.id || (!selectedMediaId && mediaItems[0].id === item.id)) 
                    ? 'border-black dark:border-white opacity-100' 
                    : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <img src={item.previewUrl} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Adjustments panel */}
        <div className="w-full md:w-1/3 space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <Sliders className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Adjustments</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="flex justify-between text-sm font-medium mb-2">
                <span>Brightness</span>
                <span className="text-zinc-500">{selectedMedia.brightness}%</span>
              </label>
              <input 
                type="range" min="0" max="200" 
                value={selectedMedia.brightness}
                onChange={(e) => updateMediaFilter(selectedMedia.id, 'brightness', Number(e.target.value))}
                className="w-full accent-black dark:accent-white"
              />
            </div>
            <div>
              <label className="flex justify-between text-sm font-medium mb-2">
                <span>Contrast</span>
                <span className="text-zinc-500">{selectedMedia.contrast}%</span>
              </label>
              <input 
                type="range" min="0" max="200" 
                value={selectedMedia.contrast}
                onChange={(e) => updateMediaFilter(selectedMedia.id, 'contrast', Number(e.target.value))}
                className="w-full accent-black dark:accent-white"
              />
            </div>
            <div>
              <label className="flex justify-between text-sm font-medium mb-2">
                <span>Saturation</span>
                <span className="text-zinc-500">{selectedMedia.saturation}%</span>
              </label>
              <input 
                type="range" min="0" max="200" 
                value={selectedMedia.saturation}
                onChange={(e) => updateMediaFilter(selectedMedia.id, 'saturation', Number(e.target.value))}
                className="w-full accent-black dark:accent-white"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Step 3: Context
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        {mediaItems[0] && (
          <img src={mediaItems[0].previewUrl} className="w-16 h-16 rounded-lg object-cover" />
        )}
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption... (Use @ to mention, # for tags)"
          rows={4}
          className="w-full p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-black dark:focus:ring-white focus:bg-white dark:focus:bg-zinc-900 outline-none transition-all resize-none"
        />
      </div>

      <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        {/* Location input instead of just a placeholder */}
        <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-5 h-5 text-zinc-500" />
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Location (Optional)</span>
          </div>
          <input 
            type="text" 
            placeholder="Search location or type custom..." 
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full p-2 bg-zinc-100 dark:bg-zinc-800 rounded outline-none"
          />
        </div>
        
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group cursor-pointer border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-zinc-500" />
            <span className="font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white">Tag People (Followers only)</span>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-400" />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group cursor-pointer opacity-50 border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-zinc-500" />
            <div className="flex flex-col">
              <span className="font-medium">Invite Collaborator</span>
              <span className="text-xs text-zinc-500">Coming soon (UI mockup)</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-400" />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group cursor-pointer opacity-50 border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            <Music className="w-5 h-5 text-zinc-500" />
            <div className="flex flex-col">
              <span className="font-medium">Add Music</span>
              <span className="text-xs text-zinc-500">Coming soon (UI mockup)</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-400" />
        </div>
      </div>
    </div>
  );

  // Step 4: Advanced
  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-6 h-6" />
        <h2 className="text-xl font-bold">Advanced Settings</h2>
      </div>

      <div className="space-y-6">
        {/* Visibility */}
        <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-xl space-y-3">
          <h4 className="font-medium flex items-center gap-2"><Lock className="w-4 h-4"/> Audience</h4>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={visibility === 'PUBLIC'} onChange={() => setVisibility('PUBLIC')} className="w-4 h-4 text-black focus:ring-black accent-black" />
              <span>Public</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={visibility === 'PRIVATE'} onChange={() => setVisibility('PRIVATE')} className="w-4 h-4 text-black focus:ring-black accent-black" />
              <span>Private</span>
            </label>
          </div>
        </div>

        {/* Engagement Controls */}
        <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-medium flex items-center gap-2"><MessageSquareOff className="w-4 h-4"/> Turn off commenting</span>
              <span className="text-xs text-zinc-500">Hide the comment box for this post.</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={!allowComments} onChange={(e) => setAllowComments(!e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-black dark:peer-checked:bg-white"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-medium flex items-center gap-2"><EyeOff className="w-4 h-4"/> Hide like counts</span>
              <span className="text-xs text-zinc-500">Focus on content over metrics.</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={hideLikeCount} onChange={(e) => setHideLikeCount(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-black dark:peer-checked:bg-white"></div>
            </label>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-xl">
          <h4 className="font-medium flex items-center gap-2 mb-3"><Calendar className="w-4 h-4"/> Schedule Post</h4>
          <input 
            type="datetime-local" 
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none" 
          />
        </div>

        {/* Alt Text */}
        <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-xl space-y-3">
          <h4 className="font-medium flex items-center gap-2"><Type className="w-4 h-4"/> Accessibility (Alt Text)</h4>
          {mediaItems.map(item => (
            <div key={item.id} className="flex gap-3 items-center">
              <img src={item.previewUrl} className="w-12 h-12 rounded object-cover flex-shrink-0" />
              <input 
                type="text"
                placeholder="Write alt text..."
                value={item.altText}
                onChange={(e) => updateMediaFilter(item.id, 'altText', e.target.value)}
                className="w-full p-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {/* Stepper Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          {step > 1 && (
            <button onClick={handleBack} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <span className="font-semibold">
            {step === 1 && 'Select Media'}
            {step === 2 && 'Edit'}
            {step === 3 && 'Details'}
            {step === 4 && 'Advanced'}
          </span>
        </div>
        <div className="flex gap-2">
          {[1,2,3,4].map(s => (
            <div key={s} className={`h-2 rounded-full transition-all ${step >= s ? 'bg-black dark:bg-white w-8' : 'bg-zinc-200 dark:bg-zinc-800 w-2'}`} />
          ))}
        </div>
        <div>
          {step < 4 ? (
            <button 
              onClick={handleNext} 
              disabled={step === 1 && mediaItems.length === 0}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full font-medium hover:opacity-90 disabled:opacity-50 transition-all"
            >
              Next
            </button>
          ) : (
            <button 
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-all"
            >
              {isSubmitting ? 'Sharing...' : 'Share'}
            </button>
          )}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
