/**
 * SOUNDforge - Aerodynamic Synthesis Presets (Milestone 2)
 * Physical acoustic models for turbulent airflow, buffeting, shear, and whistling
 */

import { AerodynamicParams, AerodynamicPreset } from './types';

export const DEFAULT_AERODYNAMIC_PARAMS: AerodynamicParams = {
  enabled: true,
  muted: false,
  solo: false,
  gain: 0.85,
  pan: 0.0,

  airflowIntensity: 0.75,
  velocity: 340.0,      // 340 m/s (Transonic Mach 1.0)
  density: 1.20,        // 1.20 kg/m³ (Near sea level)
  turbulence: 0.48,     // Correlated stochastic gust factor
  resonance: 3.5,       // Q factor of acoustic whistling
  bandwidth: 650.0,     // 650 Hz bandpass width

  buffetingRate: 7.2,    // 7.2 Hz boundary layer buffeting
  buffetingDepth: 0.55,  // Deep buffeting modulation
  whistlingMix: 0.35,    // Cavity/edge tone mix
  whistlingFreq: 880.0,  // Resonant whistle pitch
  shearNoiseMix: 0.52,   // High-speed skin friction shear
  pinkWhiteRatio: 0.38,  // Blend of pink rushing and white shear
  saturationDrive: 2.2,

  // Sub-module source enables
  enableFlow: true,
  enableWhistling: true,
  enableBuffeting: true,
  enableShear: true,

  seed: 10842,
};

export const AERODYNAMIC_PRESETS: AerodynamicPreset[] = [
  {
    id: 'transonic_max_q',
    name: 'Transonic Max-Q Boundary Buffeting',
    subtitle: 'Mach 1.2 shock boundary, violent buffeting & pressure fluctuations',
    description: 'Models the extreme aerodynamic buffeting when passing through Mach 1.0–1.3 at maximum dynamic pressure. Rapidly fluctuating shock attachments generate heavy low-frequency shudder and resonant rushing.',
    params: {
      airflowIntensity: 0.95,
      velocity: 430.0,
      density: 0.88,
      turbulence: 0.82,
      resonance: 4.8,
      bandwidth: 850.0,
      buffetingRate: 11.5,
      buffetingDepth: 0.85,
      whistlingMix: 0.42,
      whistlingFreq: 1150.0,
      shearNoiseMix: 0.78,
      pinkWhiteRatio: 0.52,
      saturationDrive: 3.8,
    },
  },
  {
    id: 'supersonic_shear',
    name: 'Supersonic Skin Friction & Re-Entry Shear',
    subtitle: 'Mach 3.5+ extreme aerodynamic skin friction and compressed air hiss',
    description: 'High-velocity flow with compressed boundary layers. Characterized by high-frequency turbulent shear hiss, high resonant edge frequencies, and non-linear boundary layer air compression.',
    params: {
      airflowIntensity: 0.9,
      velocity: 1150.0,
      density: 0.32,
      turbulence: 0.4,
      resonance: 6.2,
      bandwidth: 1400.0,
      buffetingRate: 18.0,
      buffetingDepth: 0.45,
      whistlingMix: 0.65,
      whistlingFreq: 2800.0,
      shearNoiseMix: 0.95,
      pinkWhiteRatio: 0.78,
      saturationDrive: 4.2,
    },
  },
  {
    id: 'sea_level_wake',
    name: 'Sea-Level Subsonic Wake & Turbulent Wind',
    subtitle: 'Dense 1.22 kg/m³ atmosphere rushing past massive vehicle hull',
    description: 'Low-speed, dense air wake. Full acoustic low-frequency coupling creates a deep, rushing pink-noise wind with slow stochastic gusts and broad turbulent vortex shedding.',
    params: {
      airflowIntensity: 0.7,
      velocity: 95.0,
      density: 1.25,
      turbulence: 0.65,
      resonance: 1.8,
      bandwidth: 420.0,
      buffetingRate: 3.8,
      buffetingDepth: 0.6,
      whistlingMix: 0.15,
      whistlingFreq: 420.0,
      shearNoiseMix: 0.25,
      pinkWhiteRatio: 0.15,
      saturationDrive: 1.6,
    },
  },
  {
    id: 'stratospheric_thin',
    name: 'Stratospheric Thin-Air Edge Whistle',
    subtitle: 'Low density 0.05 kg/m³ — attenuated rumble & sharp edge tones',
    description: 'High altitude where rarefied atmosphere cannot support dense low-frequency acoustic transmission. Lower frequencies are attenuated while sharp resonant body whistling and thin shear remain audible.',
    params: {
      airflowIntensity: 0.6,
      velocity: 820.0,
      density: 0.06,
      turbulence: 0.25,
      resonance: 8.5,
      bandwidth: 320.0,
      buffetingRate: 8.0,
      buffetingDepth: 0.25,
      whistlingMix: 0.85,
      whistlingFreq: 2400.0,
      shearNoiseMix: 0.65,
      pinkWhiteRatio: 0.68,
      saturationDrive: 1.4,
    },
  },
  {
    id: 'fairing_cavity_whistle',
    name: 'Fairing Cavity Acoustic Resonance',
    subtitle: 'Aerodynamic whistling across umbilical recesses & aerodynamic fins',
    description: 'Acoustic edge tones and Helmholtz cavity resonances excited by high-speed airflow over vehicle geometry, creating pronounced tonal whistling amidst turbulent rushing.',
    params: {
      airflowIntensity: 0.82,
      velocity: 280.0,
      density: 1.15,
      turbulence: 0.52,
      resonance: 9.8,
      bandwidth: 550.0,
      buffetingRate: 6.0,
      buffetingDepth: 0.5,
      whistlingMix: 0.78,
      whistlingFreq: 1420.0,
      shearNoiseMix: 0.45,
      pinkWhiteRatio: 0.35,
      saturationDrive: 2.8,
    },
  },
];
