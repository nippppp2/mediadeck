import React, { useState } from 'react';
import { useMediaDeckWS } from '../hooks/useMediaDeckWS';
import {
  Radio,
  Play,
  Pause,
  ShieldAlert,
  ArrowRight,
  Upload,
  Zap,
  Sparkles,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';

export const MobileRemote: React.FC = () => {
  const {
    state,
    mediaItems,
    playlist,
    activeMedia,
    nextMedia,
    isConnected,
    outputConnected,
    cueMedia,
    takeOutput,
    play,
    pause,
    toggleBlackScreen,
    setTransition,
    uploadMediaFile,
  } = useMediaDeckWS('mobile');

  const [isUploadDrawerOpen, setIsUploadDrawerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Handle uploading media directly from smartphone gallery or camera
  const handleMobileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await uploadMediaFile(file);
      setIsUploadDrawerOpen(false);
    } catch (err) {
      alert('Gagal mengunggah file dari HP: ' + err);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const isVideo = activeMedia?.type === 'video';

  return (
    <div className="flex flex-col h-screen bg-app-bg text-text-primary select-none overflow-hidden">
      {/* Top Mobile Bar */}
      <div className="px-4 py-3 bg-app-panel border-b border-app-border flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-accent flex items-center justify-center font-bold text-white shadow">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-wider text-text-primary">
              MEDIA<span className="text-accent">DECK</span>
            </span>
            <span className="ml-1.5 text-[9px] uppercase px-1.5 py-0.2 rounded bg-app-elevated text-accent font-mono font-bold">
              REMOTE
            </span>
          </div>
        </div>

        {/* Output & Connection Status */}
        <div className="flex items-center space-x-2">
          <div
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1 border ${
              outputConnected
                ? 'bg-status-success/15 text-status-success border-status-success/30'
                : 'bg-status-warning/15 text-status-warning border-status-warning/30'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                outputConnected ? 'bg-status-success' : 'bg-status-warning'
              }`}
            />
            <span>{outputConnected ? 'SCREEN ON' : 'SCREEN OFF'}</span>
          </div>

          <div
            className={`p-1 rounded ${
              isConnected ? 'text-status-success' : 'text-status-error'
            }`}
          >
            {isConnected ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Mini Live Status Banner */}
      <div className="px-4 py-2 bg-app-elevated border-b border-app-border flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center space-x-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              state.activeMediaId
                ? 'bg-status-live animate-pulse-live'
                : 'bg-text-muted'
            }`}
          />
          <span className="font-bold text-status-live text-[11px]">LIVE:</span>
          <span className="truncate font-medium text-text-primary">
            {state.isBlackScreen
              ? '● BLACK SCREEN'
              : activeMedia?.name || 'Tidak ada'}
          </span>
        </div>

        <button
          onClick={() => setIsUploadDrawerOpen(true)}
          className="px-2 py-1 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 rounded text-[11px] font-semibold flex items-center space-x-1 shrink-0 ml-2"
        >
          <Upload className="w-3 h-3" />
          <span>Upload HP</span>
        </button>
      </div>

      {/* Virtual Deck Grid (StreamDeck style touch pads) */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center justify-between">
          <span>Virtual Quick-Deck</span>
          <span className="text-[10px] text-text-muted/70 font-normal">
            Tap to Cue / Double Tap to Take
          </span>
        </div>

        {playlist.length === 0 && mediaItems.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-xs">
            Belum ada media di playlist. Tambahkan dari laptop atau unggah dari HP.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {(playlist.length > 0 ? playlist : mediaItems.map((m, i) => ({ id: m.id, mediaId: m.id, order: i }))).map(
              (item, idx) => {
                const media = mediaItems.find((m) => m.id === item.mediaId);
                if (!media) return null;

                const isLive = media.id === state.activeMediaId;
                const isCued = media.id === state.nextMediaId;

                return (
                  <button
                    key={item.id || idx}
                    onClick={() => cueMedia(media.id)}
                    onDoubleClick={() => {
                      cueMedia(media.id);
                      setTimeout(() => takeOutput(), 50);
                    }}
                    className={`relative rounded-xl p-2.5 text-left flex flex-col justify-between aspect-[4/3] border-2 transition-all active:scale-95 shadow-md ${
                      isLive
                        ? 'bg-status-live/20 border-status-live shadow-status-live/20'
                        : isCued
                        ? 'bg-accent/20 border-accent shadow-accent/20'
                        : 'bg-app-panel border-app-border hover:border-app-hover'
                    }`}
                  >
                    {/* Top Row: Number & Status Badge */}
                    <div className="flex items-center justify-between w-full">
                      <span className="w-6 h-6 rounded-md bg-black/60 font-mono font-bold text-xs flex items-center justify-center text-text-primary">
                        {idx + 1}
                      </span>
                      {isLive && (
                        <span className="px-1.5 py-0.5 rounded bg-status-live text-white font-extrabold text-[9px] uppercase tracking-wider animate-pulse">
                          LIVE
                        </span>
                      )}
                      {isCued && !isLive && (
                        <span className="px-1.5 py-0.5 rounded bg-accent text-white font-extrabold text-[9px] uppercase tracking-wider">
                          CUE
                        </span>
                      )}
                    </div>

                    {/* Thumbnail Preview */}
                    <div className="w-full h-12 bg-black/80 rounded-md overflow-hidden my-1 border border-app-border">
                      <img
                        src={media.thumbnailUrl || media.filePath}
                        alt={media.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=320&q=80';
                        }}
                      />
                    </div>

                    {/* Title */}
                    <p className="text-xs font-bold text-text-primary truncate w-full">
                      {media.name}
                    </p>
                  </button>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* Sticky Bottom Quick-Action Bar */}
      <div className="bg-app-panel border-t border-app-border p-3 space-y-2.5 shadow-2xl shrink-0">
        {/* Top Mini Controls: Transition Mode & Black Screen & Play/Pause */}
        <div className="flex items-center justify-between space-x-2">
          {/* CUT / FADE Toggle */}
          <div className="flex bg-app-bg p-0.5 rounded-lg border border-app-border">
            <button
              onClick={() => setTransition('CUT', state.fadeDurationMs)}
              className={`px-2.5 py-1 rounded text-xs font-bold flex items-center space-x-1 ${
                state.transitionMode === 'CUT'
                  ? 'bg-accent text-white'
                  : 'text-text-muted'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>CUT</span>
            </button>
            <button
              onClick={() => setTransition('FADE', state.fadeDurationMs)}
              className={`px-2.5 py-1 rounded text-xs font-bold flex items-center space-x-1 ${
                state.transitionMode === 'FADE'
                  ? 'bg-accent text-white'
                  : 'text-text-muted'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>FADE</span>
            </button>
          </div>

          {/* Play / Pause (For Video) */}
          <button
            disabled={!isVideo}
            onClick={state.isPlaying ? pause : play}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors ${
              !isVideo
                ? 'bg-app-elevated text-text-muted opacity-40 cursor-not-allowed'
                : state.isPlaying
                ? 'bg-status-warning text-black'
                : 'bg-accent text-white'
            }`}
          >
            {state.isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>PLAY</span>
              </>
            )}
          </button>

          {/* Emergency Black Screen */}
          <button
            onClick={() => toggleBlackScreen(!state.isBlackScreen)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 border transition-all ${
              state.isBlackScreen
                ? 'bg-status-live text-white border-status-live animate-pulse'
                : 'bg-app-elevated text-text-secondary border-app-border'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{state.isBlackScreen ? 'BLACK ON' : 'BLACK'}</span>
          </button>
        </div>

        {/* Giant TAKE Button */}
        <button
          disabled={!nextMedia}
          onClick={() => takeOutput()}
          className={`w-full py-3.5 rounded-xl font-extrabold text-sm uppercase tracking-widest flex items-center justify-center space-x-2 shadow-lg transition-transform active:scale-98 ${
            !nextMedia
              ? 'bg-app-elevated text-text-muted opacity-50 cursor-not-allowed border border-app-border'
              : 'bg-gradient-to-r from-accent to-teal-500 text-white shadow-accent/25'
          }`}
        >
          <span>TAKE TO OUTPUT ({state.transitionMode})</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Upload Media Drawer from Mobile */}
      {isUploadDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end justify-center">
          <div className="bg-app-panel border-t border-app-border rounded-t-2xl w-full p-5 space-y-4 shadow-2xl max-w-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-text-primary flex items-center space-x-2">
                <Upload className="w-4 h-4 text-accent" />
                <span>Upload Media dari HP</span>
              </h3>
              <button
                onClick={() => setIsUploadDrawerOpen(false)}
                className="text-text-muted hover:text-text-primary p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-2 border-dashed border-app-border rounded-xl p-6 text-center bg-app-bg relative">
              <input
                type="file"
                accept="video/*,image/*"
                onChange={handleMobileUpload}
                disabled={isUploading}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="text-xs font-semibold text-text-primary">
                {isUploading ? 'Sedang Mengunggah...' : 'Pilih dari Galeri atau Kamera HP'}
              </p>
              <p className="text-[11px] text-text-muted mt-1">
                File otomatis tersimpan di laptop host dan siap ditayangkan.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
