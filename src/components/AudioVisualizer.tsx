import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../audio/AudioEngine';
import { Activity, BarChart3, Layers } from 'lucide-react';

type VisualizerMode = 'both' | 'scope' | 'spectrum';

export const AudioVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<VisualizerMode>('both');
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const timeBuffer = new Uint8Array(2048);
    const freqBuffer = new Uint8Array(1024);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Dark background
      ctx.fillStyle = '#090a0f';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid
      ctx.strokeStyle = '#181b24';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += width / 8) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += height / 4) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      audioEngine.getTimeDomainData(timeBuffer);
      audioEngine.getFrequencyData(freqBuffer);

      // Render Spectrum
      if (mode === 'spectrum' || mode === 'both') {
        const binCount = freqBuffer.length;
        const barWidth = width / binCount;

        ctx.beginPath();
        ctx.moveTo(0, height);

        // Draw smooth filled frequency curve with gradient
        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, 'rgba(245, 158, 11, 0.05)');
        grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.25)');
        grad.addColorStop(1, 'rgba(251, 191, 36, 0.8)');

        ctx.fillStyle = grad;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;

        // Logarithmic scale mapping across the canvas
        for (let i = 0; i < width; i++) {
          // map pixel x to log frequency index
          const logFraction = Math.pow(i / width, 2.2);
          const binIndex = Math.min(binCount - 1, Math.floor(logFraction * binCount));
          const val = freqBuffer[binIndex] / 255.0; // 0 to 1
          const y = height - (val * (mode === 'both' ? height * 0.75 : height * 0.9));

          if (i === 0) {
            ctx.moveTo(i, y);
          } else {
            ctx.lineTo(i, y);
          }
        }

        ctx.stroke();
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();

        // Frequency landmark labels
        ctx.fillStyle = '#71717a';
        ctx.font = '9px monospace';
        const landmarks = [
          { freq: '30 Hz (Sub)', frac: 0.12 },
          { freq: '60 Hz (Chug)', frac: 0.22 },
          { freq: '150 Hz (Chamber)', frac: 0.38 },
          { freq: '1 kHz (Roar)', frac: 0.62 },
          { freq: '10 kHz (Crackle)', frac: 0.90 },
        ];
        landmarks.forEach((lm) => {
          const x = lm.frac * width;
          ctx.fillText(lm.freq, x, height - 6);
          ctx.strokeStyle = '#27272a';
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height - 18);
          ctx.stroke();
        });
      }

      // Render Oscilloscope
      if (mode === 'scope' || mode === 'both') {
        ctx.lineWidth = mode === 'both' ? 1.5 : 2;
        ctx.strokeStyle = mode === 'both' ? '#38bdf8' : '#38bdf8';
        ctx.beginPath();

        const sliceWidth = width / timeBuffer.length;
        let x = 0;

        for (let i = 0; i < timeBuffer.length; i++) {
          const v = timeBuffer[i] / 128.0; // 0 to 2
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.stroke();

        // Center zero line
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [mode]);

  return (
    <div className="flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-zinc-800/80 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-medium tracking-wider text-zinc-200 uppercase">
            Acoustic Signal Telemetry
          </span>
          <span className="text-[10px] font-mono text-zinc-500">
            · Dual FFT / Oscilloscope
          </span>
        </div>

        <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
          <button
            onClick={() => setMode('both')}
            className={`px-2 py-0.5 text-[10px] font-mono rounded flex items-center gap-1 transition-colors ${
              mode === 'both'
                ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Combined Spectrum & Waveform"
          >
            <Layers className="w-3 h-3" />
            Dual
          </button>
          <button
            onClick={() => setMode('spectrum')}
            className={`px-2 py-0.5 text-[10px] font-mono rounded flex items-center gap-1 transition-colors ${
              mode === 'spectrum'
                ? 'bg-zinc-800 text-amber-400 font-semibold shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="FFT Frequency Spectrum"
          >
            <BarChart3 className="w-3 h-3" />
            FFT
          </button>
          <button
            onClick={() => setMode('scope')}
            className={`px-2 py-0.5 text-[10px] font-mono rounded flex items-center gap-1 transition-colors ${
              mode === 'scope'
                ? 'bg-zinc-800 text-cyan-400 font-semibold shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Time Domain Waveform Oscilloscope"
          >
            <Activity className="w-3 h-3" />
            Scope
          </button>
        </div>
      </div>

      <div className="relative w-full h-24 sm:h-28 bg-zinc-950">
        <canvas
          ref={canvasRef}
          width={800}
          height={180}
          className="w-full h-full block"
        />
      </div>
    </div>
  );
};
