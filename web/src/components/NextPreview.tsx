import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { MediaItem } from '../types';

interface NextPreviewProps {
  media: MediaItem | null;
  onTake: () => void;
}

export const NextPreview: React.FC<NextPreviewProps> = ({ media, onTake }) => {
  return (
    <div className="flex flex-col rounded-lg border border-app-border bg-app-panel overflow-hidden shadow-sm">
      {/* Deck Header */}
      <div className="px-3 py-1.5 bg-accent/15 border-b border-accent/30 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-xs font-bold uppercase tracking-wider text-accent">
            PREVIEW · NEXT
          </span>
        </div>
        <span className="text-[11px] text-text-muted truncate max-w-[180px]">
          {media ? media.name : 'NO MEDIA CUED'}
        </span>
      </div>

      {/* 16:9 Viewport */}
      <div className="relative aspect-16-9 bg-black flex items-center justify-center overflow-hidden group">
        {!media ? (
          <div className="flex flex-col items-center text-text-muted text-xs">
            <span>Tidak ada media yang di-cue</span>
            <span className="text-[10px] mt-1 text-text-muted/60">
              Pilih dari Media Library atau Playlist
            </span>
          </div>
        ) : media.type === 'video' ? (
          <video
            key={media.id}
            src={media.filePath}
            preload="metadata"
            muted
            playsInline
            crossOrigin="anonymous"
            className="w-full h-full object-contain"
          />
        ) : media.type === 'image' ? (
          <img
            src={media.filePath}
            alt={media.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <iframe
            src={media.filePath}
            title={media.name}
            className="w-full h-full border-0 pointer-events-none"
            sandbox="allow-scripts allow-same-origin"
          />
        )}

        {/* Quick Take Overlay Button on Hover */}
        {media && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <button
              onClick={onTake}
              className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-lg transform transition-transform group-hover:scale-105"
            >
              <span>Take to Output</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
