import React, { useState, useEffect, useRef } from 'react';
import { useMediaDeckWS } from '../hooks/useMediaDeckWS';
import { Maximize2 } from 'lucide-react';
import type { MediaItem } from '../types';

interface DeckState {
  media: MediaItem | null;
  opacity: number;
}

export const OutputDisplay: React.FC = () => {
  const { state, mediaItems, lastTakeEvent } = useMediaDeckWS('output');

  // Dual A/B Deck System
  const [deckA, setDeckA] = useState<DeckState>({ media: null, opacity: 1 });
  const [deckB, setDeckB] = useState<DeckState>({ media: null, opacity: 0 });
  const [activeDeck, setActiveDeck] = useState<'A' | 'B'>('A');

  const [isFullscreenPromptVisible, setIsFullscreenPromptVisible] = useState(true);

  const videoRefA = useRef<HTMLVideoElement | null>(null);
  const videoRefB = useRef<HTMLVideoElement | null>(null);

  // Active media resolved
  const currentActiveMedia = mediaItems.find((m) => m.id === state.activeMediaId) || null;

  // Handle Initial State on Mount or Reconnect
  useEffect(() => {
    if (currentActiveMedia && !deckA.media && !deckB.media) {
      setDeckA({ media: currentActiveMedia, opacity: 1 });
      setDeckB({ media: null, opacity: 0 });
      setActiveDeck('A');
    }
  }, [currentActiveMedia, deckA.media, deckB.media]);

  // Handle TAKE Transition (CUT or FADE)
  useEffect(() => {
    if (!lastTakeEvent) return;

    const { activeMedia: nextMedia, transition, durationMs } = lastTakeEvent;
    if (!nextMedia) return;

    if (transition === 'CUT') {
      // Instant CUT: update the current active deck directly
      if (activeDeck === 'A') {
        setDeckA({ media: nextMedia, opacity: 1 });
        setDeckB({ media: null, opacity: 0 });
      } else {
        setDeckB({ media: nextMedia, opacity: 1 });
        setDeckA({ media: null, opacity: 0 });
      }
    } else {
      // FADE Cross-fade Transition via A/B Deck
      if (activeDeck === 'A') {
        // Prepare Deck B
        setDeckB({ media: nextMedia, opacity: 0 });
        // Start cross-fade in next frame
        requestAnimationFrame(() => {
          setDeckA((prev) => ({ ...prev, opacity: 0 }));
          setDeckB((prev) => ({ ...prev, opacity: 1 }));
        });

        // After duration, finalize active deck to B
        const timer = setTimeout(() => {
          setActiveDeck('B');
          if (videoRefA.current) videoRefA.current.pause();
        }, durationMs);

        return () => clearTimeout(timer);
      } else {
        // Prepare Deck A
        setDeckA({ media: nextMedia, opacity: 0 });
        // Start cross-fade in next frame
        requestAnimationFrame(() => {
          setDeckB((prev) => ({ ...prev, opacity: 0 }));
          setDeckA((prev) => ({ ...prev, opacity: 1 }));
        });

        // After duration, finalize active deck to A
        const timer = setTimeout(() => {
          setActiveDeck('A');
          if (videoRefB.current) videoRefB.current.pause();
        }, durationMs);

        return () => clearTimeout(timer);
      }
    }
  }, [lastTakeEvent]);

  // Sync Play/Pause with active video deck
  useEffect(() => {
    const activeVideoRef = activeDeck === 'A' ? videoRefA.current : videoRefB.current;
    if (!activeVideoRef) return;

    if (state.isPlaying) {
      activeVideoRef.play().catch(() => {});
    } else {
      activeVideoRef.pause();
    }
  }, [state.isPlaying, activeDeck]);

  // Enter Fullscreen on user click (satisfies browser autoplay policy)
  const handleEnterFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    setIsFullscreenPromptVisible(false);
  };

  const renderMedia = (
    media: MediaItem | null,
    videoRef: React.RefObject<HTMLVideoElement | null>
  ) => {
    if (!media) return null;

    if (media.type === 'video') {
      return (
        <video
          ref={videoRef}
          src={media.filePath}
          loop={state.isLoop}
          playsInline
          autoPlay={state.isPlaying}
          className="w-full h-full object-contain"
        />
      );
    }

    if (media.type === 'image') {
      return (
        <img
          src={media.filePath}
          alt={media.name}
          className="w-full h-full object-contain"
        />
      );
    }

    return (
      <iframe
        src={media.filePath}
        title={media.name}
        className="w-full h-full border-0 pointer-events-auto"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    );
  };

  const transitionStyle = {
    transition: `opacity ${state.fadeDurationMs}ms ease-in-out`,
  };

  return (
    <div
      onClick={handleEnterFullscreen}
      className="relative w-screen h-screen bg-black overflow-hidden select-none cursor-none"
    >
      {/* Deck A */}
      <div
        style={transitionStyle}
        className={`absolute inset-0 flex items-center justify-center ${
          deckA.opacity === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0'
        }`}
      >
        {renderMedia(deckA.media, videoRefA)}
      </div>

      {/* Deck B */}
      <div
        style={transitionStyle}
        className={`absolute inset-0 flex items-center justify-center ${
          deckB.opacity === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0'
        }`}
      >
        {renderMedia(deckB.media, videoRefB)}
      </div>

      {/* Black Screen Emergency Layer */}
      <div
        className={`absolute inset-0 bg-black z-30 transition-opacity duration-200 pointer-events-none ${
          state.isBlackScreen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Initial Fullscreen & Audio Permission Prompt (Hides on click) */}
      {isFullscreenPromptVisible && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white cursor-pointer p-6 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4 shadow-xl shadow-accent/20">
            <Maximize2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-wide mb-1">
            MediaDeck Clean Output Screen
          </h2>
          <p className="text-sm text-text-secondary max-w-sm mb-6">
            Pindahkan jendela ini ke layar monitor kedua / proyektor eksternal, lalu klik di mana saja untuk mengaktifkan mode Fullscreen dan Audio.
          </p>
          <div className="px-5 py-2.5 rounded-full bg-accent text-white font-semibold text-xs tracking-wider uppercase shadow-lg hover:bg-accent-hover transition-colors">
            Klik untuk Aktifkan Fullscreen
          </div>
        </div>
      )}
    </div>
  );
};
