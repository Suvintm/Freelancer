import { 
  Plus
} from 'lucide-react';
import auth1 from '../../assets/auth/auth_1.png';

const HIGHLIGHTS = [
  { id: 1, label: 'New', img: auth1, isNew: true },
  { id: 2, label: 'Garden', img: auth1 },
  { id: 3, label: 'Cameras', img: auth1 },
  { id: 4, label: 'Wildlife', img: auth1 },
];

export const Sidebar = () => {
  return (
    <aside className="w-72 h-full flex flex-col overflow-y-auto scrollbar-hide bg-sidebar z-10 border-r border-border-main">
      {/* Profile Section */}
      <div className="px-8 py-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6 group cursor-pointer">
            <div className="w-24 h-24 rounded-full border-2 border-blue-500 p-1.5 transition-transform group-hover:scale-105 duration-500 shadow-2xl shadow-blue-500/10">
              <img 
                src={auth1} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>
          
          <h3 className="text-text-main font-black text-xl tracking-tight leading-tight">Abhinav Khare</h3>
          <p className="text-text-muted text-xs font-bold mb-8">@abhi_navkhare</p>
          
          <div className="flex w-full justify-between items-center px-4 py-5 border-y border-border-main mb-8">
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

          <div className="text-left w-full mb-10">
            <h4 className="text-text-main text-sm font-black mb-1.5">Abhinav Khare</h4>
            <p className="text-text-muted text-[11px] font-bold leading-relaxed opacity-80">
              UI Designer | Traveler | Lifestyle Blogger
            </p>
          </div>
        </div>

        {/* Story Highlights */}
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

      {/* Extra space for bottom curve */}
      <div className="h-20" />
    </aside>
  );
};
