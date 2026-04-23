import { Search, Bell, Mail, Plus } from 'lucide-react';
import { Button } from '../ui/Button';

export const TopNavbar = () => {
  return (
    <header className="h-20 bg-black/40 backdrop-blur-md border-b border-zinc-900/50 sticky top-0 z-40 px-8 lg:px-12 flex items-center justify-between">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search creators, jobs, or inspiration..."
            className="w-full h-11 bg-zinc-900/30 border border-zinc-800/50 rounded-[20px] pl-12 pr-4 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <button className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-900 hover:text-white transition-all relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-black" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-900 hover:text-white transition-all">
            <Mail size={20} />
          </button>
        </div>
        
        <div className="w-px h-6 bg-zinc-800/50 mx-2" />
        
        <Button className="h-11 px-6 rounded-[20px] bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-black text-[13px] shadow-lg shadow-orange-500/10 gap-2 transition-transform active:scale-95">
          <Plus size={16} strokeWidth={4} />
          Create a post
        </Button>
      </div>
    </header>
  );
};
