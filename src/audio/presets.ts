/**
 * SOUNDforge - Propulsion Synthesis Presets
 * Pre-calibrated acoustic physics models for Milestone 1
 */

import { PropulsionParams, PropulsionPreset } from './types';

export const DEFAULT_PROPULSION_PARAMS: PropulsionParams = {
  enabled: true,
  muted: false,
  solo: false,
  gain: 0.85,
  pan: 0.0,

  intensity: 0.8,
  combustionRate: 32.0,       // 32 Hz deep combustion cycle
  combustionAsymmetry: 0.65,  // Asymmetric shockwave pulses
  combustionJitter: 0.35,     // Turbulent period flutter

  lowFreqEnergy: 0.75,        // Rich subharmonic foundation
  subharmonicMix: 0.6,
  subharmonicFreq: 24.0,      // 24 Hz seismic sub-bass

  spectralBrightness: 2800.0, // Mid-high frequency exhaust plume
  chamberFreq: 145.0,         // Combustion chamber acoustic resonance mode
  chamberResonance: 3.8,      // Resonance peak Q
  harmonicRichness: 0.55,     // Balance of harmonic and inharmonic modes

  noiseBroadbandMix: 0.65,    // Supersonic jet mixing noise
  noiseColor: 0.38,           // Deep pink/brown spectral tilt

  saturationDrive: 3.2,       // Acoustic SPL non-linear air compression
  warmthBias: 0.05,

  slowModRate: 0.18,          // Atmospheric plume thermal expansion cycle
  slowModDepth: 0.42,
  fastModRate: 16.0,          // Combustion vortex shedding flutter
  fastModDepth: 0.35,

  instability: 0.28,          // Stochastic flame kernel variance
  flameCrackleDensity: 0.45,  // Shock front acoustic crackle spikes

  // Sub-module source enables
  enableCombustion: true,
  enableSubharmonics: true,
  enableChamber: true,
  enableNoise: true,
  enableModulation: true,
  enableInstability: true,

  seed: 42079,
};

export const PROPULSION_PRESETS: PropulsionPreset[] = [
  {
    id: 'f1_heavy',
    name: 'Saturn V F-1 Engine (Kerosene/LOX)',
    subtitle: 'Massive low-frequency combustion chug & seismic roar',
    description: 'Models the immense 1.5-million-lbf gas generator cycle engine. Characterized by a slow, violent ~26 Hz combustion rate, deep chamber standing waves, and overwhelming subharmonic energy.',
    params: {
      intensity: 0.95,
      combustionRate: 26.0,
      combustionAsymmetry: 0.8,
      combustionJitter: 0.42,
      lowFreqEnergy: 0.92,
      subharmonicMix: 0.85,
      subharmonicFreq: 19.5,
      spectralBrightness: 2200.0,
      chamberFreq: 118.0,
      chamberResonance: 4.5,
      harmonicRichness: 0.6,
      noiseBroadbandMix: 0.72,
      noiseColor: 0.25,
      saturationDrive: 4.8,
      slowModRate: 0.12,
      slowModDepth: 0.55,
      fastModRate: 14.0,
      fastModDepth: 0.45,
      instability: 0.32,
      flameCrackleDensity: 0.58,
    },
  },
  {
    id: 'ssme_hydrolox',
    name: 'RS-25 SSME (Hydrolox Staged)',
    subtitle: 'High-frequency supersonic jet screamer & clean flame',
    description: 'Models the staged-combustion liquid hydrogen/oxygen rocket engine. High combustion rate (~68 Hz), piercing high-velocity supersonic jet shear, and sharp acoustic resonance in the nozzle bell.',
    params: {
      intensity: 0.88,
      combustionRate: 68.0,
      combustionAsymmetry: 0.5,
      combustionJitter: 0.2,
      lowFreqEnergy: 0.55,
      subharmonicMix: 0.4,
      subharmonicFreq: 34.0,
      spectralBrightness: 5800.0,
      chamberFreq: 260.0,
      chamberResonance: 5.2,
      harmonicRichness: 0.75,
      noiseBroadbandMix: 0.8,
      noiseColor: 0.62,
      saturationDrive: 2.4,
      slowModRate: 0.25,
      slowModDepth: 0.3,
      fastModRate: 24.0,
      fastModDepth: 0.28,
      instability: 0.15,
      flameCrackleDensity: 0.35,
    },
  },
  {
    id: 'srb_crackle',
    name: 'Solid Rocket Booster (SRB)',
    subtitle: 'Violent acoustic crackle, aluminum slag, granular fire',
    description: 'Models solid propellant burning with ammonium perchlorate and aluminum powder. Produces intense acoustic shock-front steepening (K-factor crackle), turbulent micro-explosions, and jagged mid-range noise.',
    params: {
      intensity: 0.92,
      combustionRate: 44.0,
      combustionAsymmetry: 0.95,
      combustionJitter: 0.65,
      lowFreqEnergy: 0.78,
      subharmonicMix: 0.68,
      subharmonicFreq: 28.0,
      spectralBrightness: 4200.0,
      chamberFreq: 185.0,
      chamberResonance: 3.2,
      harmonicRichness: 0.4,
      noiseBroadbandMix: 0.85,
      noiseColor: 0.48,
      saturationDrive: 5.5,
      slowModRate: 0.35,
      slowModDepth: 0.6,
      fastModRate: 32.0,
      fastModDepth: 0.65,
      instability: 0.72,
      flameCrackleDensity: 0.9,
    },
  },
  {
    id: 'pre_ignition_idle',
    name: 'Pre-Liftoff Ignition / Spin-Up',
    subtitle: 'Turbopump spool-up & low-pressure combustion chug',
    description: 'Represents ignition transient and low-throttle spin-up before main stage ramp. Characterized by discrete low-rate thuds, high combustion instability, and minimal high-frequency noise plume.',
    params: {
      intensity: 0.38,
      combustionRate: 14.0,
      combustionAsymmetry: 0.4,
      combustionJitter: 0.55,
      lowFreqEnergy: 0.6,
      subharmonicMix: 0.45,
      subharmonicFreq: 14.0,
      spectralBrightness: 950.0,
      chamberFreq: 95.0,
      chamberResonance: 2.1,
      harmonicRichness: 0.3,
      noiseBroadbandMix: 0.3,
      noiseColor: 0.2,
      saturationDrive: 1.8,
      slowModRate: 0.08,
      slowModDepth: 0.4,
      fastModRate: 8.0,
      fastModDepth: 0.5,
      instability: 0.6,
      flameCrackleDensity: 0.2,
    },
  },
  {
    id: 'max_q_shear',
    name: 'Max-Q Supersonic Shear Roar',
    subtitle: 'Extreme aerodynamic shear & turbulent exhaust boundary',
    description: 'Models maximum acoustic pressure where supersonic plume interaction with dense surrounding air causes extreme non-linear acoustic compression and vortex flutter.',
    params: {
      intensity: 1.0,
      combustionRate: 38.0,
      combustionAsymmetry: 0.85,
      combustionJitter: 0.48,
      lowFreqEnergy: 0.88,
      subharmonicMix: 0.75,
      subharmonicFreq: 22.0,
      spectralBrightness: 6400.0,
      chamberFreq: 160.0,
      chamberResonance: 4.0,
      harmonicRichness: 0.65,
      noiseBroadbandMix: 0.95,
      noiseColor: 0.55,
      saturationDrive: 6.2,
      slowModRate: 0.45,
      slowModDepth: 0.65,
      fastModRate: 28.0,
      fastModDepth: 0.58,
      instability: 0.45,
      flameCrackleDensity: 0.75,
    },
  },
  {
    id: 'infrasonic_pad',
    name: 'Infrasonic Pad Resonance',
    subtitle: 'Deep acoustic ground coupling & trench resonance',
    description: 'Highlights the subsonic acoustic energy coupled into the launch pad flame trench and surrounding ground. Heavy infrasonic rumble below 30 Hz with suppressed upper frequencies.',
    params: {
      intensity: 0.82,
      combustionRate: 18.0,
      combustionAsymmetry: 0.5,
      combustionJitter: 0.3,
      lowFreqEnergy: 1.0,
      subharmonicMix: 0.95,
      subharmonicFreq: 12.0,
      spectralBrightness: 850.0,
      chamberFreq: 75.0,
      chamberResonance: 6.0,
      harmonicRichness: 0.5,
      noiseBroadbandMix: 0.4,
      noiseColor: 0.1,
      saturationDrive: 3.5,
      slowModRate: 0.06,
      slowModDepth: 0.35,
      fastModRate: 10.0,
      fastModDepth: 0.25,
      instability: 0.18,
      flameCrackleDensity: 0.15,
    },
  },
];
