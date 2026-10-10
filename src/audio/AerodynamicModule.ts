/**
 * SOUNDforge - Aerodynamic Synthesis Module (Milestone 2)
 * Encapsulates turbulent airflow, buffeting, whistling edge tones,
 * velocity-dependent filtering, and density attenuation.
 */

import { AerodynamicParams } from './types';
import { DEFAULT_AERODYNAMIC_PARAMS } from './aerodynamicPresets';
import { AERODYNAMIC_WORKLET_PROCESSOR_CODE } from './worklet/aerodynamicWorkletCode';

export class AerodynamicModule {
  private ctx: AudioContext | OfflineAudioContext;
  private params: AerodynamicParams;
  private workletNode: AudioWorkletNode | null = null;
  private outputNode: GainNode;
  private isWorkletReady = false;
  private isFallbackMode = false;

  // Fallback nodes
  private fallbackNoiseSource: AudioNode | null = null;
  private fallbackFilter: BiquadFilterNode | null = null;
  private fallbackGain: GainNode | null = null;

  constructor(ctx: AudioContext | OfflineAudioContext, initialParams?: Partial<AerodynamicParams>) {
    this.ctx = ctx;
    this.params = { ...DEFAULT_AERODYNAMIC_PARAMS, ...initialParams };
    this.outputNode = ctx.createGain();
    this.outputNode.gain.setValueAtTime(this.params.enabled && !this.params.muted ? 1.0 : 0.0, ctx.currentTime);
  }

  public get output(): AudioNode {
    return this.outputNode;
  }

  public get currentParams(): AerodynamicParams {
    return { ...this.params };
  }

  public async initialize(): Promise<void> {
    try {
      if (this.ctx.audioWorklet && typeof this.ctx.audioWorklet.addModule === 'function') {
        const blob = new Blob([AERODYNAMIC_WORKLET_PROCESSOR_CODE], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        await this.ctx.audioWorklet.addModule(blobUrl);
        URL.revokeObjectURL(blobUrl);

        this.workletNode = new AudioWorkletNode(this.ctx, 'aerodynamic-processor', {
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
      console.warn('Aerodynamic AudioWorklet failed, using fallback:', err);
      this.setupFallbackSynthesis();
    }
  }

  private setupFallbackSynthesis(): void {
    this.isFallbackMode = true;
    const ctx = this.ctx;

    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const channelData = noiseBuffer.getChannelData(c);
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        last = (last * 0.9) + (white * 0.1);
        channelData[i] = last * 2.5;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    this.fallbackFilter = ctx.createBiquadFilter();
    this.fallbackFilter.type = 'bandpass';
    this.fallbackFilter.frequency.setValueAtTime(this.params.whistlingFreq, ctx.currentTime);
    this.fallbackFilter.Q.setValueAtTime(this.params.resonance, ctx.currentTime);

    this.fallbackGain = ctx.createGain();
    this.fallbackGain.gain.setValueAtTime(this.params.airflowIntensity, ctx.currentTime);

    source.connect(this.fallbackFilter);
    this.fallbackFilter.connect(this.fallbackGain);
    this.fallbackGain.connect(this.outputNode);

    source.start();
    this.fallbackNoiseSource = source;
  }

  public setParams(newParams: Partial<AerodynamicParams>): void {
    this.params = { ...this.params, ...newParams };

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
    if (this.fallbackFilter) {
      this.fallbackFilter.frequency.setTargetAtTime(this.params.whistlingFreq, t, 0.03);
      this.fallbackFilter.Q.setTargetAtTime(this.params.resonance, t, 0.03);
    }
    if (this.fallbackGain) {
      this.fallbackGain.gain.setTargetAtTime(this.params.airflowIntensity, t, 0.03);
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
    this.setParams({ ...DEFAULT_AERODYNAMIC_PARAMS });
  }

  public randomizeParams(seed?: number): void {
    const currentSeed = seed !== undefined ? seed : Math.floor(Math.random() * 1000000);
    let s = currentSeed;
    const rng = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };

    const randomized: Partial<AerodynamicParams> = {
      seed: currentSeed,
      airflowIntensity: 0.5 + rng() * 0.5,
      velocity: 50.0 + rng() * 1200.0,
      density: 0.05 + rng() * 1.35,
      turbulence: 0.2 + rng() * 0.75,
      resonance: 1.0 + rng() * 9.0,
      bandwidth: 150.0 + rng() * 1200.0,
      buffetingRate: 2.0 + rng() * 20.0,
      buffetingDepth: 0.2 + rng() * 0.7,
      whistlingMix: 0.15 + rng() * 0.7,
      whistlingFreq: 250.0 + rng() * 2800.0,
      shearNoiseMix: 0.2 + rng() * 0.75,
      pinkWhiteRatio: 0.1 + rng() * 0.8,
      saturationDrive: 1.2 + rng() * 4.0,
    };

    this.setParams(randomized);
  }

  public dispose(): void {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    if (this.fallbackNoiseSource) {
      this.fallbackNoiseSource.disconnect();
    }
    if (this.fallbackFilter) {
      this.fallbackFilter.disconnect();
    }
    if (this.fallbackGain) {
      this.fallbackGain.disconnect();
    }
    this.outputNode.disconnect();
  }
}
