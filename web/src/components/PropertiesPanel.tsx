import React from 'react';
import { Sliders, Monitor, ExternalLink } from 'lucide-react';
import type { MediaItem } from '../types';

interface PropertiesPanelProps {
  selectedMedia: MediaItem | null;
  onOpenOutput: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedMedia,
  onOpenOutput,
}) => {
  return (
    <div className="bg-app-panel border-t border-app-border p-3 select-none">
      <div className="flex items-center space-x-1.5 mb-2.5">
        <Sliders className="w-3.5 h-3.5 text-accent" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
          Media Properties
        </h3>
      </div>

      {selectedMedia ? (
        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between py-0.5 border-b border-app-border/40">
            <span className="text-text-muted">Nama:</span>
            <span className="font-medium text-text-primary truncate max-w-[150px]">
              {selectedMedia.name}
            </span>
          </div>
          <div className="flex justify-between py-0.5 border-b border-app-border/40">
            <span className="text-text-muted">Tipe:</span>
            <span className="font-bold uppercase text-accent">
              {selectedMedia.type}
            </span>
          </div>
          <div className="flex justify-between py-0.5 border-b border-app-border/40">
            <span className="text-text-muted">Rasio Aspek:</span>
            <span className="font-mono text-text-secondary">
              {selectedMedia.aspectRatio || '16:9'} (Contain)
            </span>
          </div>
          {selectedMedia.duration > 0 && (
            <div className="flex justify-between py-0.5 border-b border-app-border/40">
              <span className="text-text-muted">Durasi:</span>
              <span className="font-mono text-text-secondary">
                {Math.round(selectedMedia.duration)}s
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-text-muted italic py-1">
          Pilih media untuk melihat informasi detail.
        </p>
      )}

      {/* Output Screen Quick Launcher */}
      <div className="mt-3 pt-2.5 border-t border-app-border">
        <button
          onClick={onOpenOutput}
          className="w-full py-2 px-3 rounded-md bg-app-elevated hover:bg-app-hover border border-app-border text-xs font-semibold text-text-primary flex items-center justify-center space-x-2 transition-colors"
        >
          <Monitor className="w-3.5 h-3.5 text-accent" />
          <span>Launch Output Window</span>
          <ExternalLink className="w-3 h-3 text-text-muted" />
        </button>
      </div>
    </div>
  );
};
