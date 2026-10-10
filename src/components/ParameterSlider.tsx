import React, { useCallback } from 'react';
import { Info } from 'lucide-react';

interface ParameterSliderProps {
  label: string;
  sublabel?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  formatValue?: (val: number) => string;
  onChange: (val: number) => void;
  colorScheme?: 'amber' | 'cyan' | 'emerald' | 'rose' | 'indigo';
  onInfoClick?: () => void;
}

export const ParameterSlider: React.FC<ParameterSliderProps> = ({
  label,
  sublabel,
  value,
  min,
  max,
  step = 0.01,
  unit = '',
  formatValue,
  onChange,
  colorScheme = 'amber',
  onInfoClick,
}) => {
  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const num = parseFloat(e.target.value);
      if (!isNaN(num)) {
        onChange(num);
      }
    },
    [onChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const num = parseFloat(e.target.value);
      if (!isNaN(num)) {
        const clamped = Math.max(min, Math.min(max, num));
        onChange(clamped);
      }
    },
    [min, max, onChange]
  );

  const displayVal = formatValue ? formatValue(value) : (step >= 1 ? value.toFixed(0) : value.toFixed(2));
  const percent = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  const accentColorClass = {
    amber: 'accent-amber-500 text-amber-400 bg-amber-500',
    cyan: 'accent-cyan-400 text-cyan-400 bg-cyan-400',
    emerald: 'accent-emerald-400 text-emerald-400 bg-emerald-400',
    rose: 'accent-rose-500 text-rose-400 bg-rose-500',
    indigo: 'accent-indigo-400 text-indigo-400 bg-indigo-400',
  }[colorScheme];

  return (
    <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold tracking-wider text-zinc-200 uppercase truncate">
              {label}
            </span>
            {sublabel && (
              <span className="text-[10px] text-zinc-500 font-mono tracking-tight truncate">
                {sublabel}
              </span>
            )}
          </div>
          {onInfoClick && (
            <button
              type="button"
              onClick={onInfoClick}
              className={`p-0.5 text-zinc-500 focus:outline-none transition-colors shrink-0 cursor-pointer ${
                colorScheme === 'cyan' ? 'hover:text-cyan-400' : 'hover:text-amber-400'
              }`}
              title={`View technical specifications for ${label}`}
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleInputChange}
            className="w-18 bg-zinc-950 border border-zinc-700/80 rounded px-1.5 py-0.5 text-right font-mono text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80"
          />
          {unit && (
            <span className="text-[11px] font-mono text-zinc-500 w-6 text-left">
              {unit}
            </span>
          )}
        </div>
      </div>

      <div className="relative flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          className={`w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer focus:outline-none ${accentColorClass}`}
        />
      </div>

      <div className="flex justify-between text-[9px] font-mono text-zinc-600 px-0.5">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
};
