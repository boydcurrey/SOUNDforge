import React from 'react';
import { ParameterInfoItem } from '../audio/types';
import { X, HelpCircle, Activity, Compass, Gauge, Clock } from 'lucide-react';

interface ParameterInfoModalProps {
  info: ParameterInfoItem | null;
  onClose: () => void;
  accentColor?: 'amber' | 'cyan';
}

export const ParameterInfoModal: React.FC<ParameterInfoModalProps> = ({
  info,
  onClose,
  accentColor = 'amber',
}) => {
  if (!info) return null;

  const isAmber = accentColor === 'amber';
  const badgeStyle = isAmber
    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
  const headingStyle = isAmber ? 'text-amber-400' : 'text-cyan-400';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-lg w-full p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded-lg hover:bg-zinc-900"
          title="Close documentation"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-4 pr-8">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${badgeStyle}`}>
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-mono font-bold text-zinc-100 uppercase tracking-wider">
                {info.name}
              </h2>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badgeStyle}`}>
                {info.unit}
              </span>
            </div>
            <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
              Parameter ID: <code className="text-zinc-400">{info.id}</code> · Operating Range: <span className="text-zinc-300 font-semibold">{info.range}</span>
            </p>
          </div>
        </div>

        {/* 4 Core In-Depth Sections */}
        <div className="space-y-3 text-xs font-mono">
          {/* 1. What it is */}
          <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/80">
            <div className="flex items-center gap-1.5 mb-1.5 font-bold uppercase tracking-wider text-[11px] text-zinc-300">
              <Compass className={`w-3.5 h-3.5 ${headingStyle}`} />
              <span>1. Physical & DSP Definition</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              {info.whatItIs}
            </p>
          </div>

          {/* 2. Sonic Contribution */}
          <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/80">
            <div className="flex items-center gap-1.5 mb-1.5 font-bold uppercase tracking-wider text-[11px] text-zinc-300">
              <Activity className={`w-3.5 h-3.5 ${headingStyle}`} />
              <span>2. Soundscape Contribution</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              {info.sonicContribution}
            </p>
          </div>

          {/* 3. Range & Units Rationale */}
          <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/80">
            <div className="flex items-center gap-1.5 mb-1.5 font-bold uppercase tracking-wider text-[11px] text-zinc-300">
              <Gauge className={`w-3.5 h-3.5 ${headingStyle}`} />
              <span>3. Value Range & Units Rationale</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              {info.rangeRationale}
            </p>
          </div>

          {/* 4. Flight Evolution */}
          <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/80">
            <div className="flex items-center gap-1.5 mb-1.5 font-bold uppercase tracking-wider text-[11px] text-zinc-300">
              <Clock className={`w-3.5 h-3.5 ${headingStyle}`} />
              <span>4. Mission Profile & Trajectory Evolution</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              {info.flightEvolution}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <span>SOUNDforge Technical Acoustics Reference</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
