/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { ReactLenis } from 'lenis/react';
import { useProfileData } from './hooks/useProfileData';
import { CreatorCoverBanner } from './sections/CreatorCoverBanner';
import { CreatorIdentityCard } from './sections/CreatorIdentityCard';
import { ConnectedAccountsCard } from './sections/ConnectedAccountsCard';
import { CreatorContentTabs } from './sections/CreatorContentTabs';
import type { ProfileTabType } from './sections/CreatorContentTabs';
import { CreatorMediaGrid } from './sections/CreatorMediaGrid';
import { CreatorJourneyWidget } from './sections/CreatorJourneyWidget';
import { TotalReachWidget } from './sections/TotalReachWidget';
import { QuickActionsWidget } from './sections/QuickActionsWidget';
import { MyServicesWidget } from './sections/MyServicesWidget';
import { EditProfileModal } from './components/EditProfileModal';

export const DesktopProfile: React.FC = () => {
  const profileData = useProfileData();
  const [activeTab, setActiveTab] = useState<ProfileTabType>('yt_videos');
  const [sortBy, setSortBy] = useState('Latest');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!profileData.user) {
    return null;
  }

  // Calculate actual user total posts/content
  const user = profileData.user;
  const youtubeProfiles = user?.youtubeProfile || [];
  const ytVideoCount = youtubeProfiles.reduce((acc: number, p: any) => acc + (p.video_count || 0), 0);
  const totalPosts = (profileData.posts?.length || 0) + (profileData.reels?.length || 0) + ytVideoCount || 17;

  // Counts for each tab
  const tabCounts: Partial<Record<ProfileTabType, number>> = {
    yt_videos: profileData.allVideos?.length || 8,
    yt_posts: profileData.ytVideos?.length || 4,
    posts: profileData.posts?.length || 4,
    reels: profileData.reels?.length || 3,
    thumbnail_vote: profileData.thumbnailVotes?.length || 1,
    collabs: 2,
    tagged: 1,
  };

  return (
    <div className="hidden lg:flex w-full h-full overflow-hidden px-3 sm:px-4 lg:px-5 pt-3 pb-0 font-sans justify-center">
      {/* ── Two Independent Scrolling Columns Layout (Exact Proportions & Independent Scroll) ── */}
      <div className="w-full max-w-[1550px] h-full flex items-stretch gap-4 xl:gap-5 overflow-hidden">
        
        {/* ── Left Column: Main Creator Profile Content (Independent Lenis Smooth Scroll, ~73% Width) ── */}
        <ReactLenis
          root={false}
          data-lenis-prevent="true"
          options={{
            lerp: 0.08,
            duration: 1.2,
            smoothWheel: true,
            wheelMultiplier: 1.05,
            touchMultiplier: 1.5,
            syncTouch: false,
            autoResize: true,
          }}
          className="flex-1 min-w-0 h-full overflow-y-auto overscroll-contain scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="space-y-3 sm:space-y-3.5 pr-1.5 pb-20">
            {/* 1. Cover Banner Section */}
            <CreatorCoverBanner user={user} />

            {/* 2. Creator Identity Overview Card */}
            <CreatorIdentityCard
              user={user}
              onEditProfile={() => setIsEditModalOpen(true)}
              postsCount={totalPosts}
            />

            {/* 3 & 4. Sticky Header on Scroll (Social Apps Bar & Content Tabs) */}
            <div className="sticky top-0 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-md pt-1.5 pb-0.5 space-y-2.5 transition-all">
              {/* 3. Connected Accounts Bar (Horizontal Parent Div with White App Divs) */}
              <ConnectedAccountsCard user={user} />

              {/* 4. Content Navigation Tabs */}
              <CreatorContentTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                sortBy={sortBy}
                onSortChange={setSortBy}
                counts={tabCounts}
              />
            </div>

            {/* 5. Creator Media Grid Cards */}
            <CreatorMediaGrid
              activeTab={activeTab}
              sortBy={sortBy}
              allVideos={profileData.allVideos}
              userVideos={profileData.ytVideos}
              userPosts={profileData.posts}
              userReels={profileData.reels}
              thumbnailVotes={profileData.thumbnailVotes}
              user={user}
              isLoading={profileData.isLoadingFeed}
            />
          </div>
        </ReactLenis>

        {/* ── Right Column: Creator Dashboard Panels (Independent Lenis Smooth Scroll, ~27% Width: 345px-375px) ── */}
        <ReactLenis
          root={false}
          data-lenis-prevent="true"
          options={{
            lerp: 0.08,
            duration: 1.2,
            smoothWheel: true,
            wheelMultiplier: 1.05,
            touchMultiplier: 1.5,
            syncTouch: false,
            autoResize: true,
          }}
          className="w-[340px] xl:w-[355px] 2xl:w-[375px] shrink-0 h-full overflow-y-auto overscroll-contain scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="space-y-3 sm:space-y-3.5 pr-0.5 pb-20">
            {/* 1. Creator Journey Goals & Milestones Progress */}
            <CreatorJourneyWidget />

            {/* 2. Total Reach Insights Dark Analytics Card */}
            <TotalReachWidget />

            {/* 3. Quick Actions 2x2 Grid Widget */}
            <QuickActionsWidget />

            {/* 4. My Services Widget */}
            <MyServicesWidget />
          </div>
        </ReactLenis>

      </div>

      {/* ── Interactive Edit Profile Modal ── */}
      <EditProfileModal
        user={user}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
};
