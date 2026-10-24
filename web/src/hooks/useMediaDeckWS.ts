import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { MediaItem, PlaylistItem, PlaybackState, SystemInfo, WSMessage, TransitionMode } from '../types';

export function useMediaDeckWS(clientType: 'dashboard' | 'mobile' | 'output' = 'dashboard') {
  const [state, setState] = useState<PlaybackState>({
    activeMediaId: '',
    nextMediaId: '',
    transitionMode: 'CUT',
    fadeDurationMs: 500,
    isPlaying: false,
    isLoop: true,
    isBlackScreen: false,
    currentTime: 0,
    updatedAt: 0,
  });

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [outputConnected, setOutputConnected] = useState(false);
  const [lastTakeEvent, setLastTakeEvent] = useState<{
    activeMedia: MediaItem;
    transition: TransitionMode;
    durationMs: number;
    state: PlaybackState;
  } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Determine API & WS host
  const getBackendBase = useCallback(() => {
    const isDev = window.location.port === '5173';
    const host = isDev ? 'localhost:8080' : window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return {
      httpBase: `${protocol}//${host}`,
      wsUrl: `${wsProtocol}//${host}/ws?clientType=${clientType}`,
    };
  }, [clientType]);

  const { httpBase, wsUrl } = getBackendBase();

  // Send WS message helper
  const sendMessage = useCallback((type: string, payload?: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload, timestamp: Date.now() }));
    }
  }, []);

  // Fetch initial system info via REST
  const refreshSystemInfo = useCallback(async () => {
    try {
      const res = await fetch(`${httpBase}/api/system/info`);
      if (res.ok) {
        const data: SystemInfo = await res.json();
        setSystemInfo(data);
        setOutputConnected(data.outputConnected);
      }
    } catch {
      // Backend may be offline or starting
    }
  }, [httpBase]);

  // Connect WebSocket
  useEffect(() => {
    let unmounted = false;

    function connect() {
      if (unmounted) return;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (unmounted) return;
          setIsConnected(true);
          refreshSystemInfo();
        };

        ws.onclose = () => {
          if (unmounted) return;
          setIsConnected(false);
          wsRef.current = null;
          // Reconnect every 2 seconds
          reconnectTimeoutRef.current = window.setTimeout(connect, 2000);
        };

        ws.onerror = () => {
          ws.close();
        };

        ws.onmessage = (event) => {
          if (unmounted) return;
          try {
            const lines = event.data.split('\n');
            for (const line of lines) {
              if (!line.trim()) continue;
              const msg: WSMessage = JSON.parse(line);

              switch (msg.type) {
                case 'STATE_SNAPSHOT': {
                  const snap = msg.payload as {
                    state: PlaybackState;
                    mediaItems: MediaItem[];
                    playlist: PlaylistItem[];
                    outputConnected: boolean;
                  };
                  if (snap.state) setState(snap.state);
                  if (snap.mediaItems) setMediaItems(snap.mediaItems);
                  if (snap.playlist) setPlaylist(snap.playlist);
                  if (snap.outputConnected !== undefined) setOutputConnected(snap.outputConnected);
                  break;
                }
                case 'STATE_CHANGED': {
                  setState(msg.payload as PlaybackState);
                  break;
                }
                case 'TAKE_EXECUTED': {
                  const takeData = msg.payload as {
                    activeMedia: MediaItem;
                    transition: TransitionMode;
                    durationMs: number;
                    state: PlaybackState;
                  };
                  setLastTakeEvent(takeData);
                  setState(takeData.state);
                  break;
                }
                case 'MEDIA_ADDED': {
                  const newItem = msg.payload as MediaItem;
                  setMediaItems((prev) => {
                    const exists = prev.some((m) => m.id === newItem.id);
                    return exists ? prev.map((m) => (m.id === newItem.id ? newItem : m)) : [...prev, newItem];
                  });
                  break;
                }
                case 'MEDIA_DELETED': {
                  const { id } = msg.payload as { id: string };
                  setMediaItems((prev) => prev.filter((m) => m.id !== id));
                  break;
                }
                case 'PLAYLIST_UPDATED': {
                  setPlaylist(msg.payload as PlaylistItem[]);
                  break;
                }
                case 'OUTPUT_STATUS': {
                  const outStatus = msg.payload as { outputConnected: boolean; connectedClients: number };
                  setOutputConnected(outStatus.outputConnected);
                  setSystemInfo((prev) => prev ? { ...prev, ...outStatus } : null);
                  break;
                }
                case 'PLAYBACK_CMD': {
                  const cmd = msg.payload as { command: 'PLAY' | 'PAUSE' };
                  setState((prev) => ({ ...prev, isPlaying: cmd.command === 'PLAY' }));
                  break;
                }
              }
            }
          } catch (e) {
            console.error('Failed to parse WS message', e);
          }
        };
      } catch (err) {
        console.error('WS Connection error', err);
        reconnectTimeoutRef.current = window.setTimeout(connect, 2000);
      }
    }

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [wsUrl, refreshSystemInfo]);

  // Active & Next Media objects
  const activeMedia = useMemo(() => {
    return mediaItems.find((m) => m.id === state.activeMediaId) || null;
  }, [mediaItems, state.activeMediaId]);

  const nextMedia = useMemo(() => {
    return mediaItems.find((m) => m.id === state.nextMediaId) || null;
  }, [mediaItems, state.nextMediaId]);

  // Actions
  const cueMedia = useCallback((mediaId: string) => {
    sendMessage('CUE_MEDIA', { mediaId });
  }, [sendMessage]);

  const takeOutput = useCallback((transition?: TransitionMode, durationMs?: number) => {
    sendMessage('TAKE_OUTPUT', {
      transition: transition || state.transitionMode,
      durationMs: durationMs || state.fadeDurationMs,
    });
  }, [sendMessage, state.transitionMode, state.fadeDurationMs]);

  const play = useCallback(() => sendMessage('PLAY'), [sendMessage]);
  const pause = useCallback(() => sendMessage('PAUSE'), [sendMessage]);

  const toggleLoop = useCallback((enabled: boolean) => {
    sendMessage('TOGGLE_LOOP', { enabled });
  }, [sendMessage]);

  const toggleBlackScreen = useCallback((enabled: boolean) => {
    sendMessage('TOGGLE_BLACK', { enabled });
  }, [sendMessage]);

  const setTransition = useCallback((mode: TransitionMode, durationMs: number) => {
    sendMessage('SET_TRANSITION', { mode, durationMs });
  }, [sendMessage]);

  const seek = useCallback((timeSeconds: number) => {
    sendMessage('SEEK', { timeSeconds });
  }, [sendMessage]);

  // File Upload via REST
  const uploadMediaFile = useCallback(async (file: File, customName?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (customName) formData.append('name', customName);

    const res = await fetch(`${httpBase}/api/media`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload file');
    const created: MediaItem = await res.json();
    return created;
  }, [httpBase]);

  // Add Web URL via REST
  const addWebMediaItem = useCallback(async (url: string, name?: string) => {
    const res = await fetch(`${httpBase}/api/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name || url,
        type: 'web',
        url,
      }),
    });
    if (!res.ok) throw new Error('Failed to add web media');
    const created: MediaItem = await res.json();
    return created;
  }, [httpBase]);

  // Delete Media via REST
  const deleteMediaItem = useCallback(async (id: string) => {
    const res = await fetch(`${httpBase}/api/media/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete media');
  }, [httpBase]);

  // Update Playlist via REST
  const updatePlaylistOrder = useCallback(async (newPlaylist: PlaylistItem[]) => {
    const res = await fetch(`${httpBase}/api/playlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPlaylist),
    });
    if (!res.ok) throw new Error('Failed to update playlist');
  }, [httpBase]);

  // Add To Playlist via REST
  const addToPlaylist = useCallback(async (mediaId: string) => {
    const res = await fetch(`${httpBase}/api/playlist/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaId }),
    });
    if (!res.ok) throw new Error('Failed to add to playlist');
  }, [httpBase]);

  return {
    state,
    mediaItems,
    playlist,
    systemInfo,
    isConnected,
    outputConnected,
    activeMedia,
    nextMedia,
    lastTakeEvent,
    httpBase,
    cueMedia,
    takeOutput,
    play,
    pause,
    toggleLoop,
    toggleBlackScreen,
    setTransition,
    seek,
    uploadMediaFile,
    addWebMediaItem,
    deleteMediaItem,
    updatePlaylistOrder,
    addToPlaylist,
    refreshSystemInfo,
  };
}
