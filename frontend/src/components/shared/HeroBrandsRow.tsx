import { Handshake, Sparkles, Award } from 'lucide-react';
import brandLaptopBg from '../../assets/brandlaptopbg.png';
import brandMobileBg from '../../assets/brandmobilebg.png';


interface HeroBrandsRowProps {
  className?: string;
}

// 20 Top Authentic Brands with custom SVG / styled wordmarks
const BRAND_ITEMS = [
  // 1. Nykaa
  {
    id: 'nykaa',
    name: 'Nykaa',
    logo: (
      <span className="font-black italic text-[#FC2779] text-xl tracking-wider font-sans select-none">
        NYKAA
      </span>
    ),
  },
  // 2. Myntra
  {
    id: 'myntra',
    name: 'Myntra',
    logo: (
      <div className="flex flex-col items-center justify-center">
        <svg viewBox="0 0 48 36" className="h-6 w-auto" fill="none">
          <path d="M4 32V12L12 24L20 12V32" stroke="#FF3F6C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 32V12L28 24L36 12V32" stroke="#F16521" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M36 32V12L44 24" stroke="#F7A200" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[10px] font-bold text-zinc-800 tracking-tight -mt-0.5">Myntra</span>
      </div>
    ),
  },
  // 3. Amazon
  {
    id: 'amazon',
    name: 'Amazon',
    logo: (
      <div className="flex flex-col items-center justify-center">
        <span className="font-black text-zinc-950 text-[17px] tracking-tight leading-none font-sans">
          amazon
        </span>
        <svg viewBox="0 0 100 24" className="w-16 h-3 text-[#FF9900] fill-none stroke-current stroke-[4.5] stroke-linecap-round -mt-0.5">
          <path d="M10 8 Q 50 22, 90 6" />
          <path d="M84 6 L 90 6 L 86 14" strokeWidth="3" fill="#FF9900" />
        </svg>
      </div>
    ),
  },
  // 4. Flipkart
  {
    id: 'flipkart',
    name: 'Flipkart',
    logo: (
      <div className="flex items-center gap-1.5">
        <span className="font-extrabold italic text-[#2874F0] text-[15px] tracking-tight">Flipkart</span>
        <div className="w-5 h-5 rounded-[4px] bg-[#FFE11B] flex items-center justify-center text-[#2874F0] font-black text-xs shadow-2xs">
          🛍️
        </div>
      </div>
    ),
  },
  // 5. Zomato
  {
    id: 'zomato',
    name: 'Zomato',
    logo: (
      <span className="font-black italic text-[#E23744] text-[20px] tracking-tight font-sans select-none">
        zomato
      </span>
    ),
  },
  // 6. Swiggy
  {
    id: 'swiggy',
    name: 'Swiggy',
    logo: (
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-6 rounded-full bg-[#FC8019] flex items-center justify-center text-white shadow-2xs">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </div>
        <span className="font-black text-[#FC8019] text-[15.5px] tracking-tight">Swiggy</span>
      </div>
    ),
  },
  // 7. AJIO
  {
    id: 'ajio',
    name: 'AJIO',
    logo: (
      <span className="font-black text-[#102B4E] text-[20px] tracking-[0.08em] font-sans select-none">
        AJIO
      </span>
    ),
  },
  // 8. TATA CLiQ
  {
    id: 'tatacliq',
    name: 'TATA CLiQ',
    logo: (
      <div className="flex flex-col items-center leading-none select-none">
        <span className="text-[9px] font-black text-zinc-900 tracking-[0.2em]">TATA</span>
        <span className="text-[14px] font-black text-zinc-950 tracking-tight flex items-center">
          CL<span className="text-[#FF0055]">i</span>Q
        </span>
      </div>
    ),
  },
  // 9. BigBasket
  {
    id: 'bigbasket',
    name: 'bigbasket',
    logo: (
      <div className="flex items-center gap-1">
        <div className="w-5 h-5 rounded-[4px] bg-[#D32F2F] text-white flex items-center justify-center font-black text-[10px]">
          bb
        </div>
        <span className="font-extrabold text-[#689F38] text-[13px] tracking-tight">bigbasket</span>
      </div>
    ),
  },
  // 10. boAt
  {
    id: 'boat',
    name: 'boAt',
    logo: (
      <div className="flex items-center select-none">
        <span className="font-black text-zinc-950 text-[18px] tracking-tight">bo</span>
        <span className="font-black text-[#E31E24] text-[20px] tracking-tight -ml-0.5">A</span>
        <span className="font-black text-zinc-950 text-[18px] tracking-tight -ml-0.5">t</span>
      </div>
    ),
  },
  // 11. Samsung
  {
    id: 'samsung',
    name: 'Samsung',
    logo: (
      <span className="font-black text-[#034EA2] text-[15px] tracking-[0.08em] font-sans select-none">
        SAMSUNG
      </span>
    ),
  },
  // 12. Nike
  {
    id: 'nike',
    name: 'Nike',
    logo: (
      <svg viewBox="0 0 24 24" className="w-12 h-6 fill-zinc-950">
        <path d="M21.707 5.293a1 1 0 0 0-1.414 0L4.5 21.086l-2.793-2.793a1 1 0 0 0-1.414 1.414l3.5 3.5a1 1 0 0 0 1.414 0l16.5-16.5a1 1 0 0 0 0-1.414z" />
        <path d="M21.5 5.5 C 16 8, 8 15, 2 19 C 7 18, 14 14, 21.5 5.5 Z" />
      </svg>
    ),
  },
  // 13. Puma
  {
    id: 'puma',
    name: 'Puma',
    logo: (
      <div className="flex items-center gap-1">
        <svg viewBox="0 0 40 24" className="w-8 h-5 fill-zinc-950">
          <path d="M38 12c-2-3-6-5-10-4-3 1-5 4-8 4s-5-2-7-5c-2-2-5-3-8-2-3 1-5 4-5 7 0 4 3 8 7 8 5 0 9-3 12-7 2-2 4-3 7-3 3 0 6 1 8 4l4-2z" />
        </svg>
        <span className="font-black text-zinc-950 text-[13px] tracking-wider uppercase font-sans">PUMA</span>
      </div>
    ),
  },
  // 14. Spotify
  {
    id: 'spotify',
    name: 'Spotify',
    logo: (
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-full bg-[#1DB954] flex items-center justify-center text-white shadow-2xs">
          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.625.625 0 0 1-.86.208c-2.355-1.439-5.32-1.764-8.814-.966a.625.625 0 1 1-.278-1.219c3.824-.875 7.102-.505 9.744 1.117.297.182.39.57.208.86zm1.226-2.724a.782.782 0 0 1-1.077.257c-2.697-1.658-6.809-2.137-9.998-1.17a.782.782 0 1 1-.453-1.498c3.645-1.106 8.196-.57 11.27 1.334a.782.782 0 0 1 .258 1.077zm.105-2.835C14.692 8.92 9.36 8.742 6.273 9.68a.938.938 0 1 1-.544-1.795c3.543-1.076 9.44-.868 13.197 1.362a.937.937 0 1 1-.909 1.642z" />
          </svg>
        </div>
        <span className="font-extrabold text-zinc-950 text-[13.5px] tracking-tight">Spotify</span>
      </div>
    ),
  },
  // 15. Mamaearth
  {
    id: 'mamaearth',
    name: 'Mamaearth',
    logo: (
      <div className="flex items-center gap-1 select-none">
        <span className="text-[13px]">🌱</span>
        <span className="font-black text-[#00AFEF] text-[13.5px] tracking-tight">mama</span>
        <span className="font-black text-[#689F38] text-[13.5px] tracking-tight -ml-0.5">earth</span>
      </div>
    ),
  },
  // 16. OnePlus
  {
    id: 'oneplus',
    name: 'OnePlus',
    logo: (
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-[3px] bg-[#F50514] text-white flex items-center justify-center font-black text-[10.5px]">
          1+
        </div>
        <span className="font-bold text-zinc-950 text-[13.5px] tracking-tight">OnePlus</span>
      </div>
    ),
  },
  // 17. Google
  {
    id: 'google',
    name: 'Google',
    logo: (
      <div className="flex items-center gap-1.5">
        <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        <span className="font-bold text-zinc-900 text-[14px] tracking-tight">Google</span>
      </div>
    ),
  },
  // 18. Sony
  {
    id: 'sony',
    name: 'Sony',
    logo: (
      <span className="font-serif font-black text-zinc-950 text-[16px] tracking-[0.2em] uppercase select-none">
        SONY
      </span>
    ),
  },
  // 19. Lenskart
  {
    id: 'lenskart',
    name: 'Lenskart',
    logo: (
      <div className="flex items-center gap-1.5">
        <span className="text-[14px]">👓</span>
        <span className="font-black text-[#000042] text-[13.5px] tracking-tight">lenskart</span>
      </div>
    ),
  },
  // 20. Cult.fit
  {
    id: 'cultfit',
    name: 'Cult.fit',
    logo: (
      <div className="flex items-center select-none">
        <span className="font-black text-zinc-950 text-[15px] tracking-tight">cult</span>
        <span className="font-black text-[#FF3278] text-[16px] -mx-0.5">.</span>
        <span className="font-black text-zinc-950 text-[15px] tracking-tight">fit</span>
      </div>
    ),
  },
];

export function HeroBrandsRow({ className = '' }: HeroBrandsRowProps) {
  return (
    <section className={`relative w-full py-7 sm:py-10 bg-white overflow-hidden select-none font-sans ${className}`}>
      
      {/* ── 1. FESTIVAL STYLE BACKGROUND (Laptop vs Mobile Responsive) ── */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden z-0">
        {/* Desktop / Laptop Background */}
        <img
          src={brandLaptopBg}
          alt=""
          aria-hidden="true"
          className="hidden sm:block w-full h-full object-cover object-center pointer-events-none select-none opacity-95"
        />
        {/* Mobile Background */}
        <img
          src={brandMobileBg}
          alt=""
          aria-hidden="true"
          className="block sm:hidden w-full h-full object-cover object-center pointer-events-none select-none opacity-95"
        />
        {/* Top & Bottom seamless gradient transitions */}
        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white via-white/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white via-white/70 to-transparent" />
      </div>

      {/* ── 2. SECTION HEADER (Eyebrow, Big Headline, Subtitle) ── */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 text-center mb-5 sm:mb-7">
        
        {/* Eyebrow Capsule */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50/80 border border-amber-300/80 text-amber-900 shadow-2xs mb-2 sm:mb-2.5">
          <span className="text-[10px] text-amber-600">✦</span>
          <span className="text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-[0.2em]">
            TRUSTED BY LEADING BRANDS
          </span>
        </div>

        {/* Main Headline */}
        <h2 className="text-[26px] xs:text-[30px] sm:text-[38px] lg:text-[44px] font-black text-zinc-950 tracking-[-0.035em] leading-[1.08] mb-2 sm:mb-3">
          Big Brands{' '}
          <span className="relative inline-block font-['Instrument_Serif',Playfair_Display,Georgia,serif] italic font-normal text-amber-600 tracking-normal text-[1.12em] pt-0.5">
            Shine <span className="inline-block not-italic text-[0.85em] align-middle -mt-1">🪔</span>
            {/* Golden-amber brush underline */}
            <svg
              viewBox="0 0 200 18"
              className="absolute -bottom-1 left-0 w-full text-amber-500 fill-none stroke-current stroke-[3] stroke-linecap-round pointer-events-none"
            >
              <path d="M4 10 C 50 16, 140 14, 196 6" stroke="url(#svx-brands-gold-grad)" />
              <defs>
                <linearGradient id="svx-brands-gold-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
              </defs>
            </svg>
          </span>{' '}
          with Creators <span className="text-amber-500 font-normal text-sm align-super">✦</span>
        </h2>

        {/* Subtitle Description */}
        <p className="text-xs sm:text-[13.5px] text-zinc-700 font-normal leading-relaxed max-w-xl mx-auto">
          From fashion to tech, top brands partner with SuviX to create meaningful content and real impact.
        </p>

      </div>

      {/* ── 3. FULL-BLEED CONTINUOUS MARQUEE OF 20 TOP BRANDS IN SQUIRCLE CARTOON CARDS ── */}
      <div className="relative z-10 w-full overflow-hidden pointer-events-none select-none py-1.5">
        <div className="animate-brands-marquee flex gap-3 sm:gap-4 items-center">
          
          {/* Set 1: All 20 Brands */}
          {BRAND_ITEMS.map((brand, idx) => (
            <div
              key={`b1-${brand.id}-${idx}`}
              className="w-[125px] sm:w-[140px] h-[68px] sm:h-[76px] rounded-[18px] sm:rounded-[20px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-white/90 flex items-center justify-center p-3 shrink-0 transform-gpu"
            >
              {brand.logo}
            </div>
          ))}

          {/* Set 2: Seamless Infinite Duplicate of All 20 Brands */}
          {BRAND_ITEMS.map((brand, idx) => (
            <div
              key={`b2-${brand.id}-${idx}`}
              className="w-[125px] sm:w-[140px] h-[68px] sm:h-[76px] rounded-[18px] sm:rounded-[20px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-white/90 flex items-center justify-center p-3 shrink-0 transform-gpu"
            >
              {brand.logo}
            </div>
          ))}

        </div>
      </div>

      {/* ── 4. BOTTOM 3-ITEM STATS HIGHLIGHT BAR (Always 1 Row on Mobile & Desktop) ── */}
      <div className="relative z-10 w-full max-w-3xl mx-auto px-2 xs:px-4 sm:px-6 mt-5 sm:mt-8">
        <div className="flex flex-row items-center justify-between sm:justify-around gap-1.5 xs:gap-2.5 sm:gap-6 bg-black text-white py-2 xs:py-2.5 sm:py-3.5 px-2.5 xs:px-4 sm:px-8 rounded-full border border-black shadow-[0_12px_36px_rgba(0,0,0,0.45)] w-full">
          
          {/* Stat 1: 5000+ Brand Partnerships */}
          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 text-left min-w-0 shrink">
            <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-9 sm:h-9 rounded-full bg-white/10 text-amber-400 flex items-center justify-center shrink-0 border border-white/10 shadow-xs">
              <Handshake size={13} className="xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="text-[10.5px] xs:text-xs sm:text-[15px] font-black text-white tracking-tight leading-none whitespace-nowrap">5000+</div>
              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] text-zinc-400 font-semibold leading-tight whitespace-nowrap mt-0.5">Brand Partnerships</div>
            </div>
          </div>

          <div className="block h-5 sm:h-6 w-[1px] bg-white/15 shrink-0" />

          {/* Stat 2: 100M+ Creator Campaigns */}
          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 text-left min-w-0 shrink">
            <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-9 sm:h-9 rounded-full bg-white/10 text-blue-400 flex items-center justify-center shrink-0 border border-white/10 shadow-xs">
              <Sparkles size={13} className="xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="text-[10.5px] xs:text-xs sm:text-[15px] font-black text-white tracking-tight leading-none whitespace-nowrap">100M+</div>
              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] text-zinc-400 font-semibold leading-tight whitespace-nowrap mt-0.5">Creator Campaigns</div>
            </div>
          </div>

          <div className="block h-5 sm:h-6 w-[1px] bg-white/15 shrink-0" />

          {/* Stat 3: Real Opportunities For Brands & Creators */}
          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 text-left min-w-0 shrink">
            <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-9 sm:h-9 rounded-full bg-white/10 text-emerald-400 flex items-center justify-center shrink-0 border border-white/10 shadow-xs">
              <Award size={13} className="xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="text-[10.5px] xs:text-xs sm:text-[15px] font-black text-white tracking-tight leading-none whitespace-nowrap">Real Opportunities</div>
              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] text-zinc-400 font-semibold leading-tight whitespace-nowrap mt-0.5">For Brands & Creators</div>
            </div>
          </div>

        </div>
      </div>



    </section>
  );
}

