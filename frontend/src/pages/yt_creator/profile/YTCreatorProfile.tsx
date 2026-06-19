import React from 'react';
import { DesktopProfile } from '../../../components/yt_creator/profile/DesktopProfile';
import { MobileProfile } from '../../../components/yt_creator/profile/MobileProfile';

export const YTCreatorProfile: React.FC = () => {
  return (
    <div className="w-full h-full bg-page">
      {/* Renders only on large screens (lg breakpoint and above) */}
      <DesktopProfile />
      
      {/* Renders only on small screens (below lg breakpoint) */}
      <MobileProfile />
    </div>
  );
};
