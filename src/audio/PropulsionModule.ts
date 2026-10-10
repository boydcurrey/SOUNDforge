/**
 * SOUNDforge - Propulsion Synthesis Module (Milestone 1)
 * Encapsulates the procedural combustion, subharmonics, broadband noise,
 * modal resonance, and saturation audio graph.
 */

import { PropulsionParams } from './types';
import { DEFAULT_PROPULSION_PARAMS } from './presets';
import { PROPULSION_WORKLET_PROCESSOR_CODE } from './worklet/propulsionWorkletCode';

export class PropulsionModule {
  private ctx: AudioContext | OfflineAudioContext;
  private params: PropulsionParams;
  private workletNode: AudioWorkletNode | null = null;
  private outputNode: GainNode;
  private isWorkletReady = false;
  private isFallbackMode = false;

  // Fallback nodes if AudioWorklet is not permitted by browser sandbox
  private fallbackOsc1: OscillatorNode | null = null;
  private fallbackOsc2: OscillatorNode | null = null;
  private fallbackNoiseNode: AudioNode | null = null;
  private fallbackFilter: BiquadFilterNode | null = null;

  constructor(ctx: AudioContext | OfflineAudioContext, initialParams?: Partial<PropulsionParams>) {
    this.ctx = ctx;
    this.params = { ...DEFAULT_PROPULSION_PARAMS, ...initialParams };
    this.outputNode = ctx.createGain();
    this.outputNode.gain.setValueAtTime(this.params.enabled && !this.params.muted ? 1.0 : 0.0, ctx.currentTime);
  }

  public get output(): AudioNode {
    return this.outputNode;
  }

  public get currentParams(): PropulsionParams {
    return { ...this.params };
  }

  public async initialize(): Promise<void> {
    try {
      // Check if AudioWorklet is supported
      if (this.ctx.audioWorklet && typeof this.ctx.audioWorklet.addModule === 'function') {
        const blob = new Blob([PROPULSION_WORKLET_PROCESSOR_CODE], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        await this.ctx.audioWorklet.addModule(blobUrl);
        URL.revokeObjectURL(blobUrl);

        this.workletNode = new AudioWorkletNode(this.ctx, 'propulsion-processor', {
          numberOfInputs: 0,
          numberOfOutputs: 1,
          outputChannelCount: [2],
        });

        this.workletNode.connect(this.outputNode);
        this.isWorkletReady = true;
        this.sendParamsToWorklet();
      } else {
        this.setupFallbackSynthesis();
      }
    } catch (err) {
      console.warn('AudioWorklet initialization failed, switching to native Web Audio graph fallback:', err);
      this.setupFallbackSynthesis();
    }
  }

  /**
   * High-quality fallback synthesis if AudioWorklet is blocked by iframe CSP
   */
  private setupFallbackSynthesis(): void {
    this.isFallbackMode = true;
    const ctx = this.ctx;

    // Subharmonic oscillator
    this.fallbackOsc1 = ctx.createOscillator();
    this.fallbackOsc1.type = 'sawtooth';
    this.fallbackOsc1.frequency.setValueAtTime(this.params.combustionRate, ctx.currentTime);

    // Deep sub-bass
    this.fallbackOsc2 = ctx.createOscillator();
    this.fallbackOsc2.type = 'sine';
    this.fallbackOsc2.frequency.setValueAtTime(this.params.subharmonicFreq, ctx.currentTime);

    // Noise buffer generator
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const channelData = noiseBuffer.getChannelData(c);
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        last = (last * 0.95) + (white * 0.05); // brown-ish noise
        channelData[i] = last * 4.0;
      }
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Resonant filter
    this.fallbackFilter = ctx.createBiquadFilter();
    this.fallbackFilter.type = 'lowpass';
    this.fallbackFilter.frequency.setValueAtTime(this.params.spectralBrightness, ctx.currentTime);
    this.fallbackFilter.Q.setValueAtTime(this.params.chamberResonance, ctx.currentTime);

    const mixGain = ctx.createGain();
    mixGain.gain.setValueAtTime(0.5, ctx.currentTime);

    this.fallbackOsc1.connect(this.fallbackFilter);
    this.fallbackOsc2.connect(this.fallbackFilter);
    noiseSource.connect(this.fallbackFilter);

    this.fallbackFilter.connect(mixGain);
    mixGain.connect(this.outputNode);

    this.fallbackOsc1.start();
    this.fallbackOsc2.start();
    noiseSource.start();
    this.fallbackNoiseNode = noiseSource;
  }

  public setParams(newParams: Partial<PropulsionParams>): void {
    this.params = { ...this.params, ...newParams };

    // Update gain & mute/solo
    const targetGain = this.params.enabled && !this.params.muted ? 1.0 : 0.0;
    if (this.ctx.state === 'running' || this.ctx instanceof OfflineAudioContext) {
      this.outputNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.02);
    } else {
      this.outputNode.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }

    if (this.isWorkletReady && this.workletNode) {
      this.sendParamsToWorklet();
    } else if (this.isFallbackMode) {
      this.updateFallbackNodes();
    }
  }

  private sendParamsToWorklet(): void {
    if (!this.workletNode) return;
    this.workletNode.port.postMessage({
      type: 'SET_PARAMS',
      params: this.params,
    });
  }

  private updateFallbackNodes(): void {
    const t = this.ctx.currentTime;
    if (this.fallbackOsc1) {
      this.fallbackOsc1.frequency.setTargetAtTime(this.params.combustionRate, t, 0.03);
    }
    if (this.fallbackOsc2) {
      this.fallbackOsc2.frequency.setTargetAtTime(this.params.subharmonicFreq, t, 0.03);
    }
    if (this.fallbackFilter) {
      this.fallbackFilter.frequency.setTargetAtTime(this.params.spectralBrightness, t, 0.03);
      this.fallbackFilter.Q.setTargetAtTime(this.params.chamberResonance, t, 0.03);
    }
  }

  public setMuted(muted: boolean): void {
    this.setParams({ muted });
  }

  public setSolo(solo: boolean): void {
    this.setParams({ solo });
  }

  public setEnabled(enabled: boolean): void {
    this.setParams({ enabled });
  }

  public resetParams(): void {
    this.setParams({ ...DEFAULT_PROPULSION_PARAMS });
  }

  public randomizeParams(seed?: number): void {
    const currentSeed = seed !== undefined ? seed : Math.floor(Math.random() * 1000000);
    // Deterministic pseudo-random based on seed
    let s = currentSeed;
    const rng = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };

    const randomized: Partial<PropulsionParams> = {
      seed: currentSeed,
      intensity: 0.5 + rng() * 0.5,
      combustionRate: 12.0 + rng() * 70.0,
      combustionAsymmetry: 0.2 + rng() * 0.75,
      combustionJitter: 0.15 + rng() * 0.6,
      lowFreqEnergy: 0.4 + rng() * 0.6,
      subharmonicMix: 0.3 + rng() * 0.6,
      subharmonicFreq: 14.0 + rng() * 32.0,
      spectralBrightness: 800.0 + rng() * 6000.0,
      chamberFreq: 90.0 + rng() * 250.0,
      chamberResonance: 1.5 + rng() * 6.5,
      harmonicRichness: 0.2 + rng() * 0.7,
      noiseBroadbandMix: 0.4 + rng() * 0.55,
      noiseColor: 0.15 + rng() * 0.7,
      saturationDrive: 1.5 + rng() * 6.0,
      warmthBias: (rng() - 0.5) * 0.2,
      slowModRate: 0.05 + rng() * 0.5,
      slowModDepth: 0.15 + rng() * 0.65,
      fastModRate: 8.0 + rng() * 30.0,
      fastModDepth: 0.15 + rng() * 0.6,
      instability: 0.1 + rng() * 0.65,
      flameCrackleDensity: 0.2 + rng() * 0.7,
    };

    this.setParams(randomized);
  }

  public dispose(): void {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    if (this.fallbackOsc1) {
      this.fallbackOsc1.stop();
      this.fallbackOsc1.disconnect();
    }
    if (this.fallbackOsc2) {
      this.fallbackOsc2.stop();
      this.fallbackOsc2.disconnect();
    }
    if (this.fallbackNoiseNode) {
      this.fallbackNoiseNode.disconnect();
    }
    this.outputNode.disconnect();
  }
}
