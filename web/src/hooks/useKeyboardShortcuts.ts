import { useEffect } from 'react';

interface KeyboardOptions {
  onPlayPause: () => void;
  onTake: () => void;
  onSelectCut: () => void;
  onSelectFade: () => void;
  onToggleBlack: () => void;
  onToggleLoop: () => void;
  onNextMedia: () => void;
  onPrevMedia: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onPlayPause,
  onTake,
  onSelectCut,
  onSelectFade,
  onToggleBlack,
  onToggleLoop,
  onNextMedia,
  onPrevMedia,
  enabled = true,
}: KeyboardOptions) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Safety guard: ignore if user is typing in input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          onPlayPause();
          break;
        case 'Enter':
          e.preventDefault();
          onTake();
          break;
        case 'KeyC':
          onSelectCut();
          break;
        case 'KeyF':
          onSelectFade();
          break;
        case 'KeyB':
          onToggleBlack();
          break;
        case 'KeyL':
          onToggleLoop();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNextMedia();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrevMedia();
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    onPlayPause,
    onTake,
    onSelectCut,
    onSelectFade,
    onToggleBlack,
    onToggleLoop,
    onNextMedia,
    onPrevMedia,
  ]);
}
