import React, { useState, useEffect } from 'react';
import type { CountdownConfig } from '../../types/block.types';
import type { Theme } from '../../types/theme.types';
import { Timer, Zap } from 'lucide-react';

interface CountdownBlockProps {
  config: CountdownConfig;
  theme?: Theme;
}

export const CountdownBlock: React.FC<CountdownBlockProps> = ({ config, theme: _theme }) => {
  const {
    targetDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    title = '🔥 Next Big Launch Starts In:',
    expiredText = 'Launch is Live! 🚀',
  } = config;

  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [isExpired, setIsExpired] = useState(+new Date(targetDate) <= +new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (+new Date(targetDate) <= +new Date()) {
        setIsExpired(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="w-full my-2 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-zinc-900 text-white shadow-md border border-white/15 select-none overflow-hidden font-sans text-center">
      
      {/* Title */}
      <div className="flex items-center justify-center gap-1.5 mb-2.5">
        <Timer className="w-4 h-4 text-amber-400 animate-pulse" />
        <h4 className="font-extrabold text-xs tracking-tight text-white">
          {isExpired ? expiredText : title}
        </h4>
      </div>

      {!isExpired ? (
        <div className="grid grid-cols-4 gap-1.5 max-w-xs mx-auto">
          <div className="p-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex flex-col items-center">
            <span className="text-sm font-black font-mono text-white leading-tight">
              {String(timeLeft.days).padStart(2, '0')}
            </span>
            <span className="text-[7.5px] uppercase font-bold text-zinc-400 tracking-wider">
              Days
            </span>
          </div>

          <div className="p-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex flex-col items-center">
            <span className="text-sm font-black font-mono text-white leading-tight">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-[7.5px] uppercase font-bold text-zinc-400 tracking-wider">
              Hours
            </span>
          </div>

          <div className="p-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex flex-col items-center">
            <span className="text-sm font-black font-mono text-white leading-tight">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-[7.5px] uppercase font-bold text-zinc-400 tracking-wider">
              Mins
            </span>
          </div>

          <div className="p-1.5 rounded-xl bg-amber-400/20 backdrop-blur-sm border border-amber-400/30 flex flex-col items-center">
            <span className="text-sm font-black font-mono text-amber-300 leading-tight animate-pulse">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-[7.5px] uppercase font-bold text-amber-300 tracking-wider">
              Secs
            </span>
          </div>
        </div>
      ) : (
        <div className="py-1 px-3 rounded-xl bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center gap-1 shadow-sm">
          <Zap className="w-3.5 h-3.5 fill-slate-950" />
          <span>Available Right Now!</span>
        </div>
      )}

    </div>
  );
};

export default CountdownBlock;
