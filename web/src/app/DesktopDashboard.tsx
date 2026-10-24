import React, { useState } from 'react';
import { useMediaDeckWS } from '../hooks/useMediaDeckWS';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { Header } from '../components/Header';
import { MediaLibrary } from '../components/MediaLibrary';
import { ProgramPreview } from '../components/ProgramPreview';
import { NextPreview } from '../components/NextPreview';
import { TransitionBar } from '../components/TransitionBar';
import { PlaybackControls } from '../components/PlaybackControls';
import { PlaylistPanel } from '../components/PlaylistPanel';
import { PropertiesPanel } from '../components/PropertiesPanel';
import { MobileQRModal } from '../components/MobileQRModal';

export const DesktopDashboard: React.FC = () => {
  const {
    state,
    mediaItems,
    playlist,
    systemInfo,
    isConnected,
    outputConnected,
    activeMedia,
    nextMedia,
    cueMedia,
    takeOutput,
    play,
    pause,
    toggleLoop,
    toggleBlackScreen,
    setTransition,
    uploadMediaFile,
    addWebMediaItem,
    deleteMediaItem,
    updatePlaylistOrder,
    addToPlaylist,
  } = useMediaDeckWS('dashboard');

  const [isMobileQRModalOpen, setIsMobileQRModalOpen] = useState(false);

  // Open clean output window
  const handleOpenOutput = () => {
    const width = 1280;
    const height = 720;
    const left = window.screen.width ? window.screen.width : 0;
    window.open(
      '/output',
      'MediaDeckOutputWindow',
      `width=${width},height=${height},left=${left},top=0,menubar=no,toolbar=no,location=no,status=no`
    );
  };

  // Keyboard navigation helpers
  const handleNextMedia = () => {
    if (playlist.length === 0) return;
    const currentIndex = playlist.findIndex((p) => p.mediaId === state.nextMediaId);
    const nextIndex = (currentIndex + 1) % playlist.length;
    cueMedia(playlist[nextIndex].mediaId);
  };

  const handlePrevMedia = () => {
    if (playlist.length === 0) return;
    const currentIndex = playlist.findIndex((p) => p.mediaId === state.nextMediaId);
    const prevIndex = currentIndex <= 0 ? playlist.length - 1 : currentIndex - 1;
    cueMedia(playlist[prevIndex].mediaId);
  };

  // Register Keyboard Shortcuts
  useKeyboardShortcuts({
    onPlayPause: () => (state.isPlaying ? pause() : play()),
    onTake: () => takeOutput(),
    onSelectCut: () => setTransition('CUT', state.fadeDurationMs),
    onSelectFade: () => setTransition('FADE', state.fadeDurationMs),
    onToggleBlack: () => toggleBlackScreen(!state.isBlackScreen),
    onToggleLoop: () => toggleLoop(!state.isLoop),
    onNextMedia: handleNextMedia,
    onPrevMedia: handlePrevMedia,
  });

  return (
    <div className="flex flex-col h-screen bg-app-bg text-text-primary overflow-hidden">
      {/* Top Header */}
      <Header
        state={state}
        systemInfo={systemInfo}
        outputConnected={outputConnected}
        isConnected={isConnected}
        activeMediaName={activeMedia?.name}
        onOpenMobileQR={() => setIsMobileQRModalOpen(true)}
        onOpenOutput={handleOpenOutput}
      />

      {/* Main 3-Column Work Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Kolom Kiri: Media Library (280px) */}
        <div className="w-72 shrink-0 h-full">
          <MediaLibrary
            mediaItems={mediaItems}
            activeMediaId={state.activeMediaId}
            nextMediaId={state.nextMediaId}
            onCueMedia={cueMedia}
            onTakeMedia={(id) => {
              cueMedia(id);
              setTimeout(() => takeOutput(), 50);
            }}
            onUploadFile={uploadMediaFile}
            onAddWebUrl={addWebMediaItem}
            onDeleteMedia={deleteMediaItem}
          />
        </div>

        {/* Kolom Tengah: Dual Preview, Transition, Playback Controls */}
        <div className="flex-1 flex flex-col p-3 overflow-y-auto space-y-3 bg-app-bg">
          {/* Dual Previews Grid (Program LIVE vs Next CUE) */}
          <div className="grid grid-cols-2 gap-3 flex-1 min-h-[260px]">
            <ProgramPreview
              media={activeMedia}
              isPlaying={state.isPlaying}
              isLoop={state.isLoop}
              isBlackScreen={state.isBlackScreen}
              outputConnected={outputConnected}
            />
            <NextPreview
              media={nextMedia}
              onTake={() => takeOutput()}
            />
          </div>

          {/* Transition Bar */}
          <TransitionBar
            mode={state.transitionMode}
            durationMs={state.fadeDurationMs}
            onSetTransition={setTransition}
          />

          {/* Playback Controls & Giant Take Button */}
          <PlaybackControls
            activeMedia={activeMedia}
            nextMedia={nextMedia}
            isPlaying={state.isPlaying}
            isLoop={state.isLoop}
            isBlackScreen={state.isBlackScreen}
            transitionMode={state.transitionMode}
            onPlay={play}
            onPause={pause}
            onToggleLoop={toggleLoop}
            onToggleBlack={toggleBlackScreen}
            onTake={() => takeOutput()}
          />
        </div>

        {/* Kolom Kanan: Playlist & Properties (280px) */}
        <div className="w-72 shrink-0 h-full flex flex-col">
          <div className="flex-1 overflow-hidden">
            <PlaylistPanel
              playlist={playlist}
              mediaItems={mediaItems}
              activeMediaId={state.activeMediaId}
              nextMediaId={state.nextMediaId}
              onCueMedia={cueMedia}
              onTakeMedia={(id) => {
                cueMedia(id);
                setTimeout(() => takeOutput(), 50);
              }}
              onReorder={updatePlaylistOrder}
              onRemoveFromPlaylist={(index) => {
                const copy = playlist.filter((_, idx) => idx !== index);
                copy.forEach((item, idx) => (item.order = idx));
                updatePlaylistOrder(copy);
              }}
              onAddCurrentToPlaylist={() => {
                if (state.nextMediaId) addToPlaylist(state.nextMediaId);
              }}
            />
          </div>

          {/* Media Properties & Output Quick Launch */}
          <PropertiesPanel
            selectedMedia={nextMedia || activeMedia}
            onOpenOutput={handleOpenOutput}
          />
        </div>
      </div>

      {/* Mobile QR Modal */}
      <MobileQRModal
        isOpen={isMobileQRModalOpen}
        onClose={() => setIsMobileQRModalOpen(false)}
        systemInfo={systemInfo}
      />
    </div>
  );
};
