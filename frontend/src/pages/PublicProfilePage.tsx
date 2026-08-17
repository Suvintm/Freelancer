import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import { getPublicProfile } from '../api/services/publicProfile';
import { getTemplate, DEFAULT_TEMPLATE_SLUG } from '../linkinbio/templates/registry';
import type { CreatorInfo, ProfileBlock } from '../linkinbio/types/profile.types';
import type { ResolvedTheme } from '../linkinbio/types/template.types';
import { Share2, Loader2, ArrowLeft } from 'lucide-react';

export const PublicProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;

      // 1. Check if user is viewing their own published profile in local storage draft
      const userKey = user?.id ? `suvix_link_in_bio_config_${user.id}` : 'suvix_link_in_bio_config_default';
      const localData = localStorage.getItem(userKey);

      if (user?.username === username && localData) {
        try {
          const parsed = JSON.parse(localData);
          setProfileData(parsed);
          setLoading(false);
          return;
        } catch (e) {
          console.warn('Error parsing local profile data', e);
        }
      }

      // 2. Fetch from backend API
      try {
        setLoading(true);
        const data = await getPublicProfile(username);
        setProfileData(data);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setError('Profile not found');
        } else {
          setError('Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, user]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${creator.displayName} on SuviX`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing', err);
    }
  };

  const templateSlug = profileData?.templateSlug || profileData?.template_slug || DEFAULT_TEMPLATE_SLUG;
  const templateDef = useMemo(() => getTemplate(templateSlug), [templateSlug]);
  const TemplateComponent = templateDef.component;

  const creator: CreatorInfo = useMemo(() => {
    if (profileData?.creator) return profileData.creator;
    return {
      id: profileData?.userId || profileData?.user?.id || 'creator',
      username: username || profileData?.user?.username || 'creator',
      displayName: profileData?.displayName || profileData?.user?.profile?.name || 'Creator',
      bio: profileData?.bio || profileData?.user?.profile?.bio || '',
      profilePicture: profileData?.user?.profile?.profile_picture || profileData?.profilePicture || null,
      isVerified: Boolean(profileData?.user?.profile?.is_verified),
    };
  }, [profileData, username]);

  const blocks: ProfileBlock[] = useMemo(() => {
    if (profileData?.blocks) {
      return profileData.blocks.map((b: any, i: number) => ({
        id: b.id || `block-${i}`,
        type: b.type || 'LINK',
        title: b.title || 'Link',
        url: b.url || '#',
        orderIndex: b.orderIndex !== undefined ? b.orderIndex : i,
        isVisible: b.isVisible !== undefined ? b.isVisible : true,
      }));
    }
    return [];
  }, [profileData]);

  const theme: ResolvedTheme = useMemo(() => {
    const defaults: Record<string, any> = {};
    for (const [key, control] of Object.entries(templateDef.config.themeSchema)) {
      defaults[key] = (control as any)?.default;
    }
    const overrides = profileData?.themeConfig || profileData?.theme_config || {};
    return { ...defaults, ...overrides };
  }, [templateDef, profileData]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center text-white p-6">
        <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
        <p className="text-gray-400 mb-6 text-center max-w-sm">
          The creator profile you're looking for doesn't exist or is currently inactive.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition active:scale-95 cursor-pointer"
        >
          Go Home
        </button>
      </div>
    );
  }

  const pageBg = String(theme?.backgroundColor || '#FAF7F2');

  return (
    <div
      className="min-h-screen w-full relative flex flex-col items-center justify-between transition-colors duration-300"
      style={{ backgroundColor: pageBg }}
    >
      {/* Floating Top Navigation */}
      <header className="fixed top-4 left-4 right-4 max-w-4xl mx-auto flex justify-between items-center pointer-events-none z-50">
        <button
          onClick={() => navigate(-1)}
          className="pointer-events-auto p-2.5 rounded-full bg-black/10 hover:bg-black/20 backdrop-blur-md border border-black/10 transition cursor-pointer text-[#1E1A17] dark:text-white shadow-sm"
          aria-label="Go Back"
        >
          <ArrowLeft size={16} />
        </button>

        <button
          onClick={handleShare}
          className="pointer-events-auto p-2.5 rounded-full bg-black/10 hover:bg-black/20 backdrop-blur-md border border-black/10 transition cursor-pointer text-[#1E1A17] dark:text-white shadow-sm"
          aria-label="Share profile"
        >
          <Share2 size={16} />
        </button>
      </header>

      {/* Main Responsive Profile Canvas View */}
      <main className="w-full flex-1 flex flex-col items-center justify-start pt-12 sm:pt-14 pb-8">
        <div className="w-full max-w-md sm:max-w-lg md:max-w-xl px-4 sm:px-6">
          <Suspense
            fallback={
              <div className="w-full min-h-[500px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#736154]" />
              </div>
            }
          >
            <TemplateComponent
              creator={creator}
              blocks={blocks}
              theme={theme}
              isEditing={false}
            />
          </Suspense>
        </div>
      </main>

      {/* Verified Footer */}
      <footer className="pb-6 pt-2 flex justify-center w-full z-10 select-none">
        <a
          href="/"
          className="text-xs font-semibold text-[#6B5E55]/60 hover:text-[#6B5E55] transition flex items-center gap-1.5"
        >
          Powered by <span className="font-bold tracking-tight text-[#1E1A17]">SuviX</span>
        </a>
      </footer>
    </div>
  );
};

export default PublicProfilePage;
