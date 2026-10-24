export type MediaType = 'video' | 'image' | 'web';
export type TransitionMode = 'CUT' | 'FADE';

export interface MediaItem {
  id: string;
  name: string;
  type: MediaType;
  filePath: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  aspectRatio?: string;
  createdAt: number;
}

export interface PlaylistItem {
  id: string;
  mediaId: string;
  order: number;
}

export interface PlaybackState {
  activeMediaId: string;
  nextMediaId: string;
  transitionMode: TransitionMode;
  fadeDurationMs: number;
  isPlaying: boolean;
  isLoop: boolean;
  isBlackScreen: boolean;
  currentTime: number;
  updatedAt: number;
}

export interface SystemInfo {
  localIps: string[];
  port: number;
  mobileRemoteUrl: string;
  outputDisplayUrl: string;
  dashboardUrl: string;
  connectedClients: number;
  outputConnected: boolean;
}

export interface WSMessage<T = unknown> {
  type: string;
  payload?: T;
  timestamp: number;
}
