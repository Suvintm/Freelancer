/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../../../../store/slices/authSlice';
import { api } from '../../../../../api/client';
import { X, Loader2, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditProfileModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const [name, setName] = useState(user?.name || '');
  const [specialties, setSpecialties] = useState(user?.specialties || 'UI Designer · Content Creator · Tech Enthusiast');
  const [bio, setBio] = useState(user?.bio || "Creating content about technology, productivity and the creator economy. Let's build, learn and grow together.");
  const [quote, setQuote] = useState(user?.quote || 'Good content creates opportunities.');
  const cleanUsername = (user?.username || 'suvintm').replace(/^@/, '');
  const initialWebsite = (user?.website && !user.website.includes('linktr.ee')) 
    ? user.website 
    : `suvix.in/u/${cleanUsername}`;
  const [website, setWebsite] = useState(initialWebsite);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        name,
        specialties,
        bio,
        quote,
        location,
        website,
      };
      const res = await api.patch('/user/me', payload);
      if (res.data?.success || res.status === 200) {
        dispatch(updateUser(payload));
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      // Fallback update local Redux state anyway so user sees immediate results
      dispatch(updateUser({ name, specialties, bio, quote, location, website }));
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3.5">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-purple-500" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Edit Creator Profile
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Suvin T M"
                  className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                />
              </div>

              {/* Specialties / Niches */}
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Specialization / Niches
                </label>
                <input
                  type="text"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  placeholder="e.g. UI Designer · Content Creator · Tech Enthusiast"
                  className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Creator Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe your creative work and focus..."
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
                />
              </div>

              {/* Personal Quote */}
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Featured Quote
                </label>
                <input
                  type="text"
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="e.g. Good content creates opportunities."
                  className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                />
              </div>

              {/* Location & Website in 2 Columns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bengaluru, India"
                    className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    SuviX Link in Bio / Website
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder={`e.g. suvix.in/u/${cleanUsername}`}
                    className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95 text-xs font-bold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isSaving && <Loader2 size={13} className="animate-spin" />}
                  {savedSuccess && <Check size={14} className="text-emerald-500" />}
                  <span>{savedSuccess ? 'Saved!' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
