import React from 'react';
import { PropulsionParams, AerodynamicParams } from '../audio/types';
import { Flame, Wind, SlidersHorizontal } from 'lucide-react';

interface ModuleControlProps {
  propulsionParams: PropulsionParams;
  aeroParams: AerodynamicParams;
  onTogglePropulsionEnabled: () => void;
  onToggleAeroEnabled: () => void;
}

export const ModuleControl: React.FC<ModuleControlProps> = ({
  propulsionParams,
  aeroParams,
  onTogglePropulsionEnabled,
  onToggleAeroEnabled,
}) => {
  const isPropAudible = propulsionParams.enabled && !propulsionParams.muted;
  const isAeroAudible = aeroParams.enabled && !aeroParams.muted;

  // Active sub-sources count
  const propActiveCount = [
    propulsionParams.enableCombustion,
    propulsionParams.enableSubharmonics,
    propulsionParams.enableChamber,
    propulsionParams.enableNoise,
    propulsionParams.enableModulation,
    propulsionParams.enableInstability,
  ].filter(Boolean).length;

  const aeroActiveCount = [
    aeroParams.enableFlow,
    aeroParams.enableWhistling,
    aeroParams.enableBuffeting,
    aeroParams.enableShear,
  ].filter(Boolean).length;

  return (
    <div className="bg-zinc-950/95 border-b border-zinc-800 px-3 sm:px-4 py-2.5 shadow-lg backdrop-blur">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Title */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-zinc-200 uppercase">
            MODULE CONTROL
          </span>
          <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
            · Primary Sound Output & Routing
          </span>
        </div>

        {/* Linked Output Control Buttons (Requirement 2 & 3: Amber & Cyan group colors) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Module A: Propulsion Output Toggle */}
          <button
            type="button"
            onClick={onTogglePropulsionEnabled}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
              isPropAudible
                ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-sm shadow-amber-500/20'
                : 'bg-amber-950/20 text-amber-400/80 border-amber-500/30 hover:bg-amber-950/40 hover:text-amber-300 hover:border-amber-500/50 shadow-sm shadow-amber-950/30'
            }`}
            title="Toggle Propulsion Engine Output (Linked directly to Module A)"
          >
            <Flame className={`w-3.5 h-3.5 ${isPropAudible ? 'text-black fill-current' : 'text-amber-500/60'}`} />
            <span className={isPropAudible ? 'font-bold' : 'font-medium'}>PROPULSION</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                isPropAudible
                  ? 'bg-black/20 text-black'
                  : 'bg-amber-950/50 text-amber-400/80 border border-amber-500/30'
              }`}
            >
              {isPropAudible ? 'ON' : 'OFF'}
            </span>
            <span className={`text-[10px] hidden md:inline opacity-75 font-normal ${isPropAudible ? 'text-black' : 'text-amber-500/60'}`}>
              ({propActiveCount}/6 src)
            </span>
          </button>

          {/* Module B: Aerodynamics Output Toggle */}
          <button
            type="button"
            onClick={onToggleAeroEnabled}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
              isAeroAudible
                ? 'bg-cyan-400 text-black border-cyan-300 font-bold shadow-sm shadow-cyan-400/20'
                : 'bg-cyan-950/20 text-cyan-400/80 border-cyan-500/30 hover:bg-cyan-950/40 hover:text-cyan-300 hover:border-cyan-500/50 shadow-sm shadow-cyan-950/30'
            }`}
            title="Toggle Aerodynamic Flow Output (Linked directly to Module B)"
          >
            <Wind className={`w-3.5 h-3.5 ${isAeroAudible ? 'text-black fill-current' : 'text-cyan-500/60'}`} />
            <span className={isAeroAudible ? 'font-bold' : 'font-medium'}>AERODYNAMICS</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                isAeroAudible
                  ? 'bg-black/20 text-black'
                  : 'bg-cyan-950/50 text-cyan-400/80 border border-cyan-500/30'
              }`}
            >
              {isAeroAudible ? 'ON' : 'OFF'}
            </span>
            <span className={`text-[10px] hidden md:inline opacity-75 font-normal ${isAeroAudible ? 'text-black' : 'text-cyan-500/60'}`}>
              ({aeroActiveCount}/4 src)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
