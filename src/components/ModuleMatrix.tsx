import React from 'react';
import { Flame, Wind, Building2, Hammer, CheckCircle2, Clock } from 'lucide-react';

export const ModuleMatrix: React.FC = () => {
  const modules = [
    {
      id: 'propulsion',
      tag: 'MODULE A',
      milestone: 'Milestone 1',
      title: 'Propulsion Synthesis',
      status: 'ONLINE',
      active: true,
      description: 'Continuous evolving engine sounds, pulsed combustion textures, multiple subharmonics, broadband plume roar, acoustic chamber modes, and nonlinear saturation.',
      icon: Flame,
      color: 'amber',
    },
    {
      id: 'aero',
      tag: 'MODULE B',
      milestone: 'Milestone 2',
      title: 'Aerodynamic Flow',
      status: 'ONLINE',
      active: true,
      description: 'Turbulent airflow, rushing, buffeting, whistling, shear effects, resonant filters, and velocity-sensitive spectral changes.',
      icon: Wind,
      color: 'cyan',
    },
    {
      id: 'structure',
      tag: 'MODULE C',
      milestone: 'Milestone 3',
      title: 'Structural Resonance',
      status: 'QUEUED',
      active: false,
      description: 'Damped modal resonators, load-dependent resonant shifts, metallic/composite flexing, groaning, and stochastic rattling.',
      icon: Building2,
      color: 'zinc',
    },
    {
      id: 'mechanical',
      tag: 'MODULE D',
      milestone: 'Milestone 4',
      title: 'Mechanical Events',
      status: 'QUEUED',
      active: false,
      description: 'Discrete physical events: pyrotechnic ignition, staging releases, high-pressure valve operations, and engine cutoff impulses.',
      icon: Hammer,
      color: 'zinc',
    },
  ];

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
        <div>
          <h2 className="text-xs font-mono font-bold tracking-wider text-zinc-200 uppercase">
            Synthesis Architecture Matrix · Milestone 2 Active
          </h2>
          <p className="text-[11px] font-mono text-zinc-500">
            Combined multi-module acoustic synthesis: Propulsion + Aerodynamic Flow running in parallel
          </p>
        </div>
        <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
          Scope: Milestones 1 & 2 Online
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                m.active
                  ? 'bg-zinc-900/90 border-amber-500/40 shadow-sm shadow-amber-500/5'
                  : 'bg-zinc-900/30 border-zinc-800/80 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${m.active ? 'text-amber-400' : 'text-zinc-500'}`} />
                    <span className="text-[10px] font-mono font-bold text-zinc-300">
                      {m.tag}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 ${
                      m.active
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                    }`}
                  >
                    {m.active ? (
                      <>
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {m.status}
                      </>
                    ) : (
                      <>
                        <Clock className="w-2.5 h-2.5" />
                        {m.milestone}
                      </>
                    )}
                  </span>
                </div>

                <h3 className={`text-xs font-mono font-bold mb-1 ${m.active ? 'text-zinc-100' : 'text-zinc-400'}`}>
                  {m.title}
                </h3>
                <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
                  {m.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-zinc-800/60 text-[9px] font-mono text-zinc-400 flex items-center justify-between">
                <span>Routing: Master Summing Bus</span>
                <span>{m.active ? 'AudioWorklet DSP' : 'Pending Review'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
