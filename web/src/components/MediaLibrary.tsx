import React, { useState, useMemo } from 'react';
import {
  Film,
  Image as ImageIcon,
  Globe,
  Plus,
  Search,
  Trash2,
  Upload,
  Link as LinkIcon,
  X,
} from 'lucide-react';
import type { MediaItem, MediaType } from '../types';

interface MediaLibraryProps {
  mediaItems: MediaItem[];
  activeMediaId: string;
  nextMediaId: string;
  onCueMedia: (id: string) => void;
  onTakeMedia: (id: string) => void;
  onUploadFile: (file: File, name?: string) => Promise<unknown>;
  onAddWebUrl: (url: string, name?: string) => Promise<unknown>;
  onDeleteMedia: (id: string) => Promise<unknown>;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  mediaItems,
  activeMediaId,
  nextMediaId,
  onCueMedia,
  onTakeMedia,
  onUploadFile,
  onAddWebUrl,
  onDeleteMedia,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | MediaType>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'file' | 'web'>('file');

  // Form states for Add Modal
  const [webUrl, setWebUrl] = useState('');
  const [webName, setWebName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Filtered media items
  const filteredItems = useMemo(() => {
    return mediaItems.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesType =
        activeFilter === 'all' ? true : item.type === activeFilter;
      return matchesSearch && matchesType;
    });
  }, [mediaItems, searchQuery, activeFilter]);

  // Handle local file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await onUploadFile(file);
      setIsAddModalOpen(false);
    } catch (err) {
      alert('Gagal mengunggah file: ' + err);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Handle adding Web URL
  const handleAddWeb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webUrl) return;

    try {
      setIsUploading(true);
      await onAddWebUrl(webUrl, webName);
      setWebUrl('');
      setWebName('');
      setIsAddModalOpen(false);
    } catch (err) {
      alert('Gagal menambahkan URL: ' + err);
    } finally {
      setIsUploading(false);
    }
  };

  const getMediaBadge = (type: MediaType) => {
    switch (type) {
      case 'video':
        return (
          <span className="bg-blue-600/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center space-x-1">
            <Film className="w-2.5 h-2.5" />
            <span>VIDEO</span>
          </span>
        );
      case 'image':
        return (
          <span className="bg-emerald-600/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center space-x-1">
            <ImageIcon className="w-2.5 h-2.5" />
            <span>IMAGE</span>
          </span>
        );
      case 'web':
        return (
          <span className="bg-purple-600/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center space-x-1">
            <Globe className="w-2.5 h-2.5" />
            <span>WEB</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-app-panel border-r border-app-border select-none">
      {/* Panel Header */}
      <div className="p-3 border-b border-app-border flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary">
            Media Library
          </h2>
          <span className="text-[11px] text-text-muted">
            {mediaItems.length} media tersedia
          </span>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-2.5 py-1 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-semibold flex items-center space-x-1 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-2.5 border-b border-app-border">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-text-muted" />
          <input
            type="text"
            placeholder="Cari media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-app-bg border border-app-border rounded-md pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 mt-2">
          {(['all', 'video', 'image', 'web'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex-1 py-1 text-[11px] font-medium rounded capitalize transition-colors ${
                activeFilter === filter
                  ? 'bg-accent text-white font-semibold'
                  : 'bg-app-elevated text-text-secondary hover:bg-app-hover'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Media Items List/Grid */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-10 px-4 text-text-muted text-xs">
            Belum ada media yang cocok. Klik tombol &ldquo;Tambah&rdquo; untuk menambahkan video, gambar, atau link web.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isLive = item.id === activeMediaId;
            const isCued = item.id === nextMediaId;

            return (
              <div
                key={item.id}
                onClick={() => onCueMedia(item.id)}
                onDoubleClick={() => onTakeMedia(item.id)}
                className={`group relative rounded-lg border p-2 cursor-pointer transition-all ${
                  isLive
                    ? 'bg-status-live/10 border-status-live shadow-md shadow-status-live/10'
                    : isCued
                    ? 'bg-accent/10 border-accent shadow-md shadow-accent/10'
                    : 'bg-app-elevated border-app-border hover:border-app-hover hover:bg-app-hover/80'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  {/* Thumbnail */}
                  <div className="relative w-20 aspect-16-9 bg-black rounded overflow-hidden shrink-0 border border-app-border">
                    {item.type === 'video' ? (
                      <video
                        src={item.filePath}
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={item.thumbnailUrl || item.filePath}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=320&q=80';
                        }}
                      />
                    )}

                    {/* Media Type Badge in thumbnail corner */}
                    <div className="absolute top-1 left-1">
                      {getMediaBadge(item.type)}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">
                      {item.name}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      {isLive && (
                        <span className="text-[10px] font-bold text-status-live uppercase flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-status-live animate-pulse" />
                          <span>LIVE</span>
                        </span>
                      )}
                      {isCued && !isLive && (
                        <span className="text-[10px] font-bold text-accent uppercase flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                          <span>CUE</span>
                        </span>
                      )}
                      {!isLive && !isCued && (
                        <span className="text-[10px] text-text-muted">
                          Tap to Cue
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Delete action button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Hapus media "${item.name}"?`)) {
                        onDeleteMedia(item.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-status-live rounded hover:bg-app-bg transition-opacity"
                    title="Hapus media"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Media Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-app-panel border border-app-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-app-border flex items-center justify-between">
              <h3 className="font-semibold text-sm text-text-primary flex items-center space-x-2">
                <Plus className="w-4 h-4 text-accent" />
                <span>Tambah Media Baru</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-app-border">
              <button
                onClick={() => setAddMode('file')}
                className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center space-x-2 border-b-2 transition-colors ${
                  addMode === 'file'
                    ? 'border-accent text-accent bg-app-elevated'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File (Video / Gambar)</span>
              </button>
              <button
                onClick={() => setAddMode('web')}
                className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center space-x-2 border-b-2 transition-colors ${
                  addMode === 'web'
                    ? 'border-accent text-accent bg-app-elevated'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Web URL (Iframe)</span>
              </button>
            </div>

            <div className="p-5">
              {addMode === 'file' ? (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-app-border hover:border-accent rounded-xl p-8 transition-colors bg-app-bg text-center cursor-pointer relative">
                  <input
                    type="file"
                    accept="video/mp4,video/webm,image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-accent mb-2 animate-bounce" />
                  <p className="text-xs font-semibold text-text-primary">
                    {isUploading ? 'Sedang Mengunggah...' : 'Klik atau seret file ke sini'}
                  </p>
                  <p className="text-[11px] text-text-muted mt-1">
                    Mendukung MP4, WebM, PNG, JPG, WebP
                  </p>
                </div>
              ) : (
                <form onSubmit={handleAddWeb} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Nama / Judul Tampilan
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Live Clock / Polling Acara"
                      value={webName}
                      onChange={(e) => setWebName(e.target.value)}
                      className="w-full bg-app-bg border border-app-border rounded-md px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      URL Website (Harus mengizinkan iframe)
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com"
                      required
                      value={webUrl}
                      onChange={(e) => setWebUrl(e.target.value)}
                      className="w-full bg-app-bg border border-app-border rounded-md px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-3 py-1.5 rounded-md bg-app-elevated text-text-secondary hover:text-text-primary text-xs"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading || !webUrl}
                      className="px-4 py-1.5 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {isUploading ? 'Menyimpan...' : 'Simpan Link'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
