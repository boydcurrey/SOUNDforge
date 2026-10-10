/**
 * AudioWorkletProcessor script string for Procedural Aerodynamic Flow Synthesis
 * Milestone 2: Turbulent airflow, buffeting, whistling, and shear effects
 */

export const AERODYNAMIC_WORKLET_PROCESSOR_CODE = `
class AerodynamicProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // PRNG state
    this.seed = 10842;
    this.rngState = this.seed;

    // Pink noise states (Kellet filter) - Left & Right
    this.b0L = 0; this.b1L = 0; this.b2L = 0; this.b3L = 0; this.b4L = 0; this.b5L = 0;
    this.b0R = 0; this.b1R = 0; this.b2R = 0; this.b3R = 0; this.b4R = 0; this.b5R = 0;

    // Correlated turbulence random walk (gust generator)
    this.gustL = 0.0;
    this.gustR = 0.0;
    this.gustTargetL = 0.0;
    this.gustTargetR = 0.0;

    // Buffeting oscillator phase
    this.buffetingPhase = 0.0;

    // Resonant Biquad Filter states:
    // 1. Modulated Bandpass Noise Filter (L & R)
    this.bp_x1L = 0; this.bp_x2L = 0; this.bp_y1L = 0; this.bp_y2L = 0;
    this.bp_x1R = 0; this.bp_x2R = 0; this.bp_y1R = 0; this.bp_y2R = 0;

    // 2. Resonant Whistle Filter 1 (L & R)
    this.w1_x1L = 0; this.w1_x2L = 0; this.w1_y1L = 0; this.w1_y2L = 0;
    this.w1_x1R = 0; this.w1_x2R = 0; this.w1_y1R = 0; this.w1_y2R = 0;

    // 3. Resonant Whistle Filter 2 (L & R)
    this.w2_x1L = 0; this.w2_x2L = 0; this.w2_y1L = 0; this.w2_y2L = 0;
    this.w2_x1R = 0; this.w2_x2R = 0; this.w2_y1R = 0; this.w2_y2R = 0;

    // 4. Density Highpass Filter (L & R)
    this.hp_x1L = 0; this.hp_x2L = 0; this.hp_y1L = 0; this.hp_y2L = 0;
    this.hp_x1R = 0; this.hp_x2R = 0; this.hp_y1R = 0; this.hp_y2R = 0;

    // 5. Supersonic Shear Highpass Filter (L & R)
    this.sh_x1L = 0; this.sh_x2L = 0; this.sh_y1L = 0; this.sh_y2L = 0;
    this.sh_x1R = 0; this.sh_x2R = 0; this.sh_y1R = 0; this.sh_y2R = 0;

    // Coefficients
    this.bp_b0 = 0; this.bp_b1 = 0; this.bp_b2 = 0; this.bp_a1 = 0; this.bp_a2 = 0;
    this.w1_b0 = 0; this.w1_b1 = 0; this.w1_b2 = 0; this.w1_a1 = 0; this.w1_a2 = 0;
    this.w2_b0 = 0; this.w2_b1 = 0; this.w2_b2 = 0; this.w2_a1 = 0; this.w2_a2 = 0;
    this.hp_b0 = 0; this.hp_b1 = 0; this.hp_b2 = 0; this.hp_a1 = 0; this.hp_a2 = 0;
    this.sh_b0 = 0; this.sh_b1 = 0; this.sh_b2 = 0; this.sh_a1 = 0; this.sh_a2 = 0;

    // Cache to prevent recalculating biquad math every sample
    this.lastBpCenter = -1;
    this.lastBpQ = -1;
    this.lastW1Freq = -1;
    this.lastW1Q = -1;
    this.lastHpFreq = -1;

    // DC blocker states
    this.dcX_L = 0; this.dcY_L = 0;
    this.dcX_R = 0; this.dcY_R = 0;

    // Parameters
    this.params = {
      enabled: 1.0,
      muted: 0.0,
      gain: 0.85,
      pan: 0.0,
      airflowIntensity: 0.75,
      velocity: 340.0,
      density: 1.20,
      turbulence: 0.48,
      resonance: 3.5,
      bandwidth: 650.0,
      buffetingRate: 7.2,
      buffetingDepth: 0.55,
      whistlingMix: 0.35,
      whistlingFreq: 880.0,
      shearNoiseMix: 0.52,
      pinkWhiteRatio: 0.38,
      saturationDrive: 2.2,
      seed: 10842
    };

    this.smoothed = Object.assign({}, this.params);

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

  random() {
    let x = this.rngState;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.rngState = x;
    return ((x >>> 0) / 4294967296);
  }

  calcBandpassCoeffs(freq, q, sampleRate) {
    const w0 = 2 * Math.PI * Math.min(Math.max(freq, 25), sampleRate * 0.45) / sampleRate;
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

  calcHighpassCoeffs(freq, sampleRate) {
    const w0 = 2 * Math.PI * Math.min(Math.max(freq, 10), sampleRate * 0.45) / sampleRate;
    const cosw0 = Math.cos(w0);
    const alpha = Math.sin(w0) / (2 * 0.7071);
    const a0 = 1 + alpha;
    return {
      b0: ((1 + cosw0) / 2) / a0,
      b1: (-(1 + cosw0)) / a0,
      b2: ((1 + cosw0) / 2) / a0,
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

    // Smooth parameters
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

    const airflowIntensity = this.smoothed.airflowIntensity;
    const velocity = Math.max(0.0, this.smoothed.velocity);
    const density = Math.max(0.001, this.smoothed.density);
    const turbulence = this.smoothed.turbulence;
    const resonance = Math.max(0.2, this.smoothed.resonance);
    const bandwidth = Math.max(20.0, this.smoothed.bandwidth);
    const buffetingRate = Math.max(0.2, this.smoothed.buffetingRate);
    const buffetingDepth = this.smoothed.buffetingDepth;
    const whistlingMix = this.smoothed.whistlingMix;
    const whistlingFreq = Math.max(100.0, this.smoothed.whistlingFreq);
    const shearNoiseMix = this.smoothed.shearNoiseMix;
    const pinkWhiteRatio = this.smoothed.pinkWhiteRatio;
    const saturationDrive = Math.max(1.0, this.smoothed.saturationDrive);
    const masterGain = this.smoothed.gain;
    const pan = Math.min(1.0, Math.max(-1.0, this.smoothed.pan));

    const enableFlow = this.params.enableFlow !== false;
    const enableWhistling = this.params.enableWhistling !== false;
    const enableBuffeting = this.params.enableBuffeting !== false;
    const enableShear = this.params.enableShear !== false;

    // Velocity-sensitive spectral changes:
    // Flow speed shifts center bandpass upwards (e.g. 100 Hz at low speed to 1800 Hz at Mach 3)
    const velocityNormalized = velocity / 340.0; // Mach number relative to sea-level sound speed
    const bpCenter = Math.min(6000.0, 120.0 + (velocityNormalized * 450.0) + (bandwidth * 0.5));
    const bpQ = Math.max(0.4, bpCenter / Math.max(bandwidth, 40.0));

    // Density-dependent acoustic coupling:
    // Low atmospheric density attenuates bass transmission (high-pass filter moves up, overall transmission diminishes)
    const densityCoupling = Math.min(1.0, Math.pow(density / 1.225, 0.65));
    const densityHpFreq = Math.max(20.0, (1.25 - Math.min(1.2, density)) * 320.0);

    // Whistling edge frequency rises with fluid velocity (Strouhal number f = St * v / d)
    const effectiveWhistle1 = Math.min(8000.0, whistlingFreq * (0.7 + velocityNormalized * 0.45));
    const effectiveWhistle2 = Math.min(12000.0, effectiveWhistle1 * 1.68);

    // Update filter coefficients once per block
    if (Math.abs(this.lastBpCenter - bpCenter) > 2.0 || Math.abs(this.lastBpQ - bpQ) > 0.05) {
      const bp = this.calcBandpassCoeffs(bpCenter, bpQ, sampleRate);
      this.bp_b0 = bp.b0; this.bp_b1 = bp.b1; this.bp_b2 = bp.b2;
      this.bp_a1 = bp.a1; this.bp_a2 = bp.a2;
      this.lastBpCenter = bpCenter;
      this.lastBpQ = bpQ;
    }

    if (Math.abs(this.lastW1Freq - effectiveWhistle1) > 2.0 || Math.abs(this.lastW1Q - resonance) > 0.05) {
      const w1 = this.calcBandpassCoeffs(effectiveWhistle1, resonance, sampleRate);
      this.w1_b0 = w1.b0; this.w1_b1 = w1.b1; this.w1_b2 = w1.b2;
      this.w1_a1 = w1.a1; this.w1_a2 = w1.a2;

      const w2 = this.calcBandpassCoeffs(effectiveWhistle2, resonance * 0.75, sampleRate);
      this.w2_b0 = w2.b0; this.w2_b1 = w2.b1; this.w2_b2 = w2.b2;
      this.w2_a1 = w2.a1; this.w2_a2 = w2.a2;

      this.lastW1Freq = effectiveWhistle1;
      this.lastW1Q = resonance;
    }

    if (Math.abs(this.lastHpFreq - densityHpFreq) > 2.0) {
      const hp = this.calcHighpassCoeffs(densityHpFreq, sampleRate);
      this.hp_b0 = hp.b0; this.hp_b1 = hp.b1; this.hp_b2 = hp.b2;
      this.hp_a1 = hp.a1; this.hp_a2 = hp.a2;
      this.lastHpFreq = densityHpFreq;
    }

    // Shear noise high-pass at 1800 Hz
    const shearHp = this.calcHighpassCoeffs(1800.0, sampleRate);
    this.sh_b0 = shearHp.b0; this.sh_b1 = shearHp.b1; this.sh_b2 = shearHp.b2;
    this.sh_a1 = shearHp.a1; this.sh_a2 = shearHp.a2;

    const panAngle = (pan + 1.0) * 0.25 * Math.PI;
    const panGainL = Math.cos(panAngle);
    const panGainR = Math.sin(panAngle);

    for (let i = 0; i < bufferSize; i++) {
      // 1. Correlated Random Turbulence Walk (Atmospheric gusts)
      if (i % 64 === 0) {
        this.gustTargetL = (this.random() * 2.0 - 1.0) * turbulence;
        this.gustTargetR = (this.random() * 2.0 - 1.0) * turbulence;
      }
      this.gustL += (this.gustTargetL - this.gustL) * 0.02;
      this.gustR += (this.gustTargetR - this.gustR) * 0.02;

      const gustFactorL = Math.max(0.0, 1.0 + this.gustL);
      const gustFactorR = Math.max(0.0, 1.0 + this.gustR);

      // 2. Low-frequency Buffeting Modulator (Vehicle boundary layer shudder)
      // Buffeting frequency is perturbed by turbulence
      const curBuffetRate = buffetingRate * (1.0 + this.gustL * 0.3);
      this.buffetingPhase += curBuffetRate * invSampleRate;
      if (this.buffetingPhase >= 1.0) this.buffetingPhase -= 1.0;

      const buffetWave = Math.sin(this.buffetingPhase * 2 * Math.PI);
      const buffetMod = enableBuffeting ? (1.0 + (buffetWave * buffetingDepth * 0.65)) : 1.0;

      // 3. Noise Sources (White & Kellet Pink Filter)
      const whiteL = this.random() * 2.0 - 1.0;
      const whiteR = this.random() * 2.0 - 1.0;

      // Kellet Pink Filter L
      this.b0L = 0.99886 * this.b0L + whiteL * 0.0555179;
      this.b1L = 0.99332 * this.b1L + whiteL * 0.0750759;
      this.b2L = 0.96900 * this.b2L + whiteL * 0.1538520;
      this.b3L = 0.86650 * this.b3L + whiteL * 0.3104856;
      this.b4L = 0.55000 * this.b4L + whiteL * 0.5329522;
      this.b5L = -0.7616 * this.b5L - whiteL * 0.0168980;
      const pinkL = (this.b0L + this.b1L + this.b2L + this.b3L + this.b4L + this.b5L + whiteL * 0.5362) * 0.12;

      // Kellet Pink Filter R
      this.b0R = 0.99886 * this.b0R + whiteR * 0.0555179;
      this.b1R = 0.99332 * this.b1R + whiteR * 0.0750759;
      this.b2R = 0.96900 * this.b2R + whiteR * 0.1538520;
      this.b3R = 0.86650 * this.b3R + whiteR * 0.3104856;
      this.b4R = 0.55000 * this.b4R + whiteR * 0.5329522;
      this.b5R = -0.7616 * this.b5R - whiteR * 0.0168980;
      const pinkR = (this.b0R + this.b1R + this.b2R + this.b3R + this.b4R + this.b5R + whiteR * 0.5362) * 0.12;

      // Noise Blend
      const noiseL = (pinkL * (1.0 - pinkWhiteRatio)) + (whiteL * 0.2 * pinkWhiteRatio);
      const noiseR = (pinkR * (1.0 - pinkWhiteRatio)) + (whiteR * 0.2 * pinkWhiteRatio);

      // 4. Modulated Band-Pass Buffeting Noise
      const bp_inL = noiseL * buffetMod * gustFactorL;
      const bp_outL = this.bp_b0 * bp_inL + this.bp_b1 * this.bp_x1L + this.bp_b2 * this.bp_x2L - this.bp_a1 * this.bp_y1L - this.bp_a2 * this.bp_y2L;
      this.bp_x2L = this.bp_x1L; this.bp_x1L = bp_inL; this.bp_y2L = this.bp_y1L; this.bp_y1L = bp_outL;

      const bp_inR = noiseR * buffetMod * gustFactorR;
      const bp_outR = this.bp_b0 * bp_inR + this.bp_b1 * this.bp_x1R + this.bp_b2 * this.bp_x2R - this.bp_a1 * this.bp_y1R - this.bp_a2 * this.bp_y2R;
      this.bp_x2R = this.bp_x1R; this.bp_x1R = bp_inR; this.bp_y2R = this.bp_y1R; this.bp_y1R = bp_outR;

      // 5. Resonant Whistling & Edge Tones
      // Whistle 1
      const w1_inL = noiseL * (1.0 + this.gustL * 0.2);
      const w1_outL = this.w1_b0 * w1_inL + this.w1_b1 * this.w1_x1L + this.w1_b2 * this.w1_x2L - this.w1_a1 * this.w1_y1L - this.w1_a2 * this.w1_y2L;
      this.w1_x2L = this.w1_x1L; this.w1_x1L = w1_inL; this.w1_y2L = this.w1_y1L; this.w1_y1L = w1_outL;

      const w1_inR = noiseR * (1.0 + this.gustR * 0.2);
      const w1_outR = this.w1_b0 * w1_inR + this.w1_b1 * this.w1_x1R + this.w1_b2 * this.w1_x2R - this.w1_a1 * this.w1_y1R - this.w1_a2 * this.w1_y2R;
      this.w1_x2R = this.w1_x1R; this.w1_x1R = w1_inR; this.w1_y2R = this.w1_y1R; this.w1_y1R = w1_outR;

      // Whistle 2 (Overtone)
      const w2_outL = this.w2_b0 * w1_inL + this.w2_b1 * this.w2_x1L + this.w2_b2 * this.w2_x2L - this.w2_a1 * this.w2_y1L - this.w2_a2 * this.w2_y2L;
      this.w2_x2L = this.w2_x1L; this.w2_x1L = w1_inL; this.w2_y2L = this.w2_y1L; this.w2_y1L = w2_outL;

      const w2_outR = this.w2_b0 * w1_inR + this.w2_b1 * this.w2_x1R + this.w2_b2 * this.w2_x2R - this.w2_a1 * this.w2_y1R - this.w2_a2 * this.w2_y2R;
      this.w2_x2R = this.w2_x1R; this.w2_x1R = w1_inR; this.w2_y2R = this.w2_y1R; this.w2_y1R = w2_outR;

      const whistleTotalL = enableWhistling ? ((w1_outL * 1.5 + w2_outL * 0.8) * whistlingMix) : 0.0;
      const whistleTotalR = enableWhistling ? ((w1_outR * 1.5 + w2_outR * 0.8) * whistlingMix) : 0.0;

      // 6. Supersonic Skin Friction Shear Noise (Highpass)
      const sh_inL = whiteL * Math.min(2.0, velocityNormalized * 0.8);
      const sh_outL = this.sh_b0 * sh_inL + this.sh_b1 * this.sh_x1L + this.sh_b2 * this.sh_x2L - this.sh_a1 * this.sh_y1L - this.sh_a2 * this.sh_y2L;
      this.sh_x2L = this.sh_x1L; this.sh_x1L = sh_inL; this.sh_y2L = this.sh_y1L; this.sh_y1L = sh_outL;

      const sh_inR = whiteR * Math.min(2.0, velocityNormalized * 0.8);
      const sh_outR = this.sh_b0 * sh_inR + this.sh_b1 * this.sh_x1R + this.sh_b2 * this.sh_x2R - this.sh_a1 * this.sh_y1R - this.sh_a2 * this.sh_y2R;
      this.sh_x2R = this.sh_x1R; this.sh_x1R = sh_inR; this.sh_y2R = this.sh_y1R; this.sh_y1R = sh_outR;

      const shearL = enableShear ? (sh_outL * shearNoiseMix * (0.3 + 0.7 * Math.min(1.5, velocityNormalized))) : 0.0;
      const shearR = enableShear ? (sh_outR * shearNoiseMix * (0.3 + 0.7 * Math.min(1.5, velocityNormalized))) : 0.0;

      // 7. Combined Signal
      const flowL = enableFlow ? ((bp_outL * 1.4) + (noiseL * 0.4 * gustFactorL)) : 0.0;
      const flowR = enableFlow ? ((bp_outR * 1.4) + (noiseR * 0.4 * gustFactorR)) : 0.0;
      let sigL = flowL + whistleTotalL + shearL;
      let sigR = flowR + whistleTotalR + shearR;

      // Scale by airflow intensity & density acoustic coupling
      sigL *= airflowIntensity * densityCoupling;
      sigR *= airflowIntensity * densityCoupling;

      // 8. Density Highpass Filter (low density attenuates low frequency acoustic transfer)
      const hp_outL = this.hp_b0 * sigL + this.hp_b1 * this.hp_x1L + this.hp_b2 * this.hp_x2L - this.hp_a1 * this.hp_y1L - this.hp_a2 * this.hp_y2L;
      this.hp_x2L = this.hp_x1L; this.hp_x1L = sigL; this.hp_y2L = this.hp_y1L; this.hp_y1L = hp_outL;

      const hp_outR = this.hp_b0 * sigR + this.hp_b1 * this.hp_x1R + this.hp_b2 * this.hp_x2R - this.hp_a1 * this.hp_y1R - this.hp_a2 * this.hp_y2R;
      this.hp_x2R = this.hp_x1R; this.hp_x1R = sigR; this.hp_y2R = this.hp_y1R; this.hp_y1R = hp_outR;

      // 9. Boundary Layer Acoustic Compression (Non-linear saturation)
      const satL = Math.tanh(hp_outL * saturationDrive) / Math.sqrt(Math.max(1.0, saturationDrive * 0.5));
      const satR = Math.tanh(hp_outR * saturationDrive) / Math.sqrt(Math.max(1.0, saturationDrive * 0.5));

      // 10. DC Blocker
      const dcOutL = satL - this.dcX_L + 0.995 * this.dcY_L;
      this.dcX_L = satL;
      this.dcY_L = dcOutL;

      const dcOutR = satR - this.dcX_R + 0.995 * this.dcY_R;
      this.dcX_R = satR;
      this.dcY_R = dcOutR;

      // 11. Master Gain and Pan
      const finalL = dcOutL * masterGain * panGainL;
      const finalR = dcOutR * masterGain * panGainR;

      outL[i] = Number.isFinite(finalL) ? Math.max(-1.0, Math.min(1.0, finalL)) : 0.0;
      outR[i] = Number.isFinite(finalR) ? Math.max(-1.0, Math.min(1.0, finalR)) : 0.0;
    }

    return true;
  }
}

registerProcessor('aerodynamic-processor', AerodynamicProcessor);
`;
