import { MapPin, Star, Calendar, ShieldCheck, Users, CheckCircle2 } from 'lucide-react';

export const GymMain = () => {
  return (
    <div className="w-full space-y-8 pb-20">
      {/* 1. Hero Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[400px] lg:h-[500px]">
        <div className="lg:col-span-2 rounded-[40px] overflow-hidden border border-border-main relative group">
          <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1600" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Gym" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-8 left-8">
            <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tighter uppercase">Iron Haven Elite</h1>
            <div className="flex items-center gap-2 mt-2">
              <MapPin size={18} className="text-emerald-500" />
              <p className="text-white font-bold">Downtown Los Angeles, CA</p>
            </div>
          </div>
        </div>
        <div className="hidden lg:grid grid-rows-2 gap-4">
          <div className="rounded-[32px] overflow-hidden border border-border-main">
            <img src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" alt="Equip" />
          </div>
          <div className="rounded-[32px] overflow-hidden border border-border-main relative">
            <img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" alt="Yoga" />
            <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay" />
          </div>
        </div>
      </div>

      {/* 2. Features & Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Trainers', value: '24+', icon: Users, color: 'text-emerald-500' },
          { label: 'Rating', value: '4.9/5', icon: Star, color: 'text-amber-500' },
          { label: 'Established', value: '2014', icon: Calendar, color: 'text-blue-500' },
          { label: 'Accredited', value: 'ISO-9k', icon: ShieldCheck, color: 'text-emerald-500' },
        ].map((stat, i) => (
          <div key={i} className="p-6 bg-container border border-border-main rounded-[32px]">
            <stat.icon size={20} className={`${stat.color} mb-3`} />
            <p className="text-2xl font-black text-text-main">{stat.value}</p>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 3. Membership Plans */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black text-text-main tracking-tight uppercase">Membership Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { name: 'Standard Pass', price: '49', features: ['24/7 Access', 'Basic Equipment', 'Locker Room'] },
            { name: 'Elite Member', price: '99', features: ['All-Access', 'Personal Coach', 'Spa & Recovery', 'Guest Pass'], popular: true },
          ].map((plan, i) => (
            <div key={i} className={`p-8 rounded-[40px] border-2 transition-all cursor-pointer ${plan.popular ? 'border-emerald-500 bg-emerald-500/5' : 'border-border-main bg-container hover:border-text-muted'}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black text-text-main">{plan.name}</h3>
                  <p className="text-text-muted font-bold text-xs uppercase mt-1">Starting from</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-text-main">${plan.price}</span>
                  <span className="text-text-muted font-black text-[10px] ml-1 uppercase">/mo</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm font-bold text-text-main">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors ${plan.popular ? 'bg-emerald-500 text-white' : 'bg-text-main text-container'}`}>
                Select {plan.name}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
