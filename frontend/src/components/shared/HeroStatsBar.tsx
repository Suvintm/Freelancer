import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote: 'A platform that truly empowers creators.',
    source: 'Forbes',
  },
  {
    quote: 'The fastest way to turn creative ideas into real growth.',
    source: 'TechCrunch',
  },
  {
    quote: 'Redefining the modern creator economy and collaboration.',
    source: 'Wired',
  },
];

interface HeroStatsBarProps {
  className?: string;
}

export function HeroStatsBar({ className = '' }: HeroStatsBarProps) {
  const [activeQuoteIdx, setActiveQuoteIdx] = useState(0);

  const prevQuote = () => {
    setActiveQuoteIdx((prev) => (prev === 0 ? TESTIMONIALS.length - 1 : prev - 1));
  };

  const nextQuote = () => {
    setActiveQuoteIdx((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  return (
    <div
      className={`w-full py-3.5 sm:py-4.5 border-t border-zinc-100 bg-white/95 backdrop-blur-xs select-none ${className}`}
    >
      <div className="w-full max-w-[96vw] xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6">
        {/* Left Metrics Cluster */}
        <div className="flex items-center justify-center sm:justify-start flex-wrap gap-4 sm:gap-7 md:gap-9">
          {/* 1. 2M+ Active Creators */}
          <div className="text-left">
            <div className="text-lg sm:text-2xl font-black text-zinc-950 tracking-tight leading-tight">2M+</div>
            <div className="text-[11px] sm:text-xs text-zinc-500 font-medium leading-tight">Active Creators</div>
          </div>
          <div className="hidden sm:block h-7 w-[1px] bg-zinc-200" />

          {/* 2. 500M+ Pieces of Content */}
          <div className="text-left">
            <div className="text-lg sm:text-2xl font-black text-zinc-950 tracking-tight leading-tight">500M+</div>
            <div className="text-[11px] sm:text-xs text-zinc-500 font-medium leading-tight">Pieces of Content</div>
          </div>
          <div className="hidden sm:block h-7 w-[1px] bg-zinc-200" />

          {/* 3. 150+ Countries */}
          <div className="text-left">
            <div className="text-lg sm:text-2xl font-black text-zinc-950 tracking-tight leading-tight">150+</div>
            <div className="text-[11px] sm:text-xs text-zinc-500 font-medium leading-tight">Countries</div>
          </div>
          <div className="hidden sm:block h-7 w-[1px] bg-zinc-200" />

          {/* 4. 4.8/5 User Rating */}
          <div className="flex items-center gap-2 text-left">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shrink-0 shadow-2xs">
              <Star size={14} className="fill-amber-400 text-amber-400" />
            </div>
            <div>
              <div className="text-base sm:text-xl font-black text-zinc-950 tracking-tight leading-none">4.8/5</div>
              <div className="text-[10.5px] sm:text-[11.5px] text-zinc-500 font-medium leading-tight mt-0.5">
                User Rating
              </div>
            </div>
          </div>
        </div>

        {/* Right Testimonial Quote & Navigation Arrows */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-0 lg:pl-6 border-t lg:border-t-0 lg:border-l border-zinc-200 pt-3 lg:pt-0 w-full lg:w-auto">
          <div className="text-left">
            <p className="text-xs sm:text-[13.5px] font-medium text-zinc-800 italic transition-all duration-300">
              “{TESTIMONIALS[activeQuoteIdx].quote}”
            </p>
            <p className="text-[11px] sm:text-xs text-zinc-500 font-bold mt-0.5">
              —{' '}
              <span className="font-['Instrument_Serif',Playfair_Display,Georgia,serif] text-zinc-900 font-bold not-italic text-sm sm:text-[15px]">
                {TESTIMONIALS[activeQuoteIdx].source}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 ml-2 shrink-0">
            <button
              type="button"
              onClick={prevQuote}
              aria-label="Previous quote"
              className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer active:scale-95 shadow-2xs"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={nextQuote}
              aria-label="Next quote"
              className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer active:scale-95 shadow-2xs"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
