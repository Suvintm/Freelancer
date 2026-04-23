import { Plus } from 'lucide-react';
import auth1 from '../../assets/auth/auth_1.png';
import { ProfileDispatcher } from '../profile/ProfileDispatcher';

const HIGHLIGHTS = [
  { id: 1, label: 'New', img: auth1, isNew: true },
  { id: 2, label: 'Garden', img: auth1 },
  { id: 3, label: 'Cameras', img: auth1 },
  { id: 4, label: 'Wildlife', img: auth1 },
];

// Mock data for the current user session
const CURRENT_USER = {
  role: 'yt_creator' as const,
  data: {
    name: 'Abhinav Khare',
    subscribers: '1.2M',
    videos: 472,
    avatar: auth1,
    username: '@abhi_navkhare'
  }
};

export const Sidebar = () => {
  return (
    <aside className="w-72 h-full flex flex-col overflow-y-auto scrollbar-hide bg-sidebar z-10 border-r border-border-main">
      {/* 1. Dynamic Role-Based Profile Preview */}
      <div className="px-6 py-8 border-b border-border-main/50">
        <h4 className="text-text-muted text-[10px] uppercase font-black tracking-[0.2em] mb-6 px-2">Account Overview</h4>
        <ProfileDispatcher 
          role={CURRENT_USER.role}
          viewType="home"
          data={CURRENT_USER.data}
          onViewFull={() => console.log('Navigating to full profile...')}
        />
      </div>

      <div className="px-8 py-6">
        {/* 2. Traditional Stats (Visible below the dispatcher for extra context) */}
        <div className="flex w-full justify-between items-center px-2 py-5 mb-8">
          <div className="text-center">
            <p className="text-text-main text-base font-black">472</p>
            <p className="text-text-muted text-[9px] uppercase font-black tracking-widest mt-1">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-text-main text-base font-black">12.4K</p>
            <p className="text-text-muted text-[9px] uppercase font-black tracking-widest mt-1">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-text-main text-base font-black">228</p>
            <p className="text-text-muted text-[9px] uppercase font-black tracking-widest mt-1">Following</p>
          </div>
        </div>

        {/* 3. Bio Section */}
        <div className="text-left w-full mb-10 px-2">
          <h4 className="text-text-main text-sm font-black mb-1.5">{CURRENT_USER.data.name}</h4>
          <p className="text-text-muted text-[11px] font-bold leading-relaxed opacity-80">
            Professional Creator | UI Designer | Lifestyle Blogger
          </p>
        </div>

        {/* 4. Story Highlights */}
        <div className="mb-10">
          <h4 className="text-text-muted text-[10px] uppercase font-black tracking-[0.2em] mb-6">Story Highlights</h4>
          <div className="grid grid-cols-2 gap-4">
            {HIGHLIGHTS.map((item) => (
              <div key={item.id} className="flex flex-col items-center gap-3 p-4 rounded-[24px] bg-border-secondary border border-border-main cursor-pointer group hover:bg-zinc-200 dark:hover:bg-zinc-900 transition-all">
                <div className="w-14 h-14 rounded-full p-0.5 border border-border-main group-hover:border-text-muted transition-colors bg-container flex items-center justify-center overflow-hidden shadow-inner">
                  {item.isNew ? (
                    <Plus size={24} className="text-text-muted group-hover:text-text-main transition-colors" />
                  ) : (
                    <img src={item.img} alt={item.label} className="w-full h-full object-cover rounded-full grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500" />
                  )}
                </div>
                <span className="text-[10px] font-black text-text-muted group-hover:text-text-main transition-colors tracking-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="h-20" />
    </aside>
  );
};
