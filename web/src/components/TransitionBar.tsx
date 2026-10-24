import React from 'react';
import { Zap, Sparkles } from 'lucide-react';
import type { TransitionMode } from '../types';

interface TransitionBarProps {
  mode: TransitionMode;
  durationMs: number;
  onSetTransition: (mode: TransitionMode, durationMs: number) => void;
}

export const TransitionBar: React.FC<TransitionBarProps> = ({
  mode,
  durationMs,
  onSetTransition,
}) => {
  const durations = [
    { label: '250ms', value: 250 },
    { label: '500ms', value: 500 },
    { label: '1s', value: 1000 },
    { label: '2s', value: 2000 },
  ];

  return (
    <div className="bg-app-panel border border-app-border rounded-lg p-2.5 flex items-center justify-between select-none">
      <div className="flex items-center space-x-2">
        <span className="text-[11px] font-bold uppercase text-text-muted mr-1">
          Transition:
        </span>

        {/* Segmented Mode Toggles */}
        <div className="flex bg-app-bg p-0.5 rounded-lg border border-app-border">
          <button
            onClick={() => onSetTransition('CUT', durationMs)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold tracking-wider flex items-center space-x-1.5 transition-all ${
              mode === 'CUT'
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>CUT</span>
          </button>

          <button
            onClick={() => onSetTransition('FADE', durationMs)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold tracking-wider flex items-center space-x-1.5 transition-all ${
              mode === 'FADE'
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>FADE</span>
          </button>
        </div>
      </div>

      {/* Fade Durations (Shown when FADE is selected or enabled) */}
      <div className="flex items-center space-x-1.5">
        <span className="text-[10px] text-text-muted mr-1">Durasi:</span>
        {durations.map((d) => (
          <button
            key={d.value}
            disabled={mode !== 'FADE'}
            onClick={() => onSetTransition('FADE', d.value)}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
              mode === 'FADE' && durationMs === d.value
                ? 'bg-accent text-white font-bold'
                : 'bg-app-elevated text-text-muted hover:text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
};
