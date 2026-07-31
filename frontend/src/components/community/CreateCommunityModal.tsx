import React, { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { X, Youtube, ShieldAlert, Users, Info, ChevronDown, Check, Loader2, Sparkles } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { api } from '../../api/client'; // Corrected named import

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (community: any) => void;
}

const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { isDarkMode } = useTheme();
  const user = useSelector(selectUser);
  const youtubeChannels = user?.youtubeProfile || [];
  
  const [step, setStep] = useState(1);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rules: '',
    isPrivate: false,
    thumbnail: '',
    bannerUrl: '',
    category: 'CREATOR',
  });

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedChannel(null);
      setFormData({
        name: '',
        description: '',
        rules: '',
        isPrivate: false,
        thumbnail: '',
        bannerUrl: '',
        category: 'CREATOR',
      });
      setIsDropdownOpen(false);
    }
  }, [isOpen]);

  // Magic Auto-fill when channel selected
  useEffect(() => {
    if (selectedChannel) {
      setFormData(prev => ({
        ...prev,
        name: selectedChannel.channel_name || prev.name,
        thumbnail: selectedChannel.thumbnail_url || prev.thumbnail,
        bannerUrl: selectedChannel.banner_url || prev.bannerUrl,
      }));
      // Auto advance to step 2 after selecting channel (with small delay for magic effect)
      setTimeout(() => {
        setStep(2);
      }, 600);
    }
  }, [selectedChannel]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    try {
      setIsLoading(true);
      const payload = {
        ...formData,
        ytProfileId: selectedChannel?.id,
      };

      const res = await api.post('/communities', payload);
      
      if (res.data?.success) {
        if (onSuccess) onSuccess(res.data.data);
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to create community', error);
      alert(error.response?.data?.message || 'Failed to create community');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className={`relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 ${
        isDarkMode ? 'bg-zinc-900 border border-white/10 text-white' : 'bg-white border border-black/5 text-zinc-900'
      }`}>
        
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${
          isDarkMode ? 'border-white/10' : 'border-black/5'
        }`}>
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            Build Your Community
          </h2>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto overflow-x-hidden max-h-[70vh] custom-scrollbar">
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8 px-4 relative">
            <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-zinc-200 dark:bg-zinc-800 -z-10" />
            <div className="absolute left-8 top-1/2 -translate-y-1/2 h-0.5 bg-blue-500 -z-10 transition-all duration-500" style={{ width: step === 2 ? '100%' : '0%' }} />
            
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
              step >= 1 ? 'bg-blue-500 text-white' : 'bg-zinc-200 text-zinc-500'
            }`}>1</div>
            
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-500 ${
              step >= 2 ? 'bg-blue-500 text-white' : (isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-500')
            }`}>2</div>
          </div>

          {/* STEP 1: Select Channel */}
          {step === 1 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300">
              <h3 className="font-bold text-xl mb-2">Select your YouTube Channel</h3>
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                We will automatically fetch your channel's branding and link it to your new community.
              </p>

              {youtubeChannels.length === 0 ? (
                <div className={`p-6 rounded-2xl text-center border ${
                  isDarkMode ? 'bg-zinc-800/50 border-white/5' : 'bg-zinc-50 border-black/5'
                }`}>
                  <Youtube className="w-10 h-10 text-red-500 mx-auto mb-3" />
                  <p className="font-bold mb-1">No channels found</p>
                  <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Please connect a YouTube channel to your account first.
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                      isDropdownOpen 
                        ? 'border-blue-500' 
                        : (isDarkMode ? 'border-white/10 hover:border-white/20' : 'border-black/5 hover:border-black/10')
                    } ${isDarkMode ? 'bg-black/20' : 'bg-zinc-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      {selectedChannel ? (
                        <>
                          <img src={selectedChannel.thumbnail_url} alt="" className="w-8 h-8 rounded-full" />
                          <span className="font-bold">{selectedChannel.channel_name}</span>
                        </>
                      ) : (
                        <>
                          <Youtube className={`w-6 h-6 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
                          <span className={isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}>Choose a channel...</span>
                        </>
                      )}
                    </div>
                    <ChevronDown className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className={`absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-xl z-10 overflow-hidden ${
                      isDarkMode ? 'bg-zinc-800 border-white/10' : 'bg-white border-black/5'
                    }`}>
                      {youtubeChannels.map((channel: any) => (
                        <button
                          key={channel.id}
                          onClick={() => {
                            setSelectedChannel(channel);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 p-4 transition-colors ${
                            isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'
                          }`}
                        >
                          <img src={channel.thumbnail_url} alt="" className="w-10 h-10 rounded-full bg-zinc-200" />
                          <div className="text-left flex-1">
                            <p className="font-bold">{channel.channel_name}</p>
                            <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              {parseInt(channel.subscriber_count || '0').toLocaleString()} subscribers
                            </p>
                          </div>
                          {selectedChannel?.id === channel.id && (
                            <Check className="w-5 h-5 text-blue-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Customization & Privacy */}
          {step === 2 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300">
              
              {/* Magic Preview Box */}
              <div className={`p-4 rounded-2xl mb-6 flex items-center gap-4 relative overflow-hidden ${
                isDarkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
              }`}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <div className="relative">
                  <img src={formData.thumbnail} alt="" className="w-14 h-14 rounded-full border-2 border-white/50 object-cover" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-transparent">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-500 mb-0.5 uppercase tracking-wider">Magic Auto-fill</p>
                  <p className="font-bold text-lg">{formData.name}</p>
                </div>
              </div>

              {/* Privacy Toggle */}
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3">Privacy Settings</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setFormData({ ...formData, isPrivate: false })}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      !formData.isPrivate 
                        ? 'border-blue-500 bg-blue-500/5' 
                        : (isDarkMode ? 'border-white/5 hover:border-white/10' : 'border-black/5 hover:border-black/10')
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Users className={`w-5 h-5 ${!formData.isPrivate ? 'text-blue-500' : ''}`} />
                      <span className="font-bold">Public</span>
                    </div>
                    <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Anyone can discover and join your community.</p>
                  </button>
                  
                  <button 
                    onClick={() => setFormData({ ...formData, isPrivate: true })}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      formData.isPrivate 
                        ? 'border-purple-500 bg-purple-500/5' 
                        : (isDarkMode ? 'border-white/5 hover:border-white/10' : 'border-black/5 hover:border-black/10')
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldAlert className={`w-5 h-5 ${formData.isPrivate ? 'text-purple-500' : ''}`} />
                      <span className="font-bold">Private</span>
                    </div>
                    <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Invite only. Users need a special code to join.</p>
                  </button>
                </div>
                
                {/* DANGER WARNING */}
                <div className={`mt-3 p-3 rounded-xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${
                  isDarkMode ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
                }`}>
                  <Info className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm font-medium leading-snug">
                    <strong className="block mb-0.5">Important Note:</strong>
                    You cannot change the privacy setting after the community is created. Please choose carefully!
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block font-bold mb-2">Community Description (Optional)</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Welcome to my awesome channel community! Here we talk about..."
                  className={`w-full p-4 rounded-2xl border transition-colors resize-none h-24 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    isDarkMode ? 'bg-black/20 border-white/10' : 'bg-zinc-50 border-black/5'
                  }`}
                />
              </div>

              {/* Rules */}
              <div className="mb-2">
                <label className="block font-bold mb-2">Community Rules (Optional)</label>
                <textarea 
                  value={formData.rules}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                  placeholder="1. Be respectful to others.&#10;2. No spam or self-promotion."
                  className={`w-full p-4 rounded-2xl border transition-colors resize-none h-24 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    isDarkMode ? 'bg-black/20 border-white/10' : 'bg-zinc-50 border-black/5'
                  }`}
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className={`p-4 border-t flex justify-end gap-3 ${
          isDarkMode ? 'border-white/10 bg-zinc-900/50' : 'border-black/5 bg-zinc-50'
        }`}>
          {step === 2 && (
            <button 
              onClick={() => setStep(1)}
              className={`px-5 py-2.5 rounded-xl font-bold transition-colors ${
                isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'
              }`}
            >
              Back
            </button>
          )}
          
          {step === 1 ? (
            <button 
              disabled={!selectedChannel}
              onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-xl bg-blue-500 text-white font-bold transition-all hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Step
            </button>
          ) : (
            <button 
              onClick={handleCreate}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-blue-500 text-white font-bold transition-all hover:bg-blue-600 active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>Create Community</>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default CreateCommunityModal;
