import React from 'react';
import { Play, Pause, Repeat, ShieldAlert, ArrowRight } from 'lucide-react';
import type { MediaItem, TransitionMode } from '../types';

interface PlaybackControlsProps {
  activeMedia: MediaItem | null;
  nextMedia: MediaItem | null;
  isPlaying: boolean;
  isLoop: boolean;
  isBlackScreen: boolean;
  transitionMode: TransitionMode;
  onPlay: () => void;
  onPause: () => void;
  onToggleLoop: (enabled: boolean) => void;
  onToggleBlack: (enabled: boolean) => void;
  onTake: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  activeMedia,
  nextMedia,
  isPlaying,
  isLoop,
  isBlackScreen,
  transitionMode,
  onPlay,
  onPause,
  onToggleLoop,
  onToggleBlack,
  onTake,
}) => {
  const isVideo = activeMedia?.type === 'video';

  return (
    <div className="bg-app-panel border border-app-border rounded-lg p-3 flex items-center justify-between select-none">
      {/* Video & Output State Controls */}
      <div className="flex items-center space-x-2">
        {/* Play / Pause Toggle */}
        <button
          disabled={!isVideo}
          onClick={isPlaying ? onPause : onPlay}
          className={`px-3.5 py-2 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm ${
            !isVideo
              ? 'bg-app-elevated text-text-muted opacity-50 cursor-not-allowed'
              : isPlaying
              ? 'bg-status-warning text-black hover:bg-yellow-400'
              : 'bg-accent text-white hover:bg-accent-hover'
          }`}
          title={isVideo ? (isPlaying ? 'Pause Video (Space)' : 'Play Video (Space)') : 'Bukan file video'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>PLAY</span>
            </>
          )}
        </button>

        {/* Loop Toggle */}
        <button
          onClick={() => onToggleLoop(!isLoop)}
          className={`px-3 py-2 rounded-md text-xs font-medium flex items-center space-x-1.5 border transition-all ${
            isLoop
              ? 'bg-accent/15 text-accent border-accent/40 font-semibold'
              : 'bg-app-elevated text-text-muted border-app-border hover:text-text-primary'
          }`}
          title="Ulang Video Otomatis (L)"
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>LOOP</span>
        </button>

        {/* Black Screen Toggle */}
        <button
          onClick={() => onToggleBlack(!isBlackScreen)}
          className={`px-3.5 py-2 rounded-md text-xs font-bold tracking-wider flex items-center space-x-1.5 border transition-all ${
            isBlackScreen
              ? 'bg-status-live text-white border-status-live animate-pulse shadow-md shadow-status-live/20'
              : 'bg-app-elevated text-text-secondary border-app-border hover:border-status-live hover:text-status-live'
          }`}
          title="Menghitamkan Output Layar Panggung (B)"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{isBlackScreen ? 'BLACK ON' : 'BLACK SCREEN'}</span>
        </button>
      </div>

      {/* Main TAKE Button */}
      <button
        disabled={!nextMedia}
        onClick={onTake}
        className={`px-6 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-widest flex items-center space-x-2 transition-all shadow-lg ${
          !nextMedia
            ? 'bg-app-elevated text-text-muted opacity-50 cursor-not-allowed border border-app-border'
            : 'bg-gradient-to-r from-accent to-teal-500 hover:from-teal-400 hover:to-teal-500 text-white transform hover:scale-102 active:scale-98 shadow-accent/25'
        }`}
        title="Kirim Next Preview ke Layar Output (Enter)"
      >
        <span>TAKE {transitionMode}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
