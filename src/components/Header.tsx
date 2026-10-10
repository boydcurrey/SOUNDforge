import React, { useEffect, useState } from 'react';
import { Play, Square, RotateCcw, Volume2, VolumeX, Download, Radio, AlertTriangle } from 'lucide-react';
import { audioEngine } from '../audio/AudioEngine';
import { AudioEngineMetrics } from '../audio/types';

interface HeaderProps {
  onOpenExportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenExportModal }) => {
  const [metrics, setMetrics] = useState<AudioEngineMetrics>({
    isRunning: false,
    sampleRate: 48000,
    outputLatency: 0.005,
    peakL: 0,
    peakR: 0,
    rms: 0,
    isClipping: false,
    timeElapsed: 0,
  });
  const [masterVolume, setMasterVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setMetrics(audioEngine.getMetrics());
    }, 40); // 25fps telemetry update
    return () => clearInterval(timer);
  }, []);

  const handleTogglePlay = async () => {
    if (metrics.isRunning) {
      audioEngine.stop();
    } else {
      await audioEngine.start();
    }
  };

  const handleStop = () => {
    audioEngine.stop();
  };

  const handleRestart = () => {
    audioEngine.restart();
  };

  const handleVolumeChange = (newVol: number) => {
    setMasterVolume(newVol);
    if (!isMuted) {
      audioEngine.setMasterGain(newVol);
    }
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      audioEngine.setMasterGain(masterVolume);
    } else {
      setIsMuted(true);
      audioEngine.setMasterGain(0);
    }
  };

  const formatMissionTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    const padMin = mins.toString().padStart(2, '0');
    const [intSec, fracSec] = secs.split('.');
    const padSec = intSec.padStart(2, '0');
    return `T+${padMin}:${padSec}.${fracSec}`;
  };

  const peakPercentL = Math.min(100, Math.max(0, metrics.peakL * 100));
  const peakPercentR = Math.min(100, Math.max(0, metrics.peakR * 100));

  return (
    <header className="bg-zinc-950 border-b border-zinc-800 px-4 py-3 sticky top-0 z-30 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & System Readout */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-zinc-900 border border-amber-500/40 flex items-center justify-center text-amber-400 font-mono font-bold text-lg shadow-inner">
            SF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-wider text-zinc-100 font-mono">
                SOUNDFORGE
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                PoC v0.1
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Milestones 1 & 2: Propulsion + Aerodynamics
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Procedural Physical Acoustic Synthesis Laboratory
            </p>
          </div>
        </div>

        {/* Master Transport & Mission Clock */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mission Elapsed Time */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Radio className={`w-3.5 h-3.5 ${metrics.isRunning ? 'text-amber-400 animate-pulse' : 'text-zinc-600'}`} />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Mission Clock</span>
              <span className="text-sm font-mono font-semibold text-zinc-200">
                {formatMissionTime(metrics.timeElapsed)}
              </span>
            </div>
          </div>

          {/* Transport Buttons */}
          <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={handleTogglePlay}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all shadow-sm ${
                metrics.isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
              title={metrics.isRunning ? 'Pause Audio Engine' : 'Start / Engage Audio Synthesis'}
            >
              {metrics.isRunning ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>ENGAGE</span>
                </>
              )}
            </button>

            <button
              onClick={handleStop}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
              title="Stop Engine"
            >
              <Square className="w-4 h-4" />
            </button>

            <button
              onClick={handleRestart}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
              title="Reset Clock to T-00:00"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Master Output Level & Meters */}
          <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 rounded-lg px-2.5 py-1.5">
            <button
              onClick={handleToggleMute}
              className={`p-1 rounded text-zinc-400 hover:text-zinc-100 transition-colors ${
                isMuted ? 'text-rose-400 bg-rose-500/10' : ''
              }`}
              title={isMuted ? 'Unmute Master' : 'Mute Master'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400">
                <span>MASTER</span>
                <span>{isMuted ? 'MUTED' : `${Math.round(masterVolume * 100)}%`}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.01"
                value={isMuted ? 0 : masterVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-20 sm:w-24 h-1.5 bg-zinc-800 accent-amber-500 rounded appearance-none cursor-pointer"
              />
            </div>

            {/* Stereo Peak Meter */}
            <div className="flex flex-col gap-1 pl-1">
              <div className="flex items-center gap-1">
                <span className="text-[8px] font-mono text-zinc-600">L</span>
                <div className="w-12 h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full transition-all duration-75 ${
                      metrics.isClipping ? 'bg-rose-500' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${peakPercentL}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[8px] font-mono text-zinc-600">R</span>
                <div className="w-12 h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full transition-all duration-75 ${
                      metrics.isClipping ? 'bg-rose-500' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${peakPercentR}%` }}
                  />
                </div>
              </div>
            </div>

            {metrics.isClipping && (
              <span className="text-[9px] font-mono text-rose-400 font-bold animate-pulse" title="Master Peak Limiter Engaged">
                LIMIT
              </span>
            )}
          </div>

          {/* Offline WAV Export trigger */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-200 border border-zinc-700 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors"
            title="Render offline 16-bit PCM WAV"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>EXPORT WAV</span>
          </button>
        </div>
      </div>
    </header>
  );
};
