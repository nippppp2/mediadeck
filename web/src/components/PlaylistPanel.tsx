import React from 'react';
import { ListOrdered, ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react';
import type { PlaylistItem, MediaItem } from '../types';

interface PlaylistPanelProps {
  playlist: PlaylistItem[];
  mediaItems: MediaItem[];
  activeMediaId: string;
  nextMediaId: string;
  onCueMedia: (id: string) => void;
  onTakeMedia: (id: string) => void;
  onReorder: (newPlaylist: PlaylistItem[]) => void;
  onRemoveFromPlaylist: (index: number) => void;
  onAddCurrentToPlaylist: () => void;
}

export const PlaylistPanel: React.FC<PlaylistPanelProps> = ({
  playlist,
  mediaItems,
  activeMediaId,
  nextMediaId,
  onCueMedia,
  onTakeMedia,
  onReorder,
  onRemoveFromPlaylist,
  onAddCurrentToPlaylist,
}) => {
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= playlist.length) return;

    const copy = [...playlist];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    // re-assign orders
    copy.forEach((item, idx) => {
      item.order = idx;
    });

    onReorder(copy);
  };

  return (
    <div className="flex flex-col h-full bg-app-panel border-l border-app-border select-none">
      {/* Header */}
      <div className="p-3 border-b border-app-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ListOrdered className="w-4 h-4 text-accent" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary">
            Playlist Acara
          </h2>
        </div>
        <button
          onClick={onAddCurrentToPlaylist}
          disabled={!nextMediaId}
          className="px-2 py-1 rounded bg-app-elevated hover:bg-app-hover disabled:opacity-40 disabled:cursor-not-allowed border border-app-border text-[11px] font-medium text-text-primary flex items-center space-x-1"
          title="Tambahkan media yang sedang di-cue ke akhir playlist"
        >
          <Plus className="w-3 h-3 text-accent" />
          <span>Tambah Cue</span>
        </button>
      </div>

      {/* Playlist Items */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {playlist.length === 0 ? (
          <div className="text-center py-10 px-4 text-text-muted text-xs">
            Playlist masih kosong. Pilih media lalu klik &ldquo;Tambah Cue&rdquo; untuk menyusun alur penayangan acara.
          </div>
        ) : (
          playlist.map((item, index) => {
            const media = mediaItems.find((m) => m.id === item.mediaId);
            if (!media) return null;

            const isLive = media.id === activeMediaId;
            const isCued = media.id === nextMediaId;

            return (
              <div
                key={item.id || index}
                onClick={() => onCueMedia(media.id)}
                onDoubleClick={() => onTakeMedia(media.id)}
                className={`group flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                  isLive
                    ? 'bg-status-live/15 border-status-live shadow-sm'
                    : isCued
                    ? 'bg-accent/15 border-accent shadow-sm'
                    : 'bg-app-elevated border-app-border hover:bg-app-hover'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  {/* Order Index */}
                  <span className="w-5 text-center font-mono font-bold text-[11px] text-text-muted shrink-0">
                    {index + 1}
                  </span>

                  {/* Thumbnail */}
                  <div className="w-10 h-6 bg-black rounded overflow-hidden shrink-0 border border-app-border">
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

                  {/* Title & Status */}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-primary truncate">
                      {media.name}
                    </p>
                    <div className="flex items-center space-x-1.5 text-[10px]">
                      {isLive && (
                        <span className="text-status-live font-bold uppercase">
                          LIVE
                        </span>
                      )}
                      {isCued && !isLive && (
                        <span className="text-accent font-bold uppercase">
                          NEXT
                        </span>
                      )}
                      <span className="text-text-muted uppercase">
                        {media.type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions on hover */}
                <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveItem(index, 'up');
                    }}
                    className="p-1 text-text-muted hover:text-text-primary disabled:opacity-20"
                    title="Naikkan urutan"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={index === playlist.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveItem(index, 'down');
                    }}
                    className="p-1 text-text-muted hover:text-text-primary disabled:opacity-20"
                    title="Turunkan urutan"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFromPlaylist(index);
                    }}
                    className="p-1 text-text-muted hover:text-status-live"
                    title="Hapus dari playlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
