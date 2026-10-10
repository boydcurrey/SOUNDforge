/**
 * SOUNDforge Procedural Audio Synthesis Engine
 * Types and parameter definitions for Milestone 1: Propulsion Synthesis
 */

export interface PropulsionParams {
  // Module routing
  enabled: boolean;
  muted: boolean;
  solo: boolean;
  gain: number;       // Linear 0.0 to 2.0 (default 1.0)
  pan: number;        // -1.0 (L) to +1.0 (R)

  // Primary Throttle & Intensity
  intensity: number;  // 0.0 to 1.0 (master thrust level)

  // Combustion Mechanics
  combustionRate: number;      // 5.0 Hz to 120.0 Hz (fundamental pulse frequency)
  combustionAsymmetry: number; // 0.0 to 1.0 (acoustic shock-front steepening / crackle factor)
  combustionJitter: number;    // 0.0 to 1.0 (stochastic period variation / turbulent flame flutter)

  // Low-Frequency & Subharmonics
  lowFreqEnergy: number;       // 0.0 to 1.0 (infrasound and sub-bass weight)
  subharmonicMix: number;      // 0.0 to 1.0 (sub-octave f/2 and f/3 energy mix)
  subharmonicFreq: number;     // 10.0 to 60.0 Hz (subharmonic fundamental root)

  // Spectral Shaping & Chamber Resonances
  spectralBrightness: number;  // 100.0 to 12000.0 Hz (exhaust plume cutoff)
  chamberFreq: number;         // 60.0 to 600.0 Hz (throat / chamber resonant standing wave)
  chamberResonance: number;    // 0.5 to 12.0 (Q factor of chamber acoustic mode)
  harmonicRichness: number;    // 0.0 to 1.0 (harmonic vs inharmonic standing wave ratio)

  // Broadband Noise & Aerodynamic Plume
  noiseBroadbandMix: number;   // 0.0 to 1.0 (turbulent jet mixing roar level)
  noiseColor: number;          // 0.0 to 1.0 (0 = brownian dark roar, 0.5 = pink, 1 = white shear)

  // Nonlinear Saturation & Dynamics
  saturationDrive: number;     // 1.0 to 10.0 (extreme sound pressure level air non-linearity)
  warmthBias: number;          // -0.5 to 0.5 (asymmetric DC/even harmonic warmth bias)

  // Modulation (Slow and Fast)
  slowModRate: number;         // 0.02 to 2.0 Hz (exhaust plume atmospheric drift LFO)
  slowModDepth: number;        // 0.0 to 1.0 (slow drift amplitude/filter depth)
  fastModRate: number;         // 4.0 to 45.0 Hz (vortex shedding & combustion flutter)
  fastModDepth: number;        // 0.0 to 1.0 (flutter depth)

  // Controlled Instability
  instability: number;         // 0.0 to 1.0 (stochastic blowout bursts, micro-pops & chaos)
  flameCrackleDensity: number; // 0.0 to 1.0 (density of shockwave acoustic crackle spikes)

  // Sub-module Source Enables
  enableCombustion: boolean;
  enableSubharmonics: boolean;
  enableChamber: boolean;
  enableNoise: boolean;
  enableModulation: boolean;
  enableInstability: boolean;

  // Reproducible Seed
  seed: number;                // Integer seed for PRNG
}

export interface AerodynamicParams {
  // Module routing
  enabled: boolean;
  muted: boolean;
  solo: boolean;
  gain: number;       // Linear 0.0 to 2.0 (default 1.0)
  pan: number;        // -1.0 (L) to +1.0 (R)

  // Sub-module Source Enables
  enableFlow: boolean;
  enableWhistling: boolean;
  enableBuffeting: boolean;
  enableShear: boolean;

  // Physical Control Variables (Section 3.B)
  airflowIntensity: number; // 0.0 to 1.0 (overall airflow power)
  velocity: number;         // 0.0 to 1500.0 m/s (vehicle speed through fluid)
  density: number;          // 0.0 to 1.5 kg/m³ (atmospheric air density)
  turbulence: number;       // 0.0 to 1.0 (correlated random variation / gust dynamics)
  resonance: number;        // 0.5 to 15.0 (Q factor of whistling & resonant filters)
  bandwidth: number;        // 50.0 to 4000.0 Hz (modulated band-pass filter bandwidth)

  // Detailed Synthesis Parameters
  buffetingRate: number;    // 0.5 to 35.0 Hz (low-frequency boundary shudder rate)
  buffetingDepth: number;   // 0.0 to 1.0 (buffeting modulation depth)
  whistlingMix: number;     // 0.0 to 1.0 (resonant cavity & edge tone mix)
  whistlingFreq: number;    // 150.0 to 5000.0 Hz (base cavity whistling tone)
  shearNoiseMix: number;    // 0.0 to 1.0 (supersonic skin friction shear hiss)
  pinkWhiteRatio: number;   // 0.0 to 1.0 (0 = pink rushing roar, 1 = sharp white hiss)
  saturationDrive: number;  // 1.0 to 8.0 (boundary layer acoustic compression)

  // Reproducible Seed
  seed: number;
}

export interface AudioEngineMetrics {
  isRunning: boolean;
  sampleRate: number;
  outputLatency: number;
  peakL: number;
  peakR: number;
  rms: number;
  isClipping: boolean;
  timeElapsed: number;
}

export interface PropulsionPreset {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  params: Partial<PropulsionParams>;
}

export interface AerodynamicPreset {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  params: Partial<AerodynamicParams>;
}

export interface ParameterInfoItem {
  id: string;
  name: string;
  unit: string;
  range: string;
  whatItIs: string;
  sonicContribution: string;
  rangeRationale: string;
  flightEvolution: string;
}

