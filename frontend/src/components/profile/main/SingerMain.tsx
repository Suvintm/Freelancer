import { Star, Play, MapPin, Share2 } from 'lucide-react';

export const SingerMain = () => {
  return (
    <div className="w-full space-y-8 pb-20">
      {/* 1. Artist Header */}
      <div className="relative h-[350px] lg:h-[450px] rounded-[40px] overflow-hidden">
        <img src="https://images.unsplash.com/photo-1516280440502-a2ce893ce71d?auto=format&fit=crop&q=80&w=1600" className="w-full h-full object-cover" alt="Artist" />
        <div className="absolute inset-0 bg-gradient-to-r from-violet-900/80 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        
        <div className="absolute bottom-10 left-10 space-y-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-violet-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">Pro Artist</span>
            <div className="flex items-center gap-1">
              <Star size={12} className="text-amber-400 fill-amber-400" />
              <span className="text-white text-xs font-black">4.9 (124 reviews)</span>
            </div>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter uppercase leading-none">Aria<br/>Vance</h1>
          <div className="flex items-center gap-6 pt-4">
            <button className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform">
              <Play size={16} fill="currentColor" />
              Latest Track
            </button>
            <button className="p-4 bg-white/10 backdrop-blur-md text-white rounded-full border border-white/20 hover:bg-white/20 transition-colors">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Discography Grid */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <h2 className="text-2xl font-black text-text-main tracking-tight uppercase">Discography</h2>
          <button className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] hover:text-text-main transition-colors">View All</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { title: 'Neon Nights', year: '2024', img: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400' },
            { title: 'Velvet Rain', year: '2023', img: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=400' },
            { title: 'Midnight City', year: '2023', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400' },
            { title: 'Ethereal', year: '2022', img: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=400' },
          ].map((album, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="aspect-square rounded-[32px] overflow-hidden mb-3 border border-border-main relative">
                <img src={album.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={album.title} />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play size={32} className="text-white" fill="currentColor" />
                </div>
              </div>
              <h3 className="text-sm font-black text-text-main truncate">{album.title}</h3>
              <p className="text-[10px] font-bold text-text-muted">{album.year}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Upcoming Gigs */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black text-text-main tracking-tight uppercase">Live Dates</h2>
        <div className="space-y-3">
          {[
            { date: 'JUN 24', venue: 'The Echo Arena', city: 'London, UK' },
            { date: 'JUL 02', venue: 'Jazz Garden', city: 'Paris, FR' },
            { date: 'AUG 15', venue: 'Red Rocks', city: 'Denver, CO' },
          ].map((gig, i) => (
            <div key={i} className="p-6 bg-container border border-border-main rounded-3xl flex items-center justify-between group hover:bg-violet-500/5 transition-colors cursor-pointer">
              <div className="flex items-center gap-6">
                <div className="text-center w-12">
                  <p className="text-[10px] font-black text-violet-500 uppercase">{gig.date.split(' ')[0]}</p>
                  <p className="text-xl font-black text-text-main leading-none">{gig.date.split(' ')[1]}</p>
                </div>
                <div className="h-8 w-[1px] bg-border-main" />
                <div>
                  <h4 className="font-black text-text-main group-hover:text-violet-500 transition-colors">{gig.venue}</h4>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin size={10} className="text-text-muted" />
                    <span className="text-[10px] font-bold text-text-muted">{gig.city}</span>
                  </div>
                </div>
              </div>
              <button className="px-6 py-2 border border-border-main rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-text-main hover:text-container transition-all">Tickets</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
