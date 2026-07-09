import { useProfileData } from '../DesktopProfile_Suvix/hooks/useProfileData';
import { MobileTopSplit } from './sections/MobileTopSplit';
import { MobileIdentity } from './sections/MobileIdentity';
import { MobileContentTabs } from './sections/MobileContentTabs';

export const MobileProfile = () => {
  const profileData = useProfileData();

  if (!profileData.user) return null;

  return (
    <div className="flex lg:hidden w-full flex-col min-h-screen bg-page pb-20">
      <div className="flex flex-col w-full bg-card min-h-screen">
        
        <MobileTopSplit user={profileData.user} />

        <div className="flex flex-col px-4">
          <MobileIdentity user={profileData.user} />
        </div>

        <MobileContentTabs 
          allVideos={profileData.allVideos} 
          ytVideos={profileData.ytVideos}
          reels={profileData.reels}
          posts={profileData.posts}
        />
      </div>
    </div>
  );
};
