import React, { useState } from 'react';
import { PropulsionParams, AerodynamicParams } from '../audio/types';
import { audioEngine } from '../audio/AudioEngine';
import { Download, X, Check, Loader2, FileAudio } from 'lucide-react';

interface WavExporterProps {
  isOpen: boolean;
  onClose: () => void;
  propulsionParams: PropulsionParams;
  aeroParams: AerodynamicParams;
}

export const WavExporter: React.FC<WavExporterProps> = ({
  isOpen,
  onClose,
  propulsionParams,
  aeroParams,
}) => {
  const [duration, setDuration] = useState<number>(10);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRenderAndDownload = async () => {
    try {
      setIsRendering(true);
      setDownloadSuccess(false);

      // Offline render of both active modules with current parameters
      const wavBlob = await audioEngine.renderOfflineWav(duration, propulsionParams, aeroParams);

      // Trigger download
      const url = URL.createObjectURL(wavBlob);
      const anchor = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      anchor.href = url;
      anchor.download = `soundforge_flight_render_${duration}s_${timestamp}.wav`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 4000);
    } catch (err) {
      console.error('WAV export error:', err);
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-md w-full p-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 transition-colors"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <FileAudio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-mono font-bold text-zinc-100 uppercase tracking-wider">
              Offline WAV Audio Render
            </h2>
            <p className="text-xs font-mono text-zinc-400">
              16-Bit PCM Stereo · 48 kHz Native
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs font-mono text-zinc-300">
          <p className="text-zinc-400 leading-relaxed bg-zinc-900/60 p-3 rounded border border-zinc-800">
            Synthesizes the active propulsion and aerodynamic acoustic graphs in the background using an <code className="text-amber-400">OfflineAudioContext</code>. The generated audio reproduces the exact DSP algorithms, PRNG seeds, combustion shock fronts, turbulent buffeting, and cavity whistling.
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-400 uppercase tracking-wider text-[11px]">
              Render Duration
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 20].map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`py-2 text-center rounded border font-semibold transition-all ${
                    duration === d
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {d} Seconds
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-zinc-900/80 rounded border border-zinc-800/80 flex flex-col gap-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-500">Output Sample Rate:</span>
              <span className="text-zinc-300">48,000 Hz</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Channels:</span>
              <span className="text-zinc-300">2 (Stereo Decorrelated)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Quantization:</span>
              <span className="text-zinc-300">16-bit Signed Little-Endian PCM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Estimated File Size:</span>
              <span className="text-zinc-300">~{((duration * 48000 * 4) / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              disabled={isRendering}
              className="px-4 py-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-mono"
            >
              Cancel
            </button>
            <button
              onClick={handleRenderAndDownload}
              disabled={isRendering}
              className="flex items-center gap-2 px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs font-mono transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {isRendering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Render Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Render & Save WAV</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
