import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronRight, Power } from 'lucide-react';

interface SubModuleContainerProps {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  enabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  groupColor: 'amber' | 'cyan';
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}

export const SubModuleContainer: React.FC<SubModuleContainerProps> = ({
  title,
  subtitle,
  icon: Icon,
  enabled,
  onToggleEnabled,
  groupColor,
  children,
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(defaultCollapsed);
  const lastTapRef = useRef<number>(0);

  // Handle double-tap on mobile/touch screens
  const handleTouchEnd = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setIsCollapsed((prev) => !prev);
    }
    lastTapRef.current = now;
  };

  const handleDoubleClick = () => {
    setIsCollapsed((prev) => !prev);
  };

  const isAmber = groupColor === 'amber';

  // Dynamic styling based on group color and enabled state
  const containerClasses = enabled
    ? isAmber
      ? 'bg-amber-950/15 border-amber-500/30 hover:border-amber-500/50'
      : 'bg-cyan-950/15 border-cyan-500/30 hover:border-cyan-500/50'
    : 'bg-zinc-900/30 border-zinc-800/80 opacity-60';

  const headerTextClasses = enabled
    ? isAmber
      ? 'text-amber-300'
      : 'text-cyan-300'
    : 'text-zinc-500';

  const iconClasses = enabled
    ? isAmber
      ? 'text-amber-400 bg-amber-500/15 border-amber-500/30'
      : 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30'
    : 'text-zinc-600 bg-zinc-800/50 border-zinc-800';

  const switchActiveClasses = isAmber
    ? 'bg-amber-500 text-black border-amber-400 font-bold'
    : 'bg-cyan-400 text-black border-cyan-300 font-bold';

  return (
    <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${containerClasses}`}>
      {/* Header bar - double tap / double click to expand/collapse */}
      <div
        onDoubleClick={handleDoubleClick}
        onTouchEnd={handleTouchEnd}
        className="px-3 py-2.5 bg-zinc-900/70 border-b border-zinc-800/60 flex items-center justify-between gap-2 cursor-pointer select-none"
        title="Double-click header to collapse / expand sub-module"
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="p-0.5 text-zinc-500 hover:text-zinc-200 transition-colors"
            title={isCollapsed ? 'Expand sub-module' : 'Collapse sub-module'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border ${iconClasses}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>

          <div className="flex flex-col min-w-0">
            <span className={`text-xs font-mono font-bold uppercase tracking-wider truncate ${headerTextClasses}`}>
              {title}
            </span>
            {subtitle && (
              <span className="text-[10px] font-mono text-zinc-500 truncate">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Small Enable/Disable Switch (Requirement 4) */}
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onToggleEnabled(!enabled)}
            className={`px-2 py-0.5 text-[10px] font-mono rounded flex items-center gap-1 border transition-colors ${
              enabled
                ? switchActiveClasses
                : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300'
            }`}
            title={enabled ? 'Disable this acoustic source' : 'Enable this acoustic source'}
          >
            <Power className="w-2.5 h-2.5" />
            <span>{enabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Body content (collapsible) */}
      {!isCollapsed && (
        <div className={`p-3 space-y-2.5 transition-opacity ${enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          {children}
        </div>
      )}
    </div>
  );
};
