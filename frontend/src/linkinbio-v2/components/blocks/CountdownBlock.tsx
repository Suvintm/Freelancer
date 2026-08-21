import React, { useState, useEffect } from 'react';
import type { CountdownConfig } from '../../types/block.types';
import type { Theme } from '../../types/theme.types';
import { Timer, Zap } from 'lucide-react';

interface CountdownBlockProps {
  config: CountdownConfig;
  theme?: Theme;
}

const DEFAULT_TARGET_OFFSET_MS = 7 * 24 * 60 * 60 * 1000;

export const CountdownBlock: React.FC<CountdownBlockProps> = ({ config, theme: _theme }) => {
  const targetDate = config.targetDate;
  const title = config.title || '🔥 Next Big Launch Starts In:';
  const expiredText = config.expiredText || 'Launch is Live! 🚀';

  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetTime = targetDate ? new Date(targetDate).getTime() : Date.now() + DEFAULT_TARGET_OFFSET_MS;
      const difference = targetTime - Date.now();
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const isExpired =
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;

  return (
    <div className="w-full relative overflow-hidden rounded-2xl p-5 backdrop-blur-md bg-white/5 border border-white/10 shadow-lg text-white">
      {/* Header Info */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
          <Timer className="w-5 h-5 animate-pulse" />
        </div>
        <h4 className="font-semibold text-sm tracking-wide text-white/90">{title}</h4>
      </div>

      {/* Countdown Grid or Expired Message */}
      {isExpired ? (
        <div className="flex items-center justify-center gap-2 py-4 text-center">
          <Zap className="w-5 h-5 text-emerald-400" />
          <span className="font-bold text-base text-emerald-400">{expiredText}</span>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 text-center pt-1">
          {[
            { label: 'Days', value: timeLeft.days },
            { label: 'Hours', value: timeLeft.hours },
            { label: 'Mins', value: timeLeft.minutes },
            { label: 'Secs', value: timeLeft.seconds },
          ].map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm"
            >
              <span className="font-extrabold text-xl sm:text-2xl text-white tracking-tight">
                {String(item.value).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-white/50 font-medium mt-0.5">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
