import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';

interface PlanExpirationCountdownProps {
  currentPeriodEnd?: string | Date;
  currentPeriodStart?: string | Date;
  cancelAtPeriodEnd?: boolean;
  status?: string;
  isDarkMode?: boolean;
  compact?: boolean;
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isExpired: boolean;
  progressPercent: number;
  formattedDate: string;
}

const PlanExpirationCountdownComponent: React.FC<PlanExpirationCountdownProps> = ({
  currentPeriodEnd,
  currentPeriodStart,
  cancelAtPeriodEnd = false,
  status: _status = 'active',
  isDarkMode = false,
  compact: _compact = false,
  className = '',
}) => {
  // Parse target date safely with fallback
  const targetDate = useMemo(() => {
    if (!currentPeriodEnd) {
      const d = new Date();
      d.setDate(d.getDate() + 28);
      d.setHours(d.getHours() + 14);
      return d;
    }
    const parsed = new Date(currentPeriodEnd);
    return isNaN(parsed.getTime()) ? new Date(Date.now() + 28 * 86400000) : parsed;
  }, [currentPeriodEnd]);

  // Parse start date safely with fallback
  const startDate = useMemo(() => {
    if (!currentPeriodStart) {
      return new Date(targetDate.getTime() - 30 * 86400000);
    }
    const parsed = new Date(currentPeriodStart);
    return isNaN(parsed.getTime()) ? new Date(targetDate.getTime() - 30 * 86400000) : parsed;
  }, [currentPeriodStart, targetDate]);

  // Calculate remaining time with 100% precision
  const calculateTimeRemaining = useCallback((): TimeRemaining => {
    const now = Date.now();
    const targetEpoch = targetDate.getTime();
    const startEpoch = startDate.getTime();

    const totalMs = targetEpoch - now;
    const isExpired = totalMs <= 0;

    const remaining = Math.max(0, totalMs);
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    const totalCycleMs = Math.max(1000, targetEpoch - startEpoch);
    const elapsedMs = Math.min(totalCycleMs, Math.max(0, now - startEpoch));
    const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalCycleMs) * 100)));

    const formattedDate = targetDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return {
      days,
      hours,
      minutes,
      seconds,
      totalMs,
      isExpired,
      progressPercent,
      formattedDate,
    };
  }, [targetDate, startDate]);

  const [time, setTime] = useState<TimeRemaining>(calculateTimeRemaining);

  // High-Efficiency Timer with Page Visibility Optimization (0 CPU on background tab)
  useEffect(() => {
    setTime(calculateTimeRemaining());
    let intervalId: any = null;

    const tick = () => {
      setTime(calculateTimeRemaining());
    };

    const startTimer = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(tick, 1000);
    };

    const stopTimer = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopTimer();
      } else {
        tick();
        startTimer();
      }
    };

    startTimer();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [calculateTimeRemaining]);

  if (time.isExpired) {
    return (
      <div
        className={`px-3 py-1.5 rounded-full border flex items-center gap-2 text-xs font-semibold shadow-sm ${
          isDarkMode
            ? 'bg-white text-rose-700 border-rose-300'
            : 'bg-black text-rose-400 border-rose-900/60'
        } ${className}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        <span>Expired on {time.formattedDate}</span>
      </div>
    );
  }

  // ── DYNAMIC TIME-LINE COLOR SCHEME ──────────
  // > 7 days: Pure Green
  // 3-7 days: Light Green / Lime
  // 1-3 days: Orange / Amber
  // < 1 day: Dark Red / Crimson
  const timeStage =
    time.days > 7
      ? 'pure-green'
      : time.days >= 3
      ? 'light-green'
      : time.days >= 1
      ? 'orange'
      : 'dark-red';

  const colorConfig = {
    'pure-green': {
      textLight: 'text-emerald-400',
      textDark: 'text-emerald-600',
      dotBg: 'bg-emerald-500',
      borderGlow: 'border-emerald-500/30',
      badgeBg: 'bg-emerald-500/15',
    },
    'light-green': {
      textLight: 'text-lime-400',
      textDark: 'text-lime-600',
      dotBg: 'bg-lime-500',
      borderGlow: 'border-lime-500/30',
      badgeBg: 'bg-lime-500/15',
    },
    orange: {
      textLight: 'text-amber-400',
      textDark: 'text-amber-600',
      dotBg: 'bg-amber-500',
      borderGlow: 'border-amber-500/40',
      badgeBg: 'bg-amber-500/20',
    },
    'dark-red': {
      textLight: 'text-rose-400',
      textDark: 'text-rose-600',
      dotBg: 'bg-rose-600',
      borderGlow: 'border-rose-500/50',
      badgeBg: 'bg-rose-500/25',
    },
  }[timeStage];

  const labelText = cancelAtPeriodEnd ? 'Expires in' : 'Renews in';
  const digitTextColor = isDarkMode ? colorConfig.textDark : colorConfig.textLight;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-md transition-all select-none ${
        isDarkMode
          ? 'bg-white text-black border-zinc-200/80 shadow-zinc-900/10'
          : 'bg-black text-white border-zinc-800 shadow-black/20'
      } ${className}`}
    >
      {/* ── STATUS PULSING DOT (Colored by Time-Line) ────────── */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colorConfig.dotBg}`}
        />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${colorConfig.dotBg}`} />
      </span>

      {/* ── LABEL ────────── */}
      <span
        className={`text-[10.5px] font-medium tracking-tight whitespace-nowrap leading-none ${
          isDarkMode ? 'text-zinc-600' : 'text-zinc-400'
        }`}
      >
        {labelText}:
      </span>

      {/* ── TICKING COUNTDOWN DIGITS (Compact & Sleek) ────────── */}
      <div className="flex items-center gap-1 font-mono text-xs font-bold leading-none">
        {time.days > 0 && (
          <span className="flex items-baseline">
            <strong className={digitTextColor}>{time.days}</strong>
            <span
              className={`text-[9.5px] font-sans font-medium ml-0.5 ${
                isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
              d
            </span>
          </span>
        )}

        <span className="flex items-baseline">
          <strong className={digitTextColor}>{String(time.hours).padStart(2, '0')}</strong>
          <span
            className={`text-[9.5px] font-sans font-medium ml-0.5 ${
              isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
            }`}
          >
            h
          </span>
        </span>

        <span className="flex items-baseline">
          <strong className={digitTextColor}>{String(time.minutes).padStart(2, '0')}</strong>
          <span
            className={`text-[9.5px] font-sans font-medium ml-0.5 ${
              isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
            }`}
          >
            m
          </span>
        </span>

        <span className="flex items-baseline">
          <strong className={`${digitTextColor} w-[18px] text-right inline-block`}>
            {String(time.seconds).padStart(2, '0')}
          </strong>
          <span
            className={`text-[9.5px] font-sans font-medium ml-0.5 ${
              isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
            }`}
          >
            s
          </span>
        </span>
      </div>
    </div>
  );
};

export const PlanExpirationCountdown = React.memo(PlanExpirationCountdownComponent);
export default PlanExpirationCountdown;
