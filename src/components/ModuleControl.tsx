import React from 'react';
import { PropulsionParams, AerodynamicParams } from '../audio/types';
import { Flame, Wind, SlidersHorizontal, Power, Eye } from 'lucide-react';

export type ViewFilterMode = 'all' | 'propulsion' | 'aerodynamic';

interface ModuleControlProps {
  propulsionParams: PropulsionParams;
  aeroParams: AerodynamicParams;
  onTogglePropulsionEnabled: () => void;
  onToggleAeroEnabled: () => void;
  viewMode: ViewFilterMode;
  onSelectViewMode: (mode: ViewFilterMode) => void;
}

export const ModuleControl: React.FC<ModuleControlProps> = ({
  propulsionParams,
  aeroParams,
  onTogglePropulsionEnabled,
  onToggleAeroEnabled,
  viewMode,
  onSelectViewMode,
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
                : 'bg-zinc-900/90 text-zinc-500 border-zinc-800 hover:text-zinc-300'
            }`}
            title="Toggle Propulsion Engine Output (Linked directly to Module A)"
          >
            <Flame className={`w-3.5 h-3.5 ${isPropAudible ? 'text-black fill-current' : 'text-zinc-600'}`} />
            <span>PROPULSION</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                isPropAudible ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {isPropAudible ? 'ON' : 'OFF'}
            </span>
            <span className={`text-[10px] hidden md:inline opacity-75 font-normal`}>
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
                : 'bg-zinc-900/90 text-zinc-500 border-zinc-800 hover:text-zinc-300'
            }`}
            title="Toggle Aerodynamic Flow Output (Linked directly to Module B)"
          >
            <Wind className={`w-3.5 h-3.5 ${isAeroAudible ? 'text-black fill-current' : 'text-zinc-600'}`} />
            <span>AERODYNAMICS</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                isAeroAudible ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {isAeroAudible ? 'ON' : 'OFF'}
            </span>
            <span className={`text-[10px] hidden md:inline opacity-75 font-normal`}>
              ({aeroActiveCount}/4 src)
            </span>
          </button>

          {/* View Filter / Jump */}
          <div className="flex items-center gap-0.5 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[11px] font-mono ml-auto sm:ml-2">
            <span className="text-zinc-600 px-1.5 hidden lg:inline flex items-center gap-1">
              <Eye className="w-3 h-3" /> View:
            </span>
            <button
              type="button"
              onClick={() => onSelectViewMode('all')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Dual
            </button>
            <button
              type="button"
              onClick={() => onSelectViewMode('propulsion')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                viewMode === 'propulsion'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Mod A
            </button>
            <button
              type="button"
              onClick={() => onSelectViewMode('aerodynamic')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                viewMode === 'aerodynamic'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Mod B
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
