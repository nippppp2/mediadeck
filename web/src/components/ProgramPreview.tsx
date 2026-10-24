import React, { useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import type { MediaItem } from '../types';

interface ProgramPreviewProps {
  media: MediaItem | null;
  isPlaying: boolean;
  isLoop: boolean;
  isBlackScreen: boolean;
  outputConnected: boolean;
}

export const ProgramPreview: React.FC<ProgramPreviewProps> = ({
  media,
  isPlaying,
  isLoop,
  isBlackScreen,
  outputConnected,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sync video play/pause with state
  useEffect(() => {
    if (!videoRef.current || !media || media.type !== 'video') return;

    if (isPlaying) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, media]);

  return (
    <div className="flex flex-col rounded-lg border border-app-border bg-app-panel overflow-hidden shadow-sm">
      {/* Deck Header */}
      <div className="px-3 py-1.5 bg-status-live/15 border-b border-status-live/30 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-status-live animate-pulse-live" />
          <span className="text-xs font-bold uppercase tracking-wider text-status-live">
            PROGRAM · OUTPUT
          </span>
        </div>
        <span className="text-[11px] text-text-muted truncate max-w-[180px]">
          {isBlackScreen ? 'BLACK SCREEN' : media ? media.name : 'NO MEDIA'}
        </span>
      </div>

      {/* 16:9 Viewport */}
      <div className="relative aspect-16-9 bg-black flex items-center justify-center overflow-hidden">
        {isBlackScreen ? (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-status-live">
            <span className="text-xs font-bold tracking-widest px-3 py-1 bg-status-live/20 border border-status-live/40 rounded">
              BLACK SCREEN ACTIVE
            </span>
          </div>
        ) : !media ? (
          <div className="flex flex-col items-center text-text-muted text-xs">
            <span>Tidak ada media aktif</span>
            <span className="text-[10px] mt-1 text-text-muted/60">
              Pilih media di Next Preview dan tekan TAKE
            </span>
          </div>
        ) : media.type === 'video' ? (
          <video
            ref={videoRef}
            src={media.filePath}
            loop={isLoop}
            muted
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

        {/* Output Disconnected Overlay Warning */}
        {!outputConnected && (
          <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded bg-black/80 backdrop-blur-sm border border-status-warning/40 text-status-warning text-[10px] font-semibold flex items-center space-x-1">
            <AlertCircle className="w-3 h-3" />
            <span>Output Display Window Tutup</span>
          </div>
        )}
      </div>
    </div>
  );
};
