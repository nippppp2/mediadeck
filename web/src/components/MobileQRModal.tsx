import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Smartphone, Copy, Check, Wifi, ExternalLink } from 'lucide-react';
import type { SystemInfo } from '../types';

interface MobileQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemInfo: SystemInfo | null;
}

export const MobileQRModal: React.FC<MobileQRModalProps> = ({
  isOpen,
  onClose,
  systemInfo,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const remoteUrl =
    systemInfo?.mobileRemoteUrl ||
    `http://${window.location.hostname}:8080/remote`;

  const handleCopy = () => {
    navigator.clipboard.writeText(remoteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-app-panel border border-app-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-app-border flex items-center justify-between">
          <div className="flex items-center space-x-2 text-text-primary">
            <Smartphone className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-base">Mobile Stage Remote</h3>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1 rounded-md hover:bg-app-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col items-center text-center">
          {/* Instructions */}
          <div className="mb-4 text-xs text-text-secondary max-w-xs flex items-center justify-center space-x-1.5 bg-app-elevated px-3 py-2 rounded-lg border border-app-border">
            <Wifi className="w-4 h-4 text-accent shrink-0" />
            <span>Sambungkan HP ke Hotspot Wi-Fi Laptop, lalu scan QR di bawah ini:</span>
          </div>

          {/* QR Code Canvas */}
          <div className="p-4 bg-white rounded-xl shadow-lg border-4 border-accent/20 mb-4 inline-block">
            <QRCodeSVG
              value={remoteUrl}
              size={200}
              level="M"
              includeMargin={false}
            />
          </div>

          {/* URL Pill & Copy Button */}
          <div className="w-full flex items-center space-x-2 bg-app-bg px-3 py-2 rounded-lg border border-app-border mb-4">
            <input
              type="text"
              readOnly
              value={remoteUrl}
              className="bg-transparent text-xs text-text-primary font-mono w-full focus:outline-none select-all"
            />
            <button
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-app-hover text-text-muted hover:text-text-primary transition-colors shrink-0"
              title="Copy URL"
            >
              {copied ? (
                <Check className="w-4 h-4 text-status-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Direct link in case testing on same machine */}
          <a
            href={remoteUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-accent hover:underline flex items-center space-x-1"
          >
            <span>Buka Web Remote di tab baru</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-app-elevated border-t border-app-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-semibold transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
