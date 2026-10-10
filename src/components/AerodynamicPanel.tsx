import React, { useState } from 'react';
import { AerodynamicParams, AerodynamicPreset, ParameterInfoItem } from '../audio/types';
import { AERODYNAMIC_PRESETS, DEFAULT_AERODYNAMIC_PARAMS } from '../audio/aerodynamicPresets';
import { PARAMETER_DOCS } from '../audio/parameterDocs';
import { ParameterSlider } from './ParameterSlider';
import { SubModuleContainer } from './SubModuleContainer';
import {
  Wind,
  Volume2,
  VolumeX,
  RotateCcw,
  Dice5,
  Sparkles,
  Waves,
  Gauge,
  Sliders,
  Radio,
  Hash,
} from 'lucide-react';

interface AerodynamicPanelProps {
  params: AerodynamicParams;
  onChange: (newParams: Partial<AerodynamicParams>) => void;
  onReset: () => void;
  onRandomize: (seed?: number) => void;
  onShowParamInfo: (info: ParameterInfoItem, color: 'amber' | 'cyan') => void;
}

export const AerodynamicPanel: React.FC<AerodynamicPanelProps> = ({
  params,
  onChange,
  onReset,
  onRandomize,
  onShowParamInfo,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('default');
  const [seedInput, setSeedInput] = useState<string>(params.seed.toString());

  const handleApplyPreset = (preset: AerodynamicPreset) => {
    setSelectedPresetId(preset.id);
    onChange({
      ...preset.params,
    });
  };

  const handleResetToDefault = () => {
    setSelectedPresetId('default');
    onReset();
    setSeedInput(DEFAULT_AERODYNAMIC_PARAMS.seed.toString());
  };

  const handleRandomizeClick = () => {
    const newSeed = Math.floor(Math.random() * 900000) + 100000;
    setSeedInput(newSeed.toString());
    setSelectedPresetId('custom');
    onRandomize(newSeed);
  };

  const handleSeedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(seedInput, 10);
    if (!isNaN(parsed)) {
      onRandomize(parsed);
    }
  };

  const currentPreset = AERODYNAMIC_PRESETS.find((p) => p.id === selectedPresetId);
  const machNumber = (params.velocity / 340.0).toFixed(2);
  const dynamicPressureApprox = Math.round(0.5 * params.density * params.velocity * params.velocity);

  const showInfo = (id: string) => {
    const item = PARAMETER_DOCS[id];
    if (item) {
      onShowParamInfo(item, 'cyan');
    }
  };

  return (
    <div className="bg-zinc-950 border border-cyan-500/40 rounded-xl overflow-hidden shadow-2xl flex flex-col ring-1 ring-cyan-500/20">
      {/* Module Header Bar (Requirement 3: Cyan consistent group theme) */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-zinc-900 to-zinc-950 border-b border-cyan-500/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-cyan-300 uppercase">
                MODULE B: AERODYNAMIC FLOW SYNTHESIS
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              Turbulent airflow, boundary buffeting, whistling edge tones & supersonic skin shear
            </p>
          </div>
        </div>

        {/* Global Module Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Enable toggle */}
          <button
            type="button"
            onClick={() => onChange({ enabled: !params.enabled })}
            className={`px-3 py-1 text-xs font-mono rounded border transition-colors cursor-pointer ${
              params.enabled
                ? 'bg-cyan-400 text-black font-bold border-cyan-300 shadow-sm shadow-cyan-400/20'
                : 'bg-cyan-950/25 text-cyan-400/80 border-cyan-500/30 hover:bg-cyan-950/45 hover:text-cyan-300 hover:border-cyan-500/50'
            }`}
          >
            {params.enabled ? 'ENABLED' : 'DISABLED'}
          </button>

          {/* Mute */}
          <button
            type="button"
            onClick={() => onChange({ muted: !params.muted })}
            className={`p-1.5 rounded border transition-colors cursor-pointer ${
              params.muted
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-cyan-950/20 text-cyan-400/60 border-cyan-500/25 hover:bg-cyan-950/35 hover:text-cyan-300 hover:border-cyan-500/40'
            }`}
            title="Mute Module"
          >
            {params.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Solo */}
          <button
            type="button"
            onClick={() => onChange({ solo: !params.solo })}
            className={`px-2 py-1 text-xs font-mono rounded border transition-colors cursor-pointer ${
              params.solo
                ? 'bg-cyan-300 text-black font-bold border-cyan-200 shadow-sm'
                : 'bg-cyan-950/20 text-cyan-400/70 border-cyan-500/25 hover:bg-cyan-950/35 hover:text-cyan-300 hover:border-cyan-500/40'
            }`}
            title="Solo Module"
          >
            SOLO
          </button>

          {/* Pan */}
          <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 px-2 py-1 rounded text-[11px] font-mono text-zinc-300">
            <span className="text-zinc-500 text-[10px]">PAN</span>
            <input
              type="range"
              min="-1.0"
              max="1.0"
              step="0.05"
              value={params.pan}
              onChange={(e) => onChange({ pan: parseFloat(e.target.value) })}
              className="w-14 h-1 bg-zinc-800 accent-cyan-400 rounded cursor-pointer"
            />
            <span className="w-7 text-right">
              {params.pan === 0 ? 'C' : params.pan < 0 ? `L${Math.abs(Math.round(params.pan * 100))}` : `R${Math.round(params.pan * 100)}`}
            </span>
          </div>

          {/* Trim Gain */}
          <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 px-2 py-1 rounded text-[11px] font-mono text-zinc-300">
            <span className="text-zinc-500 text-[10px]">TRIM</span>
            <input
              type="range"
              min="0.0"
              max="2.0"
              step="0.05"
              value={params.gain}
              onChange={(e) => onChange({ gain: parseFloat(e.target.value) })}
              className="w-14 h-1 bg-zinc-800 accent-cyan-400 rounded cursor-pointer"
            />
            <span className="w-8 text-right font-mono">
              {Math.round(params.gain * 100)}%
            </span>
          </div>

          {/* Seed Input & Randomize */}
          <form onSubmit={handleSeedSubmit} className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 px-2 py-1 rounded">
            <Hash className="w-3 h-3 text-zinc-500" />
            <input
              type="text"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              className="w-14 bg-transparent text-xs font-mono text-zinc-200 focus:outline-none"
              title="Reproducible PRNG Seed"
            />
            <button
              type="button"
              onClick={handleRandomizeClick}
              className="p-1 text-zinc-400 hover:text-cyan-400 transition-colors cursor-pointer"
              title="Randomize Parameters with Reproducible Seed"
            >
              <Dice5 className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Reset */}
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded transition-colors cursor-pointer"
            title="Reset to default acoustic parameters"
          >
            <RotateCcw className="w-3 h-3" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Aerodynamic Acoustic Presets Bar */}
      <div className="border-b border-zinc-800/80 bg-zinc-900/40 px-4 py-2.5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold uppercase tracking-wider text-zinc-200">Aerodynamic Flow Models & Flight Regimes:</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400">
            <span>Mach {machNumber}</span>
            <span>·</span>
            <span>q ≈ {dynamicPressureApprox.toLocaleString()} Pa</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {AERODYNAMIC_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all text-left border cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-sm font-semibold'
                    : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <div>{preset.name}</div>
              </button>
            );
          })}
        </div>

        {currentPreset && (
          <p className="mt-2 text-[11px] font-mono text-zinc-400 bg-zinc-950/60 p-2 rounded border border-zinc-800/60">
            <span className="text-zinc-500 uppercase mr-1">Aerodynamic Physics:</span>
            {currentPreset.description}
          </p>
        )}
      </div>

      {/* Sub-modules Grid (Double tap header to collapse/expand; small enable/disable switch) */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* SUB-MODULE 1: Fluid Flow & Boundary Layer */}
        <SubModuleContainer
          title="1. Flow & Atmosphere"
          subtitle="Speed, density & gusts"
          icon={Gauge}
          enabled={params.enableFlow}
          onToggleEnabled={(en) => onChange({ enableFlow: en })}
          groupColor="cyan"
        >
          <ParameterSlider
            label="Airflow Intensity"
            sublabel="Fluid power"
            value={params.airflowIntensity}
            min={0.0}
            max={1.0}
            step={0.01}
            unit="pwr"
            formatValue={(v) => v.toFixed(2)}
            onChange={(val) => onChange({ airflowIntensity: val })}
            colorScheme="cyan"
            onInfoClick={() => showInfo('airflowIntensity')}
          />

          <ParameterSlider
            label="Flow Velocity"
            sublabel={`Mach ${machNumber}`}
            value={params.velocity}
            min={0.0}
            max={1500.0}
            step={5.0}
            unit="m/s"
            formatValue={(v) => `${Math.round(v)} m/s`}
            onChange={(val) => onChange({ velocity: val })}
            colorScheme="cyan"
            onInfoClick={() => showInfo('velocity')}
          />

          <ParameterSlider
            label="Air Density"
            sublabel="Atmospheric mass"
            value={params.density}
            min={0.01}
            max={1.5}
            step={0.01}
            unit="kg/m³"
            formatValue={(v) => `${v.toFixed(2)}`}
            onChange={(val) => onChange({ density: val })}
            colorScheme="cyan"
            onInfoClick={() => showInfo('density')}
          />

          <ParameterSlider
            label="Flow Turbulence"
            sublabel="Gust random walk"
            value={params.turbulence}
            min={0.0}
            max={1.0}
            step={0.01}
            unit="gst"
            formatValue={(v) => v.toFixed(2)}
            onChange={(val) => onChange({ turbulence: val })}
            colorScheme="cyan"
            onInfoClick={() => showInfo('turbulence')}
          />
        </SubModuleContainer>

        {/* SUB-MODULE 2: Resonant Cavity & Edge Tones */}
        <SubModuleContainer
          title="2. Cavity & Whistling"
          subtitle="Edge tones & cavity Q"
          icon={Sliders}
          enabled={params.enableWhistling}
          onToggleEnabled={(en) => onChange({ enableWhistling: en })}
          groupColor="cyan"
        >
          <ParameterSlider
            label="Acoustic Resonance"
            sublabel="Whistle Q factor"
            value={params.resonance}
            min={0.5}
            max={15.0}
            step={0.1}
            unit="Q"
            formatValue={(v) => `${v.toFixed(1)} Q`}
            onChange={(val) => onChange({ resonance: val })}
            colorScheme="cyan"
            onInfoClick={() => showInfo('resonance')}
          />

          <ParameterSlider
            label="Filter Bandwidth"
            sublabel="Bandpass width"
            value={params.bandwidth}
            min={50.0}
            max={3000.0}
            step={25.0}
            unit="Hz"
            formatValue={(v) => `${Math.round(v)} Hz`}
            onChange={(val) => onChange({ bandwidth: val })}
            colorScheme="cyan"
            onInfoClick={() => showInfo('bandwidth')}
          />

          <ParameterSlider
            label="Whistling Mix"
            sublabel="Edge tone mix"
            value={params.whistlingMix}
            min={0.0}
            max={1.0}
            step={0.01}
            unit="mix"
            formatValue={(v) => v.toFixed(2)}
            onChange={(val) => onChange({ whistlingMix: val })}
            colorScheme="cyan"
            onInfoClick={() => showInfo('whistlingMix')}
          />

          <ParameterSlider
            label="Whistle Pitch"
            sublabel="Base cavity frequency"
            value={params.whistlingFreq}
            min={150.0}
            max={4500.0}
            step={20.0}
            unit="Hz"
            formatValue={(v) => `${Math.round(v)} Hz`}
            onChange={(val) => onChange({ whistlingFreq: val })}
            colorScheme="cyan"
            onInfoClick={() => showInfo('whistlingFreq')}
          />
        </SubModuleContainer>

        {/* SUB-MODULE 3: Boundary Buffeting & Shudder */}
        <SubModuleContainer
          title="3. Buffeting & Shudder"
          subtitle="Boundary layer thumping"
          icon={Waves}
          enabled={params.enableBuffeting}
          onToggleEnabled={(en) => onChange({ enableBuffeting: en })}
          groupColor="cyan"
        >
          <ParameterSlider
            label="Buffeting Shudder Rate"
            sublabel="Boundary layer rumble"
            value={params.buffetingRate}
            min={0.5}
            max={35.0}
            step={0.5}
            unit="Hz"
            formatValue={(v) => `${v.toFixed(1)} Hz`}
            onChange={(val) => onChange({ buffetingRate: val })}
            colorScheme="cyan"
            onInfoClick={() => showInfo('buffetingRate')}
          />

          <ParameterSlider
            label="Buffeting Depth"
            sublabel="AM shudder depth"
            value={params.buffetingDepth}
            min={0.0}
            max={1.0}
            step={0.01}
            unit="dpth"
            formatValue={(v) => v.toFixed(2)}
            onChange={(val) => onChange({ buffetingDepth: val })}
            colorScheme="cyan"
            onInfoClick={() => showInfo('buffetingDepth')}
          />
        </SubModuleContainer>

        {/* SUB-MODULE 4: Supersonic Skin Friction & Shear */}
        <SubModuleContainer
          title="4. Supersonic Skin Shear"
          subtitle="Mach friction & hiss"
          icon={Wind}
          enabled={params.enableShear}
          onToggleEnabled={(en) => onChange({ enableShear: en })}
          groupColor="cyan"
        >
          <ParameterSlider
            label="Skin Friction Shear"
            sublabel="Highpass shear hiss"
            value={params.shearNoiseMix}
            min={0.0}
            max={1.0}
            step={0.01}
            unit="mix"
            formatValue={(v) => v.toFixed(2)}
            onChange={(val) => onChange({ shearNoiseMix: val })}
            colorScheme="cyan"
            onInfoClick={() => showInfo('shearNoiseMix')}
          />

          <ParameterSlider
            label="Noise Spectral Color"
            sublabel="0=Pink · 1=White"
            value={params.pinkWhiteRatio}
            min={0.0}
            max={1.0}
            step={0.01}
            unit="col"
            formatValue={(v) => v.toFixed(2)}
            onChange={(val) => onChange({ pinkWhiteRatio: val })}
            colorScheme="cyan"
            onInfoClick={() => showInfo('pinkWhiteRatio')}
          />
        </SubModuleContainer>
      </div>
    </div>
  );
};
