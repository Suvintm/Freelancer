import { motion } from 'framer-motion';
import { Youtube, Users, PlayCircle, Clock, ExternalLink, Globe, Instagram, Twitter } from 'lucide-react';

export const YTCreatorMain = () => {
  return (
    <div className="w-full space-y-8 pb-20">
      {/* 1. Cinematic Banner */}
      <div className="relative aspect-[21/9] lg:aspect-[16/6] rounded-[40px] overflow-hidden group">
        <img 
          src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1600" 
          className="w-full h-full object-cover" 
          alt="YT Banner" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        
        <div className="absolute bottom-8 left-8 flex items-end gap-6">
          <img 
            src="https://images.unsplash.com/photo-1516280440502-a2ce893ce71d?auto=format&fit=crop&q=80&w=200" 
            className="w-24 h-24 lg:w-32 lg:h-32 rounded-full border-4 border-container shadow-2xl" 
            alt="Avatar" 
          />
          <div className="mb-2">
            <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tighter uppercase">SuviX Creator</h1>
            <p className="text-red-500 font-bold uppercase tracking-[0.3em] text-xs mt-1">Certified YouTube Partner</p>
          </div>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Subscribers', value: '1.2M', icon: Users, color: 'text-blue-500' },
          { label: 'Total Views', value: '840M', icon: PlayCircle, color: 'text-red-500' },
          { label: 'Avg. Retention', value: '72%', icon: Clock, color: 'text-emerald-500' },
          { label: 'Engagement', value: '8.4%', icon: Globe, color: 'text-amber-500' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-container border border-border-main rounded-[32px] shadow-xl dark:shadow-none"
          >
            <stat.icon size={20} className={`${stat.color} mb-3`} />
            <p className="text-2xl font-black text-text-main">{stat.value}</p>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* 3. Featured Video Mock */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black text-text-main tracking-tight uppercase">Featured Content</h2>
        <div className="aspect-video bg-border-secondary rounded-[40px] overflow-hidden relative group cursor-pointer border border-border-main">
          <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1600" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" alt="Video" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-white shadow-2xl transform group-hover:scale-110 transition-transform">
              <PlayCircle size={40} fill="currentColor" />
            </div>
          </div>
          <div className="absolute bottom-8 left-8">
            <h3 className="text-xl font-black text-white">How SuviX Revolutionized My Workflow</h3>
            <p className="text-white/60 text-sm font-bold mt-1">2.4M views • 2 weeks ago</p>
          </div>
        </div>
      </section>

      {/* 4. Social & External Links */}
      <div className="flex flex-wrap gap-4">
        {[
          { label: 'Official Website', icon: ExternalLink, color: 'bg-zinc-800' },
          { label: 'Instagram', icon: Instagram, color: 'bg-gradient-to-tr from-amber-500 to-fuchsia-600' },
          { label: 'Twitter', icon: Twitter, color: 'bg-blue-400' },
          { label: 'Channel Stats', icon: Youtube, color: 'bg-red-500' },
        ].map((link, i) => (
          <button key={i} className={`flex items-center gap-3 px-6 py-4 ${link.color} text-white rounded-2xl font-black text-xs uppercase tracking-tight hover:scale-105 transition-transform shadow-lg`}>
            <link.icon size={16} />
            {link.label}
          </button>
        ))}
      </div>
    </div>
  );
};
