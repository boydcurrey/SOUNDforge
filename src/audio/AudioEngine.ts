/**
 * SOUNDforge - Core Audio Engine
 * Manages AudioContext lifecycle, master summing bus, protective limiter,
 * visualizer analyzers, and offline WAV rendering.
 */

import { AudioEngineMetrics, PropulsionParams, AerodynamicParams } from './types';
import { PropulsionModule } from './PropulsionModule';
import { AerodynamicModule } from './AerodynamicModule';
import { audioBufferToWav } from './wavEncoder';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private limiterNode: DynamicsCompressorNode | null = null;
  private softClipperNode: WaveShaperNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private propulsionModule: PropulsionModule | null = null;
  private aerodynamicModule: AerodynamicModule | null = null;

  private isRunning = false;
  private masterVolume = 0.8;
  private startTime = 0;
  private pauseTime = 0;
  private elapsedSeconds = 0;

  // Analyser buffers
  private timeDomainBuffer: Uint8Array | null = null;
  private frequencyBuffer: Uint8Array | null = null;

  // Peak/RMS metering
  private currentPeakL = 0;
  private currentPeakR = 0;
  private currentRms = 0;
  private isClipping = false;

  constructor() {
    // AudioContext is initialized on first user interaction to comply with browser policy
  }

  public async init(): Promise<void> {
    if (this.ctx) return;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    try {
      this.ctx = new AudioContextClass({
        sampleRate: 48000,
        latencyHint: 'interactive',
      });
    } catch {
      // Fallback without options if custom sampleRate not supported
      this.ctx = new AudioContextClass();
    }

    const ctx = this.ctx;

    // Master Gain
    this.masterGainNode = ctx.createGain();
    this.masterGainNode.gain.setValueAtTime(this.masterVolume, ctx.currentTime);

    // Protective Limiter (prevents harsh distortion & hearing damage)
    this.limiterNode = ctx.createDynamicsCompressor();
    this.limiterNode.threshold.setValueAtTime(-1.5, ctx.currentTime);
    this.limiterNode.knee.setValueAtTime(4.0, ctx.currentTime);
    this.limiterNode.ratio.setValueAtTime(18.0, ctx.currentTime);
    this.limiterNode.attack.setValueAtTime(0.002, ctx.currentTime);
    this.limiterNode.release.setValueAtTime(0.05, ctx.currentTime);

    // Soft Clipper WaveShaper
    this.softClipperNode = ctx.createWaveShaper();
    this.softClipperNode.curve = this.createSoftClipCurve(2048) as unknown as Float32Array<ArrayBuffer>;
    this.softClipperNode.oversample = '2x';

    // Master Analyser
    this.analyserNode = ctx.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.82;
    this.analyserNode.minDecibels = -90;
    this.analyserNode.maxDecibels = -10;

    this.timeDomainBuffer = new Uint8Array(new ArrayBuffer(this.analyserNode.fftSize));
    this.frequencyBuffer = new Uint8Array(new ArrayBuffer(this.analyserNode.frequencyBinCount));

    // Connect Master bus:
    // Propulsion -> masterGainNode -> limiterNode -> softClipperNode -> analyserNode -> destination
    this.masterGainNode.connect(this.limiterNode);
    this.limiterNode.connect(this.softClipperNode);
    this.softClipperNode.connect(this.analyserNode);
    this.analyserNode.connect(ctx.destination);

    // Initialize Propulsion Module
    this.propulsionModule = new PropulsionModule(ctx);
    await this.propulsionModule.initialize();
    this.propulsionModule.output.connect(this.masterGainNode);

    // Initialize Aerodynamic Module (Milestone 2)
    this.aerodynamicModule = new AerodynamicModule(ctx);
    await this.aerodynamicModule.initialize();
    this.aerodynamicModule.output.connect(this.masterGainNode);
  }

  private createSoftClipCurve(samples: number): Float32Array {
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < samples; ++i) {
      const x = (i * 2) / samples - 1;
      // Soft saturation curve: x / (1 + |x|) or tanh
      curve[i] = Math.tanh(x);
    }
    return curve;
  }

  public async start(): Promise<void> {
    if (!this.ctx) {
      await this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    if (!this.isRunning) {
      this.isRunning = true;
      this.startTime = (this.ctx?.currentTime || 0) - this.elapsedSeconds;
    }
  }

  public stop(): void {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
    this.isRunning = false;
    this.pauseTime = this.ctx?.currentTime || 0;
  }

  public restart(): void {
    this.elapsedSeconds = 0;
    if (this.ctx) {
      this.startTime = this.ctx.currentTime;
    }
    if (!this.isRunning) {
      this.start();
    }
  }

  public setMasterGain(gain: number): void {
    this.masterVolume = Math.max(0.0, Math.min(1.5, gain));
    if (this.ctx && this.masterGainNode) {
      this.masterGainNode.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.02);
    }
  }

  public getMasterGain(): number {
    return this.masterVolume;
  }

  public getPropulsionModule(): PropulsionModule | null {
    return this.propulsionModule;
  }

  public getAerodynamicModule(): AerodynamicModule | null {
    return this.aerodynamicModule;
  }

  public getTimeDomainData(outputArray: Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteTimeDomainData(outputArray as unknown as Uint8Array<ArrayBuffer>);
    }
  }

  public getFrequencyData(outputArray: Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(outputArray as unknown as Uint8Array<ArrayBuffer>);
    }
  }

  public getMetrics(): AudioEngineMetrics {
    const isCtxRunning = this.ctx?.state === 'running';
    let timeElapsed = this.elapsedSeconds;
    if (this.ctx && this.isRunning) {
      timeElapsed = Math.max(0, this.ctx.currentTime - this.startTime);
    }

    // Compute peak & RMS from timeDomain buffer if available
    if (this.analyserNode && this.timeDomainBuffer && isCtxRunning) {
      this.analyserNode.getByteTimeDomainData(this.timeDomainBuffer as unknown as Uint8Array<ArrayBuffer>);
      let sumSquares = 0;
      let peak = 0;
      const len = this.timeDomainBuffer.length;
      for (let i = 0; i < len; i++) {
        const norm = (this.timeDomainBuffer[i] - 128) / 128;
        const abs = Math.abs(norm);
        if (abs > peak) peak = abs;
        sumSquares += norm * norm;
      }
      this.currentPeakL = peak;
      this.currentPeakR = peak; // downmixed meter estimate
      this.currentRms = Math.sqrt(sumSquares / len);
      this.isClipping = peak >= 0.98;
    } else {
      this.currentPeakL *= 0.85;
      this.currentPeakR *= 0.85;
      this.currentRms *= 0.85;
      this.isClipping = false;
    }

    return {
      isRunning: this.isRunning && isCtxRunning,
      sampleRate: this.ctx?.sampleRate || 48000,
      outputLatency: this.ctx?.baseLatency || 0.005,
      peakL: this.currentPeakL,
      peakR: this.currentPeakR,
      rms: this.currentRms,
      isClipping: this.isClipping,
      timeElapsed,
    };
  }

  /**
   * Offline Rendering: Renders a high-fidelity stereo WAV file of the active synthesis modules
   */
  public async renderOfflineWav(
    durationSeconds: number,
    propulsionParams: PropulsionParams,
    aeroParams: AerodynamicParams
  ): Promise<Blob> {
    const sampleRate = 48000;
    const length = Math.floor(sampleRate * durationSeconds);
    const offlineCtx = new OfflineAudioContext(2, length, sampleRate);

    // Summing Gain
    const offlineGain = offlineCtx.createGain();
    offlineGain.gain.setValueAtTime(this.masterVolume, 0);

    // Master Limiter
    const offlineLimiter = offlineCtx.createDynamicsCompressor();
    offlineLimiter.threshold.setValueAtTime(-1.5, 0);
    offlineLimiter.knee.setValueAtTime(4.0, 0);
    offlineLimiter.ratio.setValueAtTime(18.0, 0);
    offlineLimiter.attack.setValueAtTime(0.002, 0);
    offlineLimiter.release.setValueAtTime(0.05, 0);

    offlineGain.connect(offlineLimiter);
    offlineLimiter.connect(offlineCtx.destination);

    // Instantiate and connect Propulsion Module
    if (propulsionParams.enabled && !propulsionParams.muted) {
      const offlineProp = new PropulsionModule(offlineCtx, propulsionParams);
      await offlineProp.initialize();
      offlineProp.output.connect(offlineGain);
    }

    // Instantiate and connect Aerodynamic Module
    if (aeroParams.enabled && !aeroParams.muted) {
      const offlineAero = new AerodynamicModule(offlineCtx, aeroParams);
      await offlineAero.initialize();
      offlineAero.output.connect(offlineGain);
    }

    const renderedBuffer = await offlineCtx.startRendering();
    return audioBufferToWav(renderedBuffer);
  }
}

// Global engine singleton
export const audioEngine = new AudioEngine();
