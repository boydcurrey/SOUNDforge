import React, { useState } from 'react';
import { PropulsionParams, PropulsionPreset, ParameterInfoItem } from '../audio/types';
import { PROPULSION_PRESETS, DEFAULT_PROPULSION_PARAMS } from '../audio/presets';
import { PARAMETER_DOCS } from '../audio/parameterDocs';
import { ParameterSlider } from './ParameterSlider';
import { SubModuleContainer } from './SubModuleContainer';
import {
  Flame,
  Volume2,
  VolumeX,
  RotateCcw,
  Dice5,
  Sparkles,
  Waves,
  Zap,
  Gauge,
  Radio,
  Hash,
  Sliders,
} from 'lucide-react';

interface PropulsionPanelProps {
  params: PropulsionParams;
  onChange: (newParams: Partial<PropulsionParams>) => void;
  onReset: () => void;
  onRandomize: (seed?: number) => void;
  onShowParamInfo: (info: ParameterInfoItem, color: 'amber' | 'cyan') => void;
}

export const PropulsionPanel: React.FC<PropulsionPanelProps> = ({
  params,
  onChange,
  onReset,
  onRandomize,
  onShowParamInfo,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('default');
  const [seedInput, setSeedInput] = useState<string>(params.seed.toString());

  const handleApplyPreset = (preset: PropulsionPreset) => {
    setSelectedPresetId(preset.id);
    onChange({
      ...preset.params,
    });
  };

  const handleResetToDefault = () => {
    setSelectedPresetId('default');
    onReset();
    setSeedInput(DEFAULT_PROPULSION_PARAMS.seed.toString());
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

  const currentPreset = PROPULSION_PRESETS.find((p) => p.id === selectedPresetId);

  const showInfo = (id: string) => {
    const item = PARAMETER_DOCS[id];
    if (item) {
      onShowParamInfo(item, 'amber');
    }
  };

  return (
    <div className="bg-zinc-950 border border-amber-500/40 rounded-xl overflow-hidden shadow-2xl flex flex-col ring-1 ring-amber-500/20">
      {/* Module Header Bar (Requirement 3: Amber consistent group theme) */}
      <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 border-b border-amber-500/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-amber-300 uppercase">
                MODULE A: PROPULSION SYNTHESIS
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                params.enabled && !params.muted
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 font-semibold'
                  : 'bg-zinc-800 text-zinc-500 border-zinc-700'
              }`}>
                {params.enabled && !params.muted ? 'ACTIVE · SYNTHESIZING' : 'BYPASSED'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              Continuous evolving rocket combustion engine & physical acoustic graph
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
                ? 'bg-amber-500 text-black font-bold border-amber-400 shadow-sm shadow-amber-500/20'
                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-zinc-200'
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
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
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
                ? 'bg-amber-400 text-black font-bold border-amber-300 shadow-sm'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
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
              className="w-14 h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
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
              className="w-14 h-1 bg-zinc-800 accent-amber-500 rounded cursor-pointer"
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
              className="p-1 text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
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

      {/* Acoustic Presets Quick Bar */}
      <div className="border-b border-zinc-800/80 bg-zinc-900/40 px-4 py-2.5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold uppercase tracking-wider text-zinc-200">Acoustic Engine Models & Presets:</span>
          </div>
          {currentPreset && (
            <span className="text-[10px] font-mono text-amber-400/90">
              {currentPreset.subtitle}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PROPULSION_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all text-left border cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm font-semibold'
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
            <span className="text-zinc-500 uppercase mr-1">Physical Mechanics:</span>
            {currentPreset.description}
          </p>
        )}
      </div>

      {/* Sub-modules Grid (Double tap header to collapse/expand; small enable/disable switch) */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* SUB-MODULE 1: Combustion Dynamics */}
        <SubModuleContainer
          title="1. Combustion Dynamics"
          subtitle="Flame pulse train & crackle shock fronts"
          icon={Gauge}
          enabled={params.enableCombustion}
          onToggleEnabled={(en) => onChange({ enableCombustion: en })}
          groupColor="amber"
        >
          <ParameterSlider
            label="Thrust Intensity"
            sublabel="Throttle index"
            value={params.intensity}
            min={0.0}
            max={1.0}
            step={0.01}
            unit="idx"
            formatValue={(v) => v.toFixed(2)}
            onChange={(val) => onChange({ intensity: val })}
            colorScheme="amber"
            onInfoClick={() => showInfo('intensity')}
          />

          <ParameterSlider
            label="Combustion Rate"
            sublabel="Pulse frequency"
            value={params.combustionRate}
            min={5.0}
            max={120.0}
            step={0.5}
            unit="Hz"
            formatValue={(v) => `${v.toFixed(1)} Hz`}
            onChange={(val) => onChange({ combustionRate: val })}
            colorScheme="amber"
            onInfoClick={() => showInfo('combustionRate')}
          />

          <ParameterSlider
            label="Shock Asymmetry"
            sublabel="Crackle skewness"
            value={params.combustionAsymmetry}
            min={0.0}
            max={1.0}
            step={0.01}
            unit="γ"
            formatValue={(v) => `${v.toFixed(2)} γ`}
            onChange={(val) => onChange({ combustionAsymmetry: val })}
            colorScheme="amber"
            onInfoClick={() => showInfo('combustionAsymmetry')}
          />

          <ParameterSlider
            label="Combustion Jitter"
            sublabel="Period flutter"
            value={params.combustionJitter}
            min={0.0}
            max={1.0}
            step={0.01}
            unit="Δt/t"
            formatValue={(v) => `${Math.round(v * 100)}%`}
            onChange={(val) => onChange({ combustionJitter: val })}
            colorScheme="amber"
            onInfoClick={() => showInfo('combustionJitter')}
          />
        </SubModuleContainer>

        {/* SUB-MODULE 2: Subharmonics & Rumble */}
        <SubModuleContainer
          title="2. Subharmonics & Rumble"
          subtitle="Seismic weight & infrasonic waves"
          icon={Waves}
          enabled={params.enableSubharmonics}
          onToggleEnabled={(en) => onChange({ enableSubharmonics: en })}
          groupColor="amber"
        >
          <ParameterSlider
            label="Low-Frequency Energy"
            sublabel="Infrasound level"
            value={params.lowFreqEnergy}
            min={0.0}
            max={1.0}
            step={0.01}
            unit="wt"
            formatValue={(v) => v.toFixed(2)}
            onChange={(val) => onChange({ lowFreqEnergy: val })}
            colorScheme="amber"
            onInfoClick={() => showInfo('lowFreqEnergy')}
          />

          <ParameterSlider
            label="Subharmonic Mix"
            sublabel="f/2 & f/3 intermodulation"
            value={params.subharmonicMix}
            min={0.0}
            max={1.0}
            step={0.01}
            unit="mix"
            formatValue={(v) => v.toFixed(2)}
            onChange={(val) => onChange({ subharmonicMix: val })}
            colorScheme="amber"
            onInfoClick={() => showInfo('subharmonicMix')}
          />

          <ParameterSlider
            label="Sub-bass Root"
            sublabel="Infrasonic frequency"
            value={params.subharmonicFreq}
            min={10.0}
            max={60.0}
            step={0.5}
            unit="Hz"
            formatValue={(v) => `${v.toFixed(1)} Hz`}
            onChange={(val) => onChange({ subharmonicFreq: val })}
            colorScheme="amber"
            onInfoClick={() => showInfo('subharmonicFreq')}
          />

          <ParameterSlider
            label="Harmonic Richness"
            sublabel="Modal standing waves"
            value={params.harmonicRichness}
            min={0.0}
            max={1.0}
            step={0.01}
            unit="bal"
            formatValue={(v) => v.toFixed(2)}
            onChange={(val) => onChange({ harmonicRichness: val })}
            colorScheme="amber"
            onInfoClick={() => showInfo('harmonicRichness')}
          />
        </SubModuleContainer>

        {/* SUB-MODULE 3: Chamber Acoustics */}
        <SubModuleContainer
          title="3. Chamber Acoustics"
          subtitle="Nozzle bell & throat standing wave"
          icon={Sliders}
          enabled={params.enableChamber}
          onToggleEnabled={(en) => onChange({ enableChamber: en })}
          groupColor="amber"
        >
          <ParameterSlider
            label="Spectral Brightness"
            sublabel="Plume high cutoff"
            value={params.spectralBrightness}
            min={150.0}
            max={10000.0}
            step={25.0}
            unit="Hz"
            formatValue={(v) => `${Math.round(v)} Hz`}
            onChange={(val) => onChange({ spectralBrightness: val })}
            colorScheme="amber"
            onInfoClick={() => showInfo('spectralBrightness')}
          />

          <ParameterSlider
            label="Chamber Resonant Freq"
            sublabel="Throat cavity acoustic mode"
            value={params.chamberFreq}
            min={60.0}
            max={500.0}
            step={1.0}
            unit="Hz"
            formatValue={(v) => `${Math.round(v)} Hz`}
            onChange={(val) => onChange({ chamberFreq: val })}
            colorScheme="amber"
            onInfoClick={() => showInfo('chamberFreq')}
          />

          <ParameterSlider
            label="Chamber Q Factor"
            sublabel="Modal resonance sharpness"
            value={params.chamberResonance}
            min={0.5}
            max={10.0}
            step={0.1}
            unit="Q"
            formatValue={(v) => `${v.toFixed(1)} Q`}
            onChange={(val) => onChange({ chamberResonance: val })}
            colorScheme="amber"
            onInfoClick={() => showInfo('chamberResonance')}
          />

          <ParameterSlider
            label="Acoustic Saturation"
            sublabel="Non-linear air compression"
            value={params.saturationDrive}
            min={1.0}
            max={10.0}
            step={0.1}
            unit="x"
            formatValue={(v) => `${v.toFixed(1)}x`}
            onChange={(val) => onChange({ saturationDrive: val })}
            colorScheme="amber"
            onInfoClick={() => showInfo('saturationDrive')}
          />
        </SubModuleContainer>

        {/* SUB-MODULE 4: Broadband Jet Roar */}
        <SubModuleContainer
          title="4. Broadband Jet Roar"
          subtitle="Supersonic exhaust shear noise"
          icon={Waves}
          enabled={params.enableNoise}
          onToggleEnabled={(en) => onChange({ enableNoise: en })}
          groupColor="amber"
        >
          <ParameterSlider
            label="Broadband Noise Mix"
            sublabel="Turbulent mixing roar"
            value={params.noiseBroadbandMix}
            min={0.0}
            max={1.0}
            step={0.01}
            unit="mix"
            formatValue={(v) => v.toFixed(2)}
            onChange={(val) => onChange({ noiseBroadbandMix: val })}
            colorScheme="amber"
            onInfoClick={() => showInfo('noiseBroadbandMix')}
          />

          <ParameterSlider
            label="Noise Spectral Color"
            sublabel="0=Brown · 0.5=Pink · 1=White"
            value={params.noiseColor}
            min={0.0}
            max={1.0}
            step={0.01}
            unit="tilt"
            formatValue={(v) => v.toFixed(2)}
            onChange={(val) => onChange({ noiseColor: val })}
            colorScheme="amber"
            onInfoClick={() => showInfo('noiseColor')}
          />

          <ParameterSlider
            label="Thermal Warmth Bias"
            sublabel="DC offset / even harmonic bias"
            value={params.warmthBias}
            min={-0.3}
            max={0.3}
            step={0.01}
            unit="bias"
            formatValue={(v) => v.toFixed(2)}
            onChange={(val) => onChange({ warmthBias: val })}
            colorScheme="amber"
            onInfoClick={() => showInfo('warmthBias')}
          />
        </SubModuleContainer>

        {/* SUB-MODULE 5: Multi-Scale Modulation */}
        <SubModuleContainer
          title="5. Multi-Scale Modulation"
          subtitle="Thermal drift & vortex flutter"
          icon={Radio}
          enabled={params.enableModulation}
          onToggleEnabled={(en) => onChange({ enableModulation: en })}
          groupColor="amber"
        >
          <ParameterSlider
            label="Slow Plume Drift Rate"
            sublabel="Atmospheric expansion cycle"
            value={params.slowModRate}
            min={0.02}
            max={1.5}
            step={0.01}
            unit="Hz"
            formatValue={(v) => `${v.toFixed(2)} Hz`}
            onChange={(val) => onChange({ slowModRate: val })}
            colorScheme="amber"
            onInfoClick={() => showInfo('slowModRate')}
          />

          <ParameterSlider
            label="Slow Plume Depth"
            sublabel="Thermal drift modulation depth"
            value={params.slowModDepth}
            min={0.0}
            max={1.0}
            step={0.01}
            unit="dpth"
            formatValue={(v) => v.toFixed(2)}
            onChange={(val) => onChange({ slowModDepth: val })}
            colorScheme="amber"
            onInfoClick={() => showInfo('slowModDepth')}
          />

          <ParameterSlider
            label="Fast Flutter Rate"
            sublabel="Combustion vortex shedding"
            value={params.fastModRate}
            min={4.0}
            max={45.0}
            step={0.5}
            unit="Hz"
            formatValue={(v) => `${v.toFixed(1)} Hz`}
            onChange={(val) => onChange({ fastModRate: val })}
            colorScheme="amber"
            onInfoClick={() => showInfo('fastModRate')}
          />

          <ParameterSlider
            label="Fast Flutter Depth"
            sublabel="Vortex flutter depth"
            value={params.fastModDepth}
            min={0.0}
            max={1.0}
            step={0.01}
            unit="dpth"
            formatValue={(v) => v.toFixed(2)}
            onChange={(val) => onChange({ fastModDepth: val })}
            colorScheme="amber"
            onInfoClick={() => showInfo('fastModDepth')}
          />
        </SubModuleContainer>

        {/* SUB-MODULE 6: Controlled Instability */}
        <SubModuleContainer
          title="6. Controlled Instability"
          subtitle="Chaos wander & shock spikes"
          icon={Zap}
          enabled={params.enableInstability}
          onToggleEnabled={(en) => onChange({ enableInstability: en })}
          groupColor="amber"
        >
          <ParameterSlider
            label="Flame Instability"
            sublabel="Stochastic chaos wander"
            value={params.instability}
            min={0.0}
            max={1.0}
            step={0.01}
            unit="idx"
            formatValue={(v) => v.toFixed(2)}
            onChange={(val) => onChange({ instability: val })}
            colorScheme="amber"
            onInfoClick={() => showInfo('instability')}
          />

          <ParameterSlider
            label="Acoustic Crackle Spikes"
            sublabel="Shock-front pressure spikes"
            value={params.flameCrackleDensity}
            min={0.0}
            max={1.0}
            step={0.01}
            unit="ev/s"
            formatValue={(v) => `${Math.round(v * 250)}/s`}
            onChange={(val) => onChange({ flameCrackleDensity: val })}
            colorScheme="amber"
            onInfoClick={() => showInfo('flameCrackleDensity')}
          />
        </SubModuleContainer>
      </div>
    </div>
  );
};
