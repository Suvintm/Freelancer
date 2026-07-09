/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useProfileData } from './hooks/useProfileData';
import { Banner } from './sections/Banner';
import { ProfileIdentity } from './sections/ProfileIdentity';
import { CreatorTools } from './sections/CreatorTools';
import { ContentTabs } from './sections/ContentTabs';
import { FeedGrid } from './sections/FeedGrid';

const formatCount = (num?: number | string) => {
  if (!num) return '0';
  const n = Number(num);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
};

export const DesktopProfile = () => {
  const profileData = useProfileData();

  if (!profileData.user) return null;

  const youtubeProfiles = profileData.user?.youtubeProfile || [];
  const totalVideos = youtubeProfiles.reduce((acc: number, p: any) => acc + (p.video_count || 0), 0);

  return (
    <div className="hidden lg:flex w-full flex-col min-h-full pb-20 items-center">
      {/* Main Container - Centered, matching Suvix style */}
      <div className="w-full max-w-[1000px] bg-card rounded-[32px] border border-border-main shadow-sm overflow-hidden flex flex-col mb-10">
        
        {/* Top Split Area */}
        <div className="flex w-full p-6">
          {/* Left: Banner (50%) */}
          <div className="w-1/2 relative pr-6">
            <Banner user={profileData.user} />
          </div>
          
          {/* Right: Stats (50%) */}
          <div className="w-1/2 flex items-center justify-center bg-card">
            <div className="flex items-center gap-12">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-semibold text-text-main leading-none">{formatCount(totalVideos)}</span>
                <span className="text-xs font-medium text-text-muted uppercase tracking-widest mt-2">Posts</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-semibold text-text-main leading-none">{formatCount(profileData.user?.followers)}</span>
                <span className="text-xs font-medium text-text-muted uppercase tracking-widest mt-2">Followers</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-semibold text-text-main leading-none">{formatCount(profileData.user?.following)}</span>
                <span className="text-xs font-medium text-text-muted uppercase tracking-widest mt-2">Following</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-8 pb-8 relative z-10">
          <div className="flex items-start justify-between w-full">
            <ProfileIdentity user={profileData.user} />
            <CreatorTools user={profileData.user} />
          </div>

          <ContentTabs activeTab={profileData.activeTab} setActiveTab={profileData.setActiveTab} />
          
          <div className="py-6">
            <FeedGrid 
              activeTab={profileData.activeTab}
              reels={profileData.reels}
              posts={profileData.posts}
              ytVideos={profileData.ytVideos}
              isLoadingFeed={profileData.isLoadingFeed}
              allVideos={profileData.allVideos}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
