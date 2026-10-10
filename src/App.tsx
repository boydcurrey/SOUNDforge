/**
 * SOUNDforge - Procedural Sound Laboratory Proof of Concept (PoC v0.1)
 * Milestone 2 Architecture with Sticky Telemetry and Interactive Module Controls
 */

import React, { useState, useEffect, useCallback } from 'react';
import { PropulsionParams, AerodynamicParams, ParameterInfoItem } from './audio/types';
import { DEFAULT_PROPULSION_PARAMS } from './audio/presets';
import { DEFAULT_AERODYNAMIC_PARAMS } from './audio/aerodynamicPresets';
import { audioEngine } from './audio/AudioEngine';
import { Header } from './components/Header';
import { AudioVisualizer } from './components/AudioVisualizer';
import { ModuleControl } from './components/ModuleControl';
import { PropulsionPanel } from './components/PropulsionPanel';
import { AerodynamicPanel } from './components/AerodynamicPanel';
import { WavExporter } from './components/WavExporter';
import { ParameterInfoModal } from './components/ParameterInfoModal';
import { ShieldAlert, Cpu } from 'lucide-react';

export default function App() {
  const [propulsionParams, setPropulsionParams] = useState<PropulsionParams>(DEFAULT_PROPULSION_PARAMS);
  const [aeroParams, setAeroParams] = useState<AerodynamicParams>(DEFAULT_AERODYNAMIC_PARAMS);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Parameter technical documentation modal state
  const [activeParamInfo, setActiveParamInfo] = useState<{
    item: ParameterInfoItem;
    color: 'amber' | 'cyan';
  } | null>(null);

  // Coordinated solo/mute logic across both active modules
  const applyParamsToEngine = useCallback(
    (pParams: PropulsionParams, aParams: AerodynamicParams) => {
      const hasSolo = pParams.solo || aParams.solo;
      const propMod = audioEngine.getPropulsionModule();
      const aeroMod = audioEngine.getAerodynamicModule();

      if (propMod) {
        const effectiveMuted = pParams.muted || (hasSolo && !pParams.solo);
        propMod.setParams({ ...pParams, muted: effectiveMuted });
      }

      if (aeroMod) {
        const effectiveMuted = aParams.muted || (hasSolo && !aParams.solo);
        aeroMod.setParams({ ...aParams, muted: effectiveMuted });
      }
    },
    []
  );

  // Sync Propulsion changes
  const handlePropulsionChange = useCallback(
    (changed: Partial<PropulsionParams>) => {
      setPropulsionParams((prev) => {
        const next = { ...prev, ...changed };
        applyParamsToEngine(next, aeroParams);
        return next;
      });
    },
    [aeroParams, applyParamsToEngine]
  );

  const handlePropulsionReset = useCallback(() => {
    setPropulsionParams(DEFAULT_PROPULSION_PARAMS);
    applyParamsToEngine(DEFAULT_PROPULSION_PARAMS, aeroParams);
  }, [aeroParams, applyParamsToEngine]);

  const handlePropulsionRandomize = useCallback(
    (seed?: number) => {
      const propMod = audioEngine.getPropulsionModule();
      if (propMod) {
        propMod.randomizeParams(seed);
        const next = propMod.currentParams;
        setPropulsionParams(next);
        applyParamsToEngine(next, aeroParams);
      }
    },
    [aeroParams, applyParamsToEngine]
  );

  // Sync Aerodynamic changes
  const handleAeroChange = useCallback(
    (changed: Partial<AerodynamicParams>) => {
      setAeroParams((prev) => {
        const next = { ...prev, ...changed };
        applyParamsToEngine(propulsionParams, next);
        return next;
      });
    },
    [propulsionParams, applyParamsToEngine]
  );

  const handleAeroReset = useCallback(() => {
    setAeroParams(DEFAULT_AERODYNAMIC_PARAMS);
    applyParamsToEngine(propulsionParams, DEFAULT_AERODYNAMIC_PARAMS);
  }, [propulsionParams, applyParamsToEngine]);

  const handleAeroRandomize = useCallback(
    (seed?: number) => {
      const aeroMod = audioEngine.getAerodynamicModule();
      if (aeroMod) {
        aeroMod.randomizeParams(seed);
        const next = aeroMod.currentParams;
        setAeroParams(next);
        applyParamsToEngine(propulsionParams, next);
      }
    },
    [propulsionParams, applyParamsToEngine]
  );

  // Single-location output toggles in MODULE CONTROL (Requirement 2)
  const handleTogglePropulsionEnabled = useCallback(() => {
    handlePropulsionChange({ enabled: !propulsionParams.enabled });
  }, [propulsionParams.enabled, handlePropulsionChange]);

  const handleToggleAeroEnabled = useCallback(() => {
    handleAeroChange({ enabled: !aeroParams.enabled });
  }, [aeroParams.enabled, handleAeroChange]);

  return (
    <div className="h-screen w-screen bg-black text-zinc-100 font-sans selection:bg-amber-500 selection:text-black flex flex-col overflow-hidden">
      {/* 
        STICKY TOP SECTION (Requirement 1):
        - Header
        - Acoustic Signal Telemetry (Dual FFT & Oscilloscope)
        - MODULE CONTROL (Linked enable/disable group outputs)
      */}
      <div className="shrink-0 z-40 bg-zinc-950 shadow-2xl border-b border-zinc-800/80">
        <Header
          onOpenExportModal={() => setIsExportOpen(true)}
          onEngage={() => applyParamsToEngine(propulsionParams, aeroParams)}
        />

        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2">
          <AudioVisualizer />
        </div>

        <ModuleControl
          propulsionParams={propulsionParams}
          aeroParams={aeroParams}
          onTogglePropulsionEnabled={handleTogglePropulsionEnabled}
          onToggleAeroEnabled={handleToggleAeroEnabled}
        />
      </div>

      {/* 
        SCROLLABLE VIEWPORT (Requirement 1: Only contents below these sections scroll)
      */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 space-y-4">
          {/* Module Panels */}
          <div className="space-y-4">
            <PropulsionPanel
              params={propulsionParams}
              onChange={handlePropulsionChange}
              onReset={handlePropulsionReset}
              onRandomize={handlePropulsionRandomize}
              onShowParamInfo={(item, color) => setActiveParamInfo({ item, color })}
            />

            <AerodynamicPanel
              params={aeroParams}
              onChange={handleAeroChange}
              onReset={handleAeroReset}
              onRandomize={handleAeroRandomize}
              onShowParamInfo={(item, color) => setActiveParamInfo({ item, color })}
            />
          </div>

          {/* Technical Footer & DSP Specifications */}
          <footer className="pt-3 pb-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-zinc-600">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-zinc-500" />
                Dual AudioWorklet DSP Nodes / 48kHz Stereo
              </span>
              <span>·</span>
              <span>Zero Audio Samples</span>
              <span>·</span>
              <span>Pure Procedural Physical Synthesis</span>
            </div>

            <div className="flex items-center gap-2 text-zinc-500">
              <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" />
              <span>Independent Physics Synthesis Modules</span>
            </div>
          </footer>
        </main>
      </div>

      {/* Offline WAV Exporter Modal */}
      <WavExporter
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        propulsionParams={propulsionParams}
        aeroParams={aeroParams}
      />

      {/* Parameter Technical Reference Modal (Requirement 6) */}
      <ParameterInfoModal
        info={activeParamInfo ? activeParamInfo.item : null}
        onClose={() => setActiveParamInfo(null)}
        accentColor={activeParamInfo ? activeParamInfo.color : 'amber'}
      />
    </div>
  );
}
