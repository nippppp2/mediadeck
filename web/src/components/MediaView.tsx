import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { MediaItem } from '../types';

export const fmtTime = (s: number) => {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

interface Props {
  item: MediaItem | null | undefined;
  fit?: 'contain' | 'cover';
  muted?: boolean;
  playing?: boolean;
  loop?: boolean;
  time?: number;
  seekId?: number;
  onReady?: () => void;
  videoRef?: RefObject<HTMLVideoElement | null>;
}

/** Render satu media (video/gambar/web). Dipakai preview dashboard & deck output. */
export function MediaView({ item, fit = 'contain', muted = true, playing = false, loop = false, time = 0, seekId = 0, onReady, videoRef }: Props) {
  const internal = useRef<HTMLVideoElement>(null);
  const ref = videoRef ?? internal;

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (playing) v.play().catch(() => {}); else v.pause();
  }, [playing, item?.id, ref]);

  useEffect(() => {
    const v = ref.current;
    if (v && Math.abs(v.currentTime - time) > 1.5) v.currentTime = time;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seekId, item?.id]);

  // Lepas buffer video saat media diganti/unmount (cegah memory leak pada acara panjang).
  useEffect(() => {
    const v = ref.current;
    return () => { if (v) { v.pause(); v.removeAttribute('src'); v.load(); } };
  }, [item?.id, ref]);

  if (!item) return <div className="h-full w-full bg-black" />;
  const style = { objectFit: fit } as const;
  if (item.type === 'video')
    return <video key={item.id} ref={ref} src={item.filePath} muted={muted} loop={loop} playsInline preload="auto"
      className="h-full w-full bg-black" style={style} onLoadedData={onReady} onError={onReady} />;
  if (item.type === 'image')
    return <img key={item.id} src={item.filePath} alt="" className="h-full w-full bg-black" style={style} onLoad={onReady} onError={onReady} />;
  return <iframe key={item.id} src={item.filePath} title={item.name} className="h-full w-full border-0 bg-white"
    onLoad={onReady} onError={onReady} />;
}

/** Thumbnail kecil untuk library/playlist/pad. */
export function Thumb({ item }: { item: MediaItem }) {
  if (item.type === 'image') return <img src={item.filePath} alt="" loading="lazy" className="h-full w-full object-cover" />;
  if (item.type === 'video')
    return <video src={`${item.filePath}#t=0.5`} preload="metadata" muted playsInline className="h-full w-full object-cover" />;
  return <div className="flex h-full w-full items-center justify-center bg-elevated text-2xl">🌐</div>;
}
