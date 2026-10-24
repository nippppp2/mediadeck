import type { MediaItem, SystemInfo } from './types';

export const getSystemInfo = (): Promise<SystemInfo> => fetch('/api/system/info').then((r) => r.json());

function readDuration(file: File): Promise<number> {
  if (!file.type.startsWith('video/')) return Promise.resolve(0);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    const done = (d: number) => { URL.revokeObjectURL(url); v.removeAttribute('src'); v.load(); resolve(d); };
    v.preload = 'metadata';
    v.onloadedmetadata = () => done(isFinite(v.duration) ? v.duration : 0);
    v.onerror = () => done(0);
    v.src = url;
  });
}

export async function uploadFile(file: File): Promise<MediaItem> {
  const fd = new FormData();
  fd.append('duration', String(await readDuration(file))); // harus sebelum 'file'
  fd.append('file', file);
  const r = await fetch('/api/media/upload', { method: 'POST', body: fd });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export const addWeb = (name: string, url: string) =>
  fetch('/api/media/web', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, url }) });

export const deleteMedia = (id: string) => fetch(`/api/media/${id}`, { method: 'DELETE' });

export const savePlaylist = (mediaIds: string[]) =>
  fetch('/api/playlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mediaIds }) });
