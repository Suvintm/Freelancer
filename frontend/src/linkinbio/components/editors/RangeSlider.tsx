import React from 'react';

interface RangeSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider">
        <span>{label}</span>
        <span className="text-text-main font-mono">{value}{unit}</span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-surface border border-border-main/50 rounded-lg appearance-none cursor-pointer accent-indigo-500"
      />
    </div>
  );
};

export default RangeSlider;
