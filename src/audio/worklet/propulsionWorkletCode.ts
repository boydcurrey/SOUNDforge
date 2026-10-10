/**
 * AudioWorkletProcessor script string for Procedural Propulsion Synthesis
 * Compiled into an inline Blob URL to guarantee synchronous loading without network/bundler hurdles.
 */

export const PROPULSION_WORKLET_PROCESSOR_CODE = `
class PropulsionProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // PRNG state
    this.seed = 42079;
    this.rngState = this.seed;

    // Combustion oscillator state
    this.combustionPhase = 0.0;
    this.combustionFreqSmoothed = 32.0;

    // Subharmonic oscillators
    this.subPhase1 = 0.0;
    this.subPhase2 = 0.0;
    this.subPhase3 = 0.0;

    // LFO states
    this.slowLfoPhase = 0.0;
    this.fastLfoPhase = 0.0;
    this.chaosDrift = 0.0;
    this.chaosTarget = 0.0;

    // Pink noise generator states (Kellet filter) - Left & Right decorrelated
    this.b0L = 0; this.b1L = 0; this.b2L = 0; this.b3L = 0; this.b4L = 0; this.b5L = 0; this.b6L = 0;
    this.b0R = 0; this.b1R = 0; this.b2R = 0; this.b3R = 0; this.b4R = 0; this.b5R = 0; this.b6R = 0;

    // Brown noise integrators
    this.brownL = 0;
    this.brownR = 0;

    // DC blockers
    this.dcBlockX_L = 0; this.dcBlockY_L = 0;
    this.dcBlockX_R = 0; this.dcBlockY_R = 0;

    // Resonant Biquad Filter states (2 poles for chamber acoustics)
    // Mode 1 L & R
    this.m1_x1L = 0; this.m1_x2L = 0; this.m1_y1L = 0; this.m1_y2L = 0;
    this.m1_x1R = 0; this.m1_x2R = 0; this.m1_y1R = 0; this.m1_y2R = 0;
    // Mode 2 L & R
    this.m2_x1L = 0; this.m2_x2L = 0; this.m2_y1L = 0; this.m2_y2L = 0;
    this.m2_x1R = 0; this.m2_x2R = 0; this.m2_y1R = 0; this.m2_y2R = 0;
    // Brightness Lowpass filter L & R
    this.lp_x1L = 0; this.lp_x2L = 0; this.lp_y1L = 0; this.lp_y2L = 0;
    this.lp_x1R = 0; this.lp_x2R = 0; this.lp_y1R = 0; this.lp_y2R = 0;

    // Filter coefficients cache
    this.lastChamberFreq = -1;
    this.lastChamberQ = -1;
    this.lastLpFreq = -1;
    this.m1_b0 = 0; this.m1_b1 = 0; this.m1_b2 = 0; this.m1_a1 = 0; this.m1_a2 = 0;
    this.m2_b0 = 0; this.m2_b1 = 0; this.m2_b2 = 0; this.m2_a1 = 0; this.m2_a2 = 0;
    this.lp_b0 = 0; this.lp_b1 = 0; this.lp_b2 = 0; this.lp_a1 = 0; this.lp_a2 = 0;

    // Parameter target values with smoothing
    this.params = {
      enabled: 1.0,
      muted: 0.0,
      gain: 0.85,
      pan: 0.0,
      intensity: 0.8,
      combustionRate: 32.0,
      combustionAsymmetry: 0.65,
      combustionJitter: 0.35,
      lowFreqEnergy: 0.75,
      subharmonicMix: 0.6,
      subharmonicFreq: 24.0,
      spectralBrightness: 2800.0,
      chamberFreq: 145.0,
      chamberResonance: 3.8,
      harmonicRichness: 0.55,
      noiseBroadbandMix: 0.65,
      noiseColor: 0.38,
      saturationDrive: 3.2,
      warmthBias: 0.05,
      slowModRate: 0.18,
      slowModDepth: 0.42,
      fastModRate: 16.0,
      fastModDepth: 0.35,
      instability: 0.28,
      flameCrackleDensity: 0.45,
      seed: 42079
    };

    // Smoothed internal parameters for glitch-free continuous audio
    this.smoothed = Object.assign({}, this.params);

    // Listen for parameter messages from main thread
    this.port.onmessage = (event) => {
      if (event.data && event.data.type === 'SET_PARAMS') {
        const newParams = event.data.params;
        for (const k in newParams) {
          if (k in this.params) {
            this.params[k] = newParams[k];
          }
        }
        if (newParams.seed !== undefined && newParams.seed !== this.seed) {
          this.seed = (newParams.seed | 0) || 12345;
          this.rngState = this.seed;
        }
      }
    };
  }

  // Reproducible Xorshift32 PRNG
  random() {
    let x = this.rngState;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.rngState = x;
    return ((x >>> 0) / 4294967296);
  }

  // Update Bandpass Biquad coefficients (normalized)
  calcBandpassCoeffs(freq, q, sampleRate) {
    const w0 = 2 * Math.PI * Math.min(Math.max(freq, 20), sampleRate * 0.45) / sampleRate;
    const alpha = Math.sin(w0) / (2 * Math.max(q, 0.1));
    const cosw0 = Math.cos(w0);
    const a0 = 1 + alpha;
    return {
      b0: alpha / a0,
      b1: 0,
      b2: -alpha / a0,
      a1: (-2 * cosw0) / a0,
      a2: (1 - alpha) / a0
    };
  }

  // Update Lowpass Biquad coefficients
  calcLowpassCoeffs(freq, sampleRate) {
    const w0 = 2 * Math.PI * Math.min(Math.max(freq, 40), sampleRate * 0.45) / sampleRate;
    const cosw0 = Math.cos(w0);
    const alpha = Math.sin(w0) / (2 * 0.7071);
    const a0 = 1 + alpha;
    return {
      b0: ((1 - cosw0) / 2) / a0,
      b1: (1 - cosw0) / a0,
      b2: ((1 - cosw0) / 2) / a0,
      a1: (-2 * cosw0) / a0,
      a2: (1 - alpha) / a0
    };
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output || output.length === 0) return true;

    const outL = output[0];
    const outR = output.length > 1 ? output[1] : output[0];
    const bufferSize = outL.length;
    const sampleRate = globalThis.sampleRate || 48000;
    const invSampleRate = 1.0 / sampleRate;

    // Smooth parameters towards targets across block
    const smoothFactor = 0.005;
    for (const key in this.params) {
      if (typeof this.params[key] === 'number' && key !== 'seed') {
        this.smoothed[key] += (this.params[key] - this.smoothed[key]) * 0.1;
      }
    }

    const enabled = this.params.enabled > 0.5 && this.params.muted < 0.5;
    if (!enabled) {
      outL.fill(0);
      if (outR !== outL) outR.fill(0);
      return true;
    }

    const intensity = Math.max(0.001, this.smoothed.intensity);
    const combustionRate = Math.max(2.0, this.smoothed.combustionRate);
    const combustionAsymmetry = this.smoothed.combustionAsymmetry;
    const combustionJitter = this.smoothed.combustionJitter;
    const lowFreqEnergy = this.smoothed.lowFreqEnergy;
    const subharmonicMix = this.smoothed.subharmonicMix;
    const subharmonicFreq = Math.max(8.0, this.smoothed.subharmonicFreq);
    const spectralBrightness = this.smoothed.spectralBrightness;
    const chamberFreq = this.smoothed.chamberFreq;
    const chamberResonance = this.smoothed.chamberResonance;
    const harmonicRichness = this.smoothed.harmonicRichness;
    const noiseBroadbandMix = this.smoothed.noiseBroadbandMix;
    const noiseColor = this.smoothed.noiseColor;
    const saturationDrive = Math.max(1.0, this.smoothed.saturationDrive);
    const warmthBias = this.smoothed.warmthBias;
    const slowModRate = Math.max(0.01, this.smoothed.slowModRate);
    const slowModDepth = this.smoothed.slowModDepth;
    const fastModRate = Math.max(1.0, this.smoothed.fastModRate);
    const fastModDepth = this.smoothed.fastModDepth;
    const instability = this.smoothed.instability;
    const flameCrackleDensity = this.smoothed.flameCrackleDensity;
    const masterGain = this.smoothed.gain;
    const pan = Math.min(1.0, Math.max(-1.0, this.smoothed.pan));

    const enableCombustion = this.params.enableCombustion !== false;
    const enableSubharmonics = this.params.enableSubharmonics !== false;
    const enableChamber = this.params.enableChamber !== false;
    const enableNoise = this.params.enableNoise !== false;
    const enableModulation = this.params.enableModulation !== false;
    const enableInstability = this.params.enableInstability !== false;

    // Update filter coefficients once per quantum
    if (Math.abs(this.lastChamberFreq - chamberFreq) > 0.5 || Math.abs(this.lastChamberQ - chamberResonance) > 0.05) {
      const c1 = this.calcBandpassCoeffs(chamberFreq, chamberResonance, sampleRate);
      this.m1_b0 = c1.b0; this.m1_b1 = c1.b1; this.m1_b2 = c1.b2;
      this.m1_a1 = c1.a1; this.m1_a2 = c1.a2;

      // Mode 2: Chamber throat standing wave mode (~2.15x)
      const c2 = this.calcBandpassCoeffs(chamberFreq * 2.15, chamberResonance * 0.8, sampleRate);
      this.m2_b0 = c2.b0; this.m2_b1 = c2.b1; this.m2_b2 = c2.b2;
      this.m2_a1 = c2.a1; this.m2_a2 = c2.a2;

      this.lastChamberFreq = chamberFreq;
      this.lastChamberQ = chamberResonance;
    }

    if (Math.abs(this.lastLpFreq - spectralBrightness) > 2.0) {
      const lp = this.calcLowpassCoeffs(spectralBrightness, sampleRate);
      this.lp_b0 = lp.b0; this.lp_b1 = lp.b1; this.lp_b2 = lp.b2;
      this.lp_a1 = lp.a1; this.lp_a2 = lp.a2;
      this.lastLpFreq = spectralBrightness;
    }

    // Pan law (equal power)
    const panAngle = (pan + 1.0) * 0.25 * Math.PI; // 0 to pi/2
    const panGainL = Math.cos(panAngle);
    const panGainR = Math.sin(panAngle);

    for (let i = 0; i < bufferSize; i++) {
      // 1. Slow and Fast Modulators (LFOs)
      this.slowLfoPhase += slowModRate * invSampleRate;
      if (this.slowLfoPhase >= 1.0) this.slowLfoPhase -= 1.0;
      const slowLfo = Math.sin(this.slowLfoPhase * 2 * Math.PI);

      this.fastLfoPhase += fastModRate * invSampleRate;
      if (this.fastLfoPhase >= 1.0) this.fastLfoPhase -= 1.0;
      const fastLfo = Math.sin(this.fastLfoPhase * 2 * Math.PI);

      // Low-frequency chaos drift (smooth random walk)
      if (i % 32 === 0) {
        this.chaosTarget = (this.random() * 2.0 - 1.0) * instability;
      }
      this.chaosDrift += (this.chaosTarget - this.chaosDrift) * 0.05;

      // Effective modulation multiplier
      const modPlume = enableModulation ? (1.0 + (slowLfo * slowModDepth * 0.35) + (this.chaosDrift * 0.2)) : 1.0;
      const modVortex = enableModulation ? (1.0 + (fastLfo * fastModDepth * 0.4)) : 1.0;

      // 2. Combustion Pulse Oscillator with Shockwave Steepening & Jitter
      // Turbulent period perturbation
      const jitterFactor = 1.0 + (this.random() * 2.0 - 1.0) * combustionJitter * 0.38 + (this.chaosDrift * 0.25);
      const curCombRate = combustionRate * modVortex * jitterFactor;
      this.combustionPhase += Math.max(1.0, curCombRate) * invSampleRate;
      if (this.combustionPhase >= 1.0) {
        this.combustionPhase -= 1.0;
      }

      // Non-linear pulse wave with asymmetric steepening (Shock-front / K-factor crackle)
      const pTheta = this.combustionPhase * 2 * Math.PI;
      const rawSine = Math.sin(pTheta);
      // Asymmetric skew: steepens positive peak, elongates negative trough
      const skew = combustionAsymmetry * 1.8;
      const steepened = rawSine + (skew * 0.5 * rawSine * rawSine);
      const kFactor = 1.0 + combustionAsymmetry * 4.0;
      // Hyperbolic tangent compression of pulse gives physical acoustic shock-wave profile
      const combustionPulse = enableCombustion ? Math.tanh(kFactor * steepened) : 0.0;

      // 3. Stochastic Micro-burst Crackle (Discrete flame kernels popping)
      let crackleImpulse = 0.0;
      if (enableInstability && this.random() < (flameCrackleDensity * 0.06 * intensity)) {
        // Asymmetric positive shock pressure spike
        crackleImpulse = (this.random() * 0.8 + 0.2) * (1.0 + instability * 1.5);
      }

      // 4. Subharmonic Acoustic Engine
      // Fundamental subharmonic + f/2 + f/3 fractional division
      this.subPhase1 += subharmonicFreq * invSampleRate;
      if (this.subPhase1 >= 1.0) this.subPhase1 -= 1.0;

      this.subPhase2 += (subharmonicFreq * 0.5) * invSampleRate;
      if (this.subPhase2 >= 1.0) this.subPhase2 -= 1.0;

      this.subPhase3 += (subharmonicFreq * 0.333) * invSampleRate;
      if (this.subPhase3 >= 1.0) this.subPhase3 -= 1.0;

      const sub1 = Math.sin(this.subPhase1 * 2 * Math.PI);
      const sub2 = Math.sin(this.subPhase2 * 2 * Math.PI);
      const sub3 = Math.sin(this.subPhase3 * 2 * Math.PI);
      const subHarmonicRaw = (sub1 * 0.6) + (sub2 * subharmonicMix * 0.5) + (sub3 * subharmonicMix * 0.3);
      // Soft saturation on subharmonic produces harmonic overtones without harshness
      const subSignal = enableSubharmonics ? (Math.tanh(subHarmonicRaw * 1.8) * lowFreqEnergy) : 0.0;

      // 5. Filtered Broadband Turbulent Noise (Kellet Pink + Brownian walk)
      const whiteL = this.random() * 2.0 - 1.0;
      const whiteR = this.random() * 2.0 - 1.0;

      // Pink noise filter L
      this.b0L = 0.99886 * this.b0L + whiteL * 0.0555179;
      this.b1L = 0.99332 * this.b1L + whiteL * 0.0750759;
      this.b2L = 0.96900 * this.b2L + whiteL * 0.1538520;
      this.b3L = 0.86650 * this.b3L + whiteL * 0.3104856;
      this.b4L = 0.55000 * this.b4L + whiteL * 0.5329522;
      this.b5L = -0.7616 * this.b5L - whiteL * 0.0168980;
      const pinkL = (this.b0L + this.b1L + this.b2L + this.b3L + this.b4L + this.b5L + whiteL * 0.5362) * 0.12;

      // Pink noise filter R
      this.b0R = 0.99886 * this.b0R + whiteR * 0.0555179;
      this.b1R = 0.99332 * this.b1R + whiteR * 0.0750759;
      this.b2R = 0.96900 * this.b2R + whiteR * 0.1538520;
      this.b3R = 0.86650 * this.b3R + whiteR * 0.3104856;
      this.b4R = 0.55000 * this.b4R + whiteR * 0.5329522;
      this.b5R = -0.7616 * this.b5R - whiteR * 0.0168980;
      const pinkR = (this.b0R + this.b1R + this.b2R + this.b3R + this.b4R + this.b5R + whiteR * 0.5362) * 0.12;

      // Brown noise (integrated walk with leak to prevent DC drift)
      this.brownL = (this.brownL * 0.994) + (whiteL * 0.06);
      this.brownR = (this.brownR * 0.994) + (whiteR * 0.06);

      // Blend brown, pink, white based on noiseColor (0 = brown, 0.5 = pink, 1.0 = white)
      let noiseSignalL, noiseSignalR;
      if (noiseColor < 0.5) {
        const t = noiseColor * 2.0;
        noiseSignalL = this.brownL * (1.0 - t) + pinkL * t;
        noiseSignalR = this.brownR * (1.0 - t) + pinkR * t;
      } else {
        const t = (noiseColor - 0.5) * 2.0;
        noiseSignalL = pinkL * (1.0 - t) + (whiteL * 0.2) * t;
        noiseSignalR = pinkR * (1.0 - t) + (whiteR * 0.2) * t;
      }

      // Noise is pumped by the combustion pulse (shock wave compression of turbulent boundary layer)
      const noisePump = 0.7 + (combustionPulse * 0.3);
      const activeNoiseL = enableNoise ? (noiseSignalL * noisePump * noiseBroadbandMix * modPlume) : 0.0;
      const activeNoiseR = enableNoise ? (noiseSignalR * noisePump * noiseBroadbandMix * modPlume) : 0.0;

      // 6. Chamber Resonant Modal Excitation
      // The combustion pulses and crackle feed the chamber resonators
      const chamberExcitation = (combustionPulse * 0.8) + crackleImpulse;

      // Resonant Biquad Filter Mode 1 (L & R with subtle phase difference)
      const m1_inL = chamberExcitation;
      const m1_outL = this.m1_b0 * m1_inL + this.m1_b1 * this.m1_x1L + this.m1_b2 * this.m1_x2L - this.m1_a1 * this.m1_y1L - this.m1_a2 * this.m1_y2L;
      this.m1_x2L = this.m1_x1L; this.m1_x1L = m1_inL; this.m1_y2L = this.m1_y1L; this.m1_y1L = m1_outL;

      const m1_inR = chamberExcitation;
      const m1_outR = this.m1_b0 * m1_inR + this.m1_b1 * this.m1_x1R + this.m1_b2 * this.m1_x2R - this.m1_a1 * this.m1_y1R - this.m1_a2 * this.m1_y2R;
      this.m1_x2R = this.m1_x1R; this.m1_x1R = m1_inR; this.m1_y2R = this.m1_y1R; this.m1_y1R = m1_outR;

      // Mode 2
      const m2_inL = chamberExcitation;
      const m2_outL = this.m2_b0 * m2_inL + this.m2_b1 * this.m2_x1L + this.m2_b2 * this.m2_x2L - this.m2_a1 * this.m2_y1L - this.m2_a2 * this.m2_y2L;
      this.m2_x2L = this.m2_x1L; this.m2_x1L = m2_inL; this.m2_y2L = this.m2_y1L; this.m2_y1L = m2_outL;

      const m2_inR = chamberExcitation;
      const m2_outR = this.m2_b0 * m2_inR + this.m2_b1 * this.m2_x1R + this.m2_b2 * this.m2_x2R - this.m2_a1 * this.m2_y1R - this.m2_a2 * this.m2_y2R;
      this.m2_x2R = this.m2_x1R; this.m2_x1R = m2_inR; this.m2_y2R = this.m2_y1R; this.m2_y1R = m2_outR;

      const chamberL = enableChamber ? ((m1_outL * 1.2) + (m2_outL * harmonicRichness * 0.7)) : 0.0;
      const chamberR = enableChamber ? ((m1_outR * 1.2) + (m2_outR * harmonicRichness * 0.7)) : 0.0;

      // 7. Composite Signal Mixing
      let rawL = (combustionPulse * 0.45) + (crackleImpulse * 0.5) + (subSignal * 0.7) + (chamberL * 0.5) + activeNoiseL;
      let rawR = (combustionPulse * 0.45) + (crackleImpulse * 0.5) + (subSignal * 0.7) + (chamberR * 0.5) + activeNoiseR;

      // Overall throttle / intensity scaling
      rawL *= intensity;
      rawR *= intensity;

      // 8. Lowpass Filter for Spectral Brightness
      const lp_outL = this.lp_b0 * rawL + this.lp_b1 * this.lp_x1L + this.lp_b2 * this.lp_x2L - this.lp_a1 * this.lp_y1L - this.lp_a2 * this.lp_y2L;
      this.lp_x2L = this.lp_x1L; this.lp_x1L = rawL; this.lp_y2L = this.lp_y1L; this.lp_y1L = lp_outL;

      const lp_outR = this.lp_b0 * rawR + this.lp_b1 * this.lp_x1R + this.lp_b2 * this.lp_x2R - this.lp_a1 * this.lp_y1R - this.lp_a2 * this.lp_y2R;
      this.lp_x2R = this.lp_x1R; this.lp_x1R = rawR; this.lp_y2R = this.lp_y1R; this.lp_y1R = lp_outR;

      // 9. Non-linear Acoustic Saturation / Wave Shaper (SPL air compression)
      // Models non-linear compressibility of atmosphere under 150+ dB sound pressure
      const drivenL = (lp_outL + warmthBias) * saturationDrive;
      const drivenR = (lp_outR + warmthBias) * saturationDrive;
      const saturatedL = Math.tanh(drivenL) / Math.sqrt(Math.max(1.0, saturationDrive * 0.6));
      const saturatedR = Math.tanh(drivenR) / Math.sqrt(Math.max(1.0, saturationDrive * 0.6));

      // 10. DC Blocker
      // y[n] = x[n] - x[n-1] + 0.995 * y[n-1]
      const dcY_L = saturatedL - this.dcBlockX_L + 0.995 * this.dcBlockY_L;
      this.dcBlockX_L = saturatedL;
      this.dcBlockY_L = dcY_L;

      const dcY_R = saturatedR - this.dcBlockX_R + 0.995 * this.dcBlockY_R;
      this.dcBlockX_R = saturatedR;
      this.dcBlockY_R = dcY_R;

      // 11. Final Gain and Stereo Panning
      const finalL = dcY_L * masterGain * panGainL;
      const finalR = dcY_R * masterGain * panGainR;

      // Safety clamp against NaN/Inf
      outL[i] = Number.isFinite(finalL) ? Math.max(-1.0, Math.min(1.0, finalL)) : 0.0;
      outR[i] = Number.isFinite(finalR) ? Math.max(-1.0, Math.min(1.0, finalR)) : 0.0;
    }

    return true;
  }
}

registerProcessor('propulsion-processor', PropulsionProcessor);
`;
