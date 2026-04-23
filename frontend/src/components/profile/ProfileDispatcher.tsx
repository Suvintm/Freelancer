import React from 'react';
import { YTCreatorHome } from './home/YTCreatorHome';
import { GymHome } from './home/GymHome';
import { SingerHome } from './home/SingerHome';
import { YTCreatorMain } from './main/YTCreatorMain';
import { GymMain } from './main/GymMain';
import { SingerMain } from './main/SingerMain';

export type UserRole = 'yt_creator' | 'gym' | 'singer' | 'default';

interface ProfileDispatcherProps {
  role: UserRole;
  viewType: 'home' | 'main';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any; // In production, this would be a union of the specific role data types
  onViewFull?: () => void;
}

/**
 * PROFILE DISPATCHER
 * A central hub that dynamically renders the correct profile component 
 * based on the user's role and the requested view context.
 */
export const ProfileDispatcher: React.FC<ProfileDispatcherProps> = ({ 
  role, 
  viewType, 
  data, 
  onViewFull 
}) => {
  
  if (viewType === 'home') {
    switch (role) {
      case 'yt_creator':
        return <YTCreatorHome data={data} onViewFull={onViewFull || (() => {})} />;
      case 'gym':
        return <GymHome data={data} onViewFull={onViewFull || (() => {})} />;
      case 'singer':
        return <SingerHome data={data} onViewFull={onViewFull || (() => {})} />;
      default:
        return (
          <div className="p-6 bg-container border border-border-main rounded-[32px] text-center">
            <p className="text-text-muted text-xs font-bold uppercase tracking-widest">Standard Profile</p>
            <h3 className="text-text-main font-black mt-2">{data.name}</h3>
          </div>
        );
    }
  }

  // viewType === 'main'
  switch (role) {
    case 'yt_creator':
      return <YTCreatorMain />;
    case 'gym':
      return <GymMain />;
    case 'singer':
      return <SingerMain />;
    default:
      return (
        <div className="w-full p-12 text-center bg-container border border-border-main rounded-[48px]">
          <h1 className="text-4xl font-black text-text-main uppercase tracking-tighter">Standard Profile Page</h1>
          <p className="text-text-muted font-bold mt-4">More features coming soon for your account type.</p>
        </div>
      );
  }
};
