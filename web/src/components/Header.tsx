import React from 'react';
import { Tv, Smartphone, ExternalLink, Wifi, WifiOff, Radio, ShieldAlert } from 'lucide-react';
import type { PlaybackState, SystemInfo } from '../types';

interface HeaderProps {
  state: PlaybackState;
  systemInfo: SystemInfo | null;
  outputConnected: boolean;
  isConnected: boolean;
  activeMediaName?: string;
  onOpenMobileQR: () => void;
  onOpenOutput: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  systemInfo,
  outputConnected,
  isConnected,
  activeMediaName,
  onOpenMobileQR,
  onOpenOutput,
}) => {
  return (
    <header className="h-14 bg-app-panel border-b border-app-border px-4 flex items-center justify-between select-none">
      {/* Brand & Identity */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-accent to-teal-700 flex items-center justify-center font-bold text-white shadow-md">
          <Radio className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-base tracking-wider text-text-primary">
              MEDIA<span className="text-accent">DECK</span>
            </span>
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-app-elevated text-text-muted border border-app-border">
              v2.0 PRO
            </span>
          </div>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="flex items-center space-x-4">
        {/* Output Connection Status */}
        <div
          onClick={onOpenOutput}
          className={`cursor-pointer px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-2 border transition-all ${
            outputConnected
              ? 'bg-status-success/10 text-status-success border-status-success/30 hover:bg-status-success/20'
              : 'bg-status-warning/10 text-status-warning border-status-warning/30 hover:bg-status-warning/20'
          }`}
          title="Click to open or inspect external output window"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              outputConnected ? 'bg-status-success' : 'bg-status-warning'
            }`}
          />
          <span>{outputConnected ? 'OUTPUT READY' : 'OUTPUT DISCONNECTED'}</span>
          <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
        </div>

        {/* Live Program Status */}
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-app-elevated border border-app-border text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              state.activeMediaId
                ? 'bg-status-live animate-pulse-live'
                : 'bg-text-muted'
            }`}
          />
          <span className="font-semibold text-text-muted">PROGRAM:</span>
          <span className="max-w-[180px] truncate font-medium text-text-primary">
            {state.isBlackScreen
              ? 'BLACK SCREEN'
              : activeMediaName || 'NO MEDIA'}
          </span>
        </div>

        {/* Black Screen Active Warning Banner */}
        {state.isBlackScreen && (
          <div className="px-2.5 py-0.5 rounded bg-status-live text-white text-xs font-bold flex items-center space-x-1 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>BLACK SCREEN ACTIVE</span>
          </div>
        )}
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center space-x-3">
        {/* Mobile Stage Remote QR Button */}
        <button
          onClick={onOpenMobileQR}
          className="px-3 py-1.5 rounded-md bg-app-elevated hover:bg-app-hover border border-app-border text-xs font-medium text-text-primary flex items-center space-x-2 transition-colors"
          title="Connect Smartphone Remote Controller via Wi-Fi Hotspot"
        >
          <Smartphone className="w-3.5 h-3.5 text-accent" />
          <span>Mobile Remote</span>
        </button>

        {/* Open Output Display Window */}
        <button
          onClick={onOpenOutput}
          className="px-3 py-1.5 rounded-md bg-app-elevated hover:bg-app-hover border border-app-border text-xs font-medium text-text-primary flex items-center space-x-2 transition-colors"
        >
          <Tv className="w-3.5 h-3.5 text-text-secondary" />
          <span>Open Output</span>
        </button>

        {/* WebSocket Connection Health Indicator */}
        <div
          className={`flex items-center space-x-1.5 text-xs px-2 py-1 rounded ${
            isConnected ? 'text-status-success' : 'text-status-error'
          }`}
          title={
            isConnected
              ? `Connected to Go Server (${systemInfo?.localIps?.[0] || 'localhost'}:${systemInfo?.port || 8080})`
              : 'Reconnecting to Server...'
          }
        >
          {isConnected ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          )}
          <span className="hidden md:inline">{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
      </div>
    </header>
  );
};
