import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import type { AppRole } from '../types/auth';

/**
 * useUserRole — Centralized, Production-Grade Role Hook (Single Source of Truth)
 * 
 * Provides consistent, conflict-free role checks across the entire frontend.
 * The core domain roles are: 'creator' | 'editor' | 'brand' | 'user' | 'admin'.
 */
export const useUserRole = () => {
  const user = useSelector(selectUser);
  const role = (user?.role || 'user').toLowerCase() as AppRole;

  return {
    user,
    role,
    isCreator: role === 'creator',
    isEditor: role === 'editor',
    isBrand: role === 'brand',
    isUser: role === 'user',
    isAdmin: role === 'admin',
    // Platform capabilities (independent of role)
    hasYouTube: Boolean(
      (Array.isArray(user?.youtubeProfile) && user.youtubeProfile.length > 0) ||
      (Array.isArray(user?.youtubeChannels) && user.youtubeChannels.length > 0) ||
      user?.channelLinkStatus === 'LINKED' ||
      Boolean(user?.creatorProfile?.channels && user.creatorProfile.channels.length > 0)
    ),
    hasInstagram: Boolean(
      user?.instagramProfile ||
      (Array.isArray(user?.instagramAccounts) && user.instagramAccounts.length > 0)
    ),
  };
};
