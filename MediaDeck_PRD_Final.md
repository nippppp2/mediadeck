# Product Requirements Document (PRD)
# MediaDeck — Dual-Screen & Remote-Controlled Multimedia Controller

**Document Title:** Product Requirements Document (PRD) — MediaDeck System Architecture & Specifications  
**Version:** 2.0 (Final Architecture)  
**Status:** Approved / Ready for Implementation  
**Backend:** Go (Golang) — Single Binary Embedded Server  
**Frontend:** React 19 + TypeScript + Vite + Tailwind CSS (Desktop Control Room & Mobile Virtual Deck)  
**Network Mode:** Offline-First / Portable Hotspot / Local LAN  
**Target Output:** External Display / Projector via Clean Browser Window  

---

## 1. Executive Summary & Vision

### 1.1 Product Vision
**MediaDeck** adalah sistem kontrol multimedia *live-event* portabel berperforma tinggi yang memungkinkan pergantian konten (video, gambar, dan website) secara cepat, andal, dan bebas hambatan visual (*clean output*) pada monitor eksternal atau proyektor panggung. 

Sistem ini memadukan keandalan **Backend Golang** lokal dengan fleksibilitas **Web Frontend modern (React + Tailwind)**. MediaDeck menghadirkan kendali ganda:
1. **Desktop Operator:** Tata letak lengkap 3-kolom bergaya *Broadcast Control Room* di laptop teknis.
2. **Mobile Stage Remote:** Antarmuka sentuh *Virtual Quick-Deck* di smartphone (HP) operator panggung/direktur acara yang bergerak bebas di venue melalui koneksi Wi-Fi Hotspot lokal tanpa perlu koneksi internet.

### 1.2 Strategic Architectural Shift (v1.0 Browser-Only ke v2.0 Golang Hybrid)
Pada evaluasi awal (v1.0), sistem direncanakan murni di browser menggunakan IndexedDB dan BroadcastChannel. Namun, untuk memenuhi kebutuhan kendali jarak jauh melalui smartphone dan penanganan file video besar berkualitas tinggi tanpa batasan kuota memori browser, arsitektur difinalisasi menjadi:
* **Server Lokal Mandiri (Go Executable):** Berjalan di laptop host, bertindak sebagai WebSocket hub real-time, penyaji video dengan HTTP 206 Partial Streaming, dan penyimpan file di direktori lokal laptop.
* **Single Binary Distribution:** Seluruh aset frontend (HTML, CSS, JS) di-bundle dan di-embed ke dalam satu file executable binary Go (`.exe`), sehingga dapat dijalankan tanpa instalasi Node.js, database terpisah, atau web server eksternal di laptop acara.
* **Zero-Friction Hotspot Connection:** Laptop memancarkan hotspot Wi-Fi mandiri; smartphone langsung terhubung dan membuka web kontrol via pemindaian QR Code tanpa konfigurasi rumit atau akun login.

---

## 2. Problem Statement & User Personas

### 2.1 Masalah di Lapangan (Pain Points)
1. **Kebocoran Tampilan ke Audiens:** Operator seringkali harus memperlihatkan desktop, folder explorer, atau kontrol pemutar video saat mengganti materi di proyektor.
2. **Keterikatan Fisik Operator:** Operator terpaku di meja teknis belakang, menyulitkan koordinasi dinamis dengan pembawa acara atau panggung depan.
3. **Ketergantungan Internet & Komputasi Cloud:** Banyak venue acara memiliki sinyal seluler lemah atau Wi-Fi yang tidak stabil; sistem berbasis cloud rentan macet.
4. **Latency & Lag Video:** Pemutaran video berukuran besar melalui web browser murni sering mengalami buffering atau crash memori jika tidak didukung HTTP Range Streaming.

### 2.2 Target Pengguna (Personas)
* **Lead Operator (Laptop):** Mengatur playlist sebelum acara, memantau *Program Preview* (Live) dan *Next Preview* (Staging), mengelola file library, dan mengeksekusi transisi utama.
* **Stage Manager / Roaming Director (HP):** Bergerak bebas di sekitar panggung/ruangan, memicu perpindahan materi presentasi/video menggunakan tampilan *Virtual Deck* di layar smartphone dengan responsivitas instan (<50ms).
* **Audiens:** Menikmati tampilan visual yang mulus, bersih dari kursor atau pop-up, dengan transisi *CUT* atau *FADE* tanpa jeda hitam tak terduga (*zero-flicker*).

---

## 3. Network Topology & Deployment Architecture

```
                       ┌───────────────────────────────────────────────┐
                       │          LAPTOP OPERATOR (HOST PC)            │
                       │                                               │
                       │   ┌────────────────────────────────────────┐  │
                       │   │          MediaDeck Go Binary           │  │
                       │   │  - Embedded React Web Assets           │  │
                       │   │  - WebSocket Hub (State Sync)          │  │
                       │   │  - HTTP 206 Video Streaming Engine     │  │
                       │   │  - Local Media Store & SQLite DB       │  │
                       │   └───────┬────────────────────────┬───────┘  │
                       │           │                        │          │
                       │           ▼ (Localhost HTTP/WS)    ▼          │
                       │   ┌───────────────────┐    ┌───────────────┐  │
                       │   │ Desktop Dashboard │    │ Output Window │──┼───┐
                       │   │ (3-Column Room)   │    │ (Dual Deck)   │  │   │
                       │   └───────────────────┘    └───────────────┘  │   │
                       └───────────────────▲───────────────────────────┘   │ HDMI Cable
                                           │                               │
                      Wi-Fi Hotspot / LAN  │ Sub-50ms                      ▼
                      (192.168.137.x:8080) │ Realtime Sync         ┌───────────────┐
                                           │                       │   PROYEKTOR / │
                                           ▼                       │   AUDIENS TV  │
                              ┌─────────────────────────┐          │  (Clean Output│
                              │     SMARTPHONE (HP)     │          │   Fullscreen) │
                              │    Mobile Web Remote    │          └───────────────┘
                              │   (Virtual Quick-Deck)  │
                              └─────────────────────────┘
```

### 3.1 Spesifikasi Alur Hotspot & Penemuan Perangkat
1. Laptop mengaktifkan Windows Mobile Hotspot bawaan (tanpa perlu router internet).
2. Binary Go `mediadeck.exe` dijalankan; server otomatis mendeteksi alamat IP lokal aktif (misal `192.168.137.1:8080`).
3. Dashboard laptop menampilkan **QR Code** koneksi di pojok kanan atas.
4. Smartphone operator terhubung ke hotspot Wi-Fi laptop dan memindai QR Code untuk membuka antarmuka kendali instan.
5. Arsitektur akses: **Symmetric Collaborative Sync (Bebas Akses Tanpa PIN)** di dalam jaringan lokal. Semua aksi di HP dan laptop tersinkronisasi 2 arah via WebSocket.

---

## 4. Functional Requirements (FR)

### Module 1: Core Engine & Synchronization (Backend Golang)
* **FR-01: Single Executable Architecture:** Server Go meng-embed seluruh bundle frontend build (`dist/`) via `embed.FS` sehingga hanya berupa 1 file `.exe`.
* **FR-02: WebSocket Central Hub:** Menjaga *state* global tersinkronisasi antar semua klien:
  * Program State (Media apa yang sedang LIVE).
  * Preview State (Media apa yang siap di Next/Staging).
  * Playback State (Playing, Paused, Loop, Current Time, Duration).
  * Transition State (CUT / FADE, Fade Duration).
  * Output Status (Connected, Disconnected, Black Screen On/Off).
* **FR-03: Media Streaming Engine (HTTP 206 Partial Content):** Melayani file MP4/WebM lokal dengan dukungan *range-requests* agar pemutaran video instan tanpa harus mengunduh file utuh terlebih dahulu.
* **FR-04: Local Storage & Persistence:**
  * File biner disimpan di direktori lokal laptop: `./data/media/`.
  * Metadata media dan urutan playlist disimpan dalam basis data ringan SQLite / JSON store: `./data/mediadeck.db`.
  * Mendukung upload file dari laptop maupun langsung dari galeri HP.

### Module 2: Desktop Operator Dashboard (Laptop)
*Sesuai spesifikasi `desain.md` (Gaya Dark Broadcast Control Room).*
* **FR-05: 3-Column Layout:**
  * **Kolom Kiri (Media Library):** Pencarian, filter jenis (All, Video, Image, Web), upload file, grid thumbnail, durasi video, badge tipe.
  * **Kolom Tengah (Program & Next Preview + Controls):**
    * *Program Preview (LIVE):* Rasio 16:9, border indikator LIVE merah.
    * *Next Preview (CUE/STAGING):* Rasio 16:9, border aksen teal.
    * *Transition Bar:* Tombol segmented `CUT` dan `FADE` beserta pilihan durasi (250ms, 500ms, 1s, 2s).
    * *Playback Controls:* Play, Pause, Toggle Loop, Tombol darurat Black Screen, Tombol utama `TAKE TO OUTPUT`.
  * **Kolom Kanan (Playlist & Properties & Output Controls):**
    * Daftar playlist bernomor dengan indikator status item aktif.
    * Panel properti media (fit mode: Contain/Cover, nama file, sumber).
    * Status koneksi output window & tombol `Open Output Window`.
* **FR-06: Keyboard Shortcuts (Desktop):**
  * `Space`: Play/Pause video.
  * `Enter`: Take selected media to output.
  * `Arrow Left / Right`: Pilih media sebelumnya/berikutnya.
  * `C`: Aktifkan mode CUT.
  * `F`: Aktifkan mode FADE.
  * `B`: Toggle Black Screen.
  * `L`: Toggle Loop.
  * *Safety Guard:* Pintasan otomatis dinonaktifkan saat kursor fokus pada input teks pencarian/nama.

### Module 3: Mobile Web Remote (Smartphone Virtual Deck)
* **FR-07: StreamDeck-Style Virtual Quick-Action Grid:**
  * Tampilan dioptimalkan khusus untuk layar sentuh vertikal HP (*thumb-friendly*).
  * **Top Bar:** Mini Program status (judul media yang sedang live & badge status output).
  * **Grid Action Pads:** Tombol-tombol kartu bernomor besar berisi thumbnail dan nama media dari playlist aktif:
    * Warna border/badge kartu: Merah (Sedang LIVE di Output), Teal (Sedang di-CUE di Preview), Abu-abu (Siap dipilih).
    * Tap sekali: Memilih media masuk ke Next Preview (CUE).
    * Double-tap atau Quick-Take: Langsung eksekusi ke Output jika diatur ke mode instan.
  * **Bottom Sticky Control Bar:**
    * Tombol raksasa **TAKE (CUT / FADE)**.
    * Tombol Play / Pause.
    * Tombol **BLACK SCREEN** darurat.
  * **Drawer Menu:** Tombol untuk membuka pustaka media lengkap atau mengunggah file baru dari galeri smartphone.

### Module 4: Audience Output Display (Jendela Eksternal)
* **FR-08: Clean Viewport:** Jendela output murni menampilkan media tanpa kontrol browser, scrollbar, kursor mengganggu, atau header dashboard.
* **FR-09: A/B Deck Seamless Transition Engine:**
  * Jendela output mengelola dua lapisan renderer (Deck A dan Deck B).
  * Pada transisi `CUT`: Deck aktif langsung menukar sumber media tanpa kedip.
  * Pada transisi `FADE`: Deck cadangan memuat media baru di latar belakang (opacity: 0). Saat media siap, animasi opacity dijalankan (1->0 dan 0->1). Setelah transisi selesai, video pada deck lama otomatis dihentikan untuk menghemat GPU/RAM.
* **FR-10: Black Screen Layer:** Lapisan hitam mutlak di atas seluruh deck yang dapat diaktifkan/dinonaktifkan seketika tanpa menutup atau merefresh jendela output.
* **FR-11: Fullscreen Handler:** Tombol panduan aktivasi fullscreen di jendela output agar pas 100% dengan resolusi monitor eksternal.

### Module 5: Media Types Support
* **FR-12: Video Playback:** Format MP4 (H.264/AAC) dan WebM. Mendukung autoplay terkontrol, loop playback, dan pause/resume sinkron.
* **FR-13: Image Rendering:** Format PNG, JPG/JPEG, WebP, SVG. Pilihan rasio aspek `contain` (letterbox rapi) atau `cover`.
* **FR-14: Web URL Embedding (Iframe):** Menampilkan halaman web publik yang mengizinkan framing. Dilengkapi sistem deteksi error jika target URL memblokir iframe (CSP/X-Frame-Options) dengan pesan fallback elegan di dashboard.

---

## 5. Non-Functional Requirements (NFR)

| Dimensi | Kriteria & Metrik Penerimaan |
| :--- | :--- |
| **Latensi Kontrol** | Waktu dari tombol di-tap pada HP hingga perubahan di Output Display wajib **< 50 ms** pada jaringan Wi-Fi lokal. |
| **Kinerja Transisi (CUT)** | Respon perpindahan gambar/video seketika tanpa jeda putih/flicker kosong (target di bawah 100 ms). |
| **Zero Memory Leak** | Server dan frontend membersihkan alokasi memori (revoking Object URL, me-release instance player video lama) agar aplikasi stabil berjalan nonstop > 12 jam acara. |
| **Stabilitas Jaringan** | Jika sinyal Wi-Fi HP terputus sesaat, klien mobile otomatis melakukan *auto-reconnect* via WebSocket tanpa me-reload seluruh halaman. |
| **Zero External Dependency** | Sistem dapat berjalan 100% secara *offline* di laptop lapangan tanpa sambungan internet sama sekali. |
| **Kompatibilitas Browser** | Host/Output: Google Chrome, Microsoft Edge, Brave (Chromium engine). Mobile Client: Mobile Chrome (Android) dan Mobile Safari (iOS). |

---

## 6. UI/UX Specifications (Sesuai `desain.md`)

### 6.1 Design Tokens

```css
/* Core Palette - Dark Broadcast Control Room */
--bg-app: #111318;             /* Latar utama aplikasi */
--bg-panel: #1B1E26;           /* Sidebar, panel kontrol, toolbar */
--bg-elevated: #282D38;        /* Kartu item, tombol sekunder */
--bg-hover: #343A47;           /* Hover state */
--border-default: #343741;     /* Garis pemisah panel */

/* Text Hierarchy */
--text-primary: #F4F5F7;       /* Teks judul & label aktif */
--text-secondary: #B6BAC5;     /* Deskripsi & metadata */
--text-muted: #858B99;         /* Label kecil/status nonaktif */

/* Accent & Status States */
--accent-primary: #20B8A6;       /* Teal: Aksi utama, Cue/Next item, Fokus */
--accent-primary-hover: #39C9B8; /* Hover Teal */
--status-live: #EF6262;          /* Merah: LIVE Program, Rekaman aktif */
--status-warning: #E9B44C;       /* Kuning: Buffering, Warning */
--status-success: #39C98A;       /* Hijau: Output siap / Connected */
--status-error: #EF6262;         /* Merah: Media error / Disconnected */
```

### 6.2 Ergonomi Tampilan
* **Desktop (≥ 1024px):** 3 Kolom permanen (Library 260px - Dual Preview & Transition Auto - Playlist & Settings 280px).
* **Mobile (< 768px):** Virtual Deck Layout:
  * Header ringkas dengan status LIVE.
  * Pad Grid 2 kolom tombol media sentuh berukuran minimal 72x72px dengan teks kontras tinggi.
  * Sticky bottom action bar dengan tinggi 64px untuk tombol TAKE, CUT/FADE, dan BLACK.

---

## 7. Data Models & API Contracts

### 7.1 Data Models (Go & TypeScript)

```typescript
export type MediaType = 'video' | 'image' | 'web';

export interface MediaItem {
  id: string;             // UUID v4
  name: string;           // Nama file atau judul
  type: MediaType;        // video | image | web
  filePath: string;       // Path relatif di server (/media/filename.mp4) atau URL web
  thumbnailUrl: string;   // Path thumbnail (/media/thumbnails/id.jpg)
  duration: number;       // Dalam detik (khusus video, 0 untuk gambar/web)
  aspectRatio?: string;   // Default '16:9'
  createdAt: number;      // Epoch timestamp
}

export interface PlaylistItem {
  id: string;
  mediaId: string;
  order: number;
}

export interface PlaybackState {
  activeMediaId: string | null;   // Media yang sedang LIVE di Program
  nextMediaId: string | null;     // Media yang disiapkan di Next Preview
  transitionMode: 'CUT' | 'FADE';
  fadeDurationMs: number;         // 250, 500, 1000, 2000
  isPlaying: boolean;             // Khusus video
  isLoop: boolean;
  isBlackScreen: boolean;
  currentTime: number;            // Posisi detik video
}
```

### 7.2 REST API Endpoints (Go Backend)

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/system/info` | Mengambil IP lokal hotspot, port, dan status koneksi output. |
| `GET` | `/api/media` | Mengambil daftar semua media di library. |
| `POST` | `/api/media/upload` | Mengunggah media (multipart form-data) dari laptop/HP. |
| `DELETE`| `/api/media/:id` | Menghapus media dari disk dan database. |
| `GET` | `/api/playlist` | Mengambil urutan playlist aktif. |
| `POST` | `/api/playlist` | Memperbarui urutan/daftar playlist. |
| `GET` | `/media/:filename` | Streaming media lokal dengan dukungan `Range: bytes=...`. |

### 7.3 WebSocket Real-time Protocol (`/ws`)

Semua komunikasi kendali dikirim dalam format JSON:

```typescript
// Pesan dari Klien (Laptop atau HP) ke Server Go
export type ClientMessage =
  | { type: 'CUE_MEDIA'; mediaId: string }
  | { type: 'TAKE_OUTPUT'; transition?: 'CUT' | 'FADE'; durationMs?: number }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'TOGGLE_LOOP'; enabled: boolean }
  | { type: 'TOGGLE_BLACK'; enabled: boolean }
  | { type: 'SEEK'; timeSeconds: number };

// Siaran dari Server Go ke Seluruh Klien (Laptop, HP, Output Window)
export type ServerMessage =
  | { type: 'STATE_SNAPSHOT'; state: PlaybackState; mediaList: MediaItem[]; playlist: PlaylistItem[] }
  | { type: 'STATE_CHANGED'; state: PlaybackState }
  | { type: 'MEDIA_ADDED'; item: MediaItem }
  | { type: 'MEDIA_DELETED'; id: string }
  | { type: 'OUTPUT_STATUS'; connected: boolean };
```

---

## 8. Proposed Project Directory Structure

```text
mediaDeck/
├── cmd/
│   └── server/
│       └── main.go                 # Entry point Golang server & embed logic
├── internal/
│   ├── api/
│   │   ├── handlers.go             # REST handlers (upload, media, playlist)
│   │   └── router.go               # HTTP routing setup
│   ├── database/
│   │   ├── db.go                   # SQLite/JSON initialization
│   │   └── repository.go           # CRUD query media & playlist
│   ├── streamer/
│   │   └── fileserver.go           # HTTP 206 Partial Content range server
│   ├── websocket/
│   │   ├── client.go               # WS connection handler
│   │   └── hub.go                  # Broadcast state management hub
│   └── models/
│       └── models.go               # Go struct definitions
├── web/                            # React + Vite Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── DesktopDashboard.tsx # 3-Column Operator Dashboard
│   │   │   ├── MobileRemote.tsx     # Virtual Quick-Deck for HP
│   │   │   └── OutputDisplay.tsx    # Clean Dual-Deck Output View
│   │   ├── components/
│   │   │   ├── MediaLibrary/
│   │   │   ├── Previews/
│   │   │   ├── Controls/
│   │   │   └── Playlist/
│   │   ├── hooks/
│   │   │   ├── useMediaDeckWS.ts   # WebSocket hook with auto-reconnect
│   │   │   └── useKeyboardControl.ts
│   │   ├── styles/
│   │   │   └── globals.css         # Tailwind tokens & dark room theme
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── data/                           # Local storage (Git-ignored)
│   ├── media/                      # Uploaded videos & images
│   └── mediadeck.db                # SQLite database
├── go.mod
├── go.sum
├── MediaDeck_PRD_Final.md          # Dokumen PRD Final ini
└── MediaDeck_Rancangan_Sistem.md   # Dokumen arsitektur awal
```

---

## 9. Phased Implementation Roadmap

### Phase 1: Go Core & WebSocket Foundation
1. Inisialisasi struktur Go module dan HTTP Server.
2. Implementasi WebSocket Hub (Broadcast, Hub, Client handler, Ping/Pong Heartbeat).
3. Implementasi SQLite storage dan REST upload handler dengan dukungan streaming video HTTP 206.
4. Auto-detect local IP address dan endpoint info generator.

### Phase 2: Frontend Setup & Output Display View
1. Inisialisasi project React + Vite + Tailwind CSS dengan design tokens sesuai `desain.md`.
2. Implementasi `OutputDisplay.tsx` dengan sistem A/B Dual Deck transition (CUT & FADE CSS transitions).
3. Integrasi WebSocket hook di client untuk menerima perintah pergantian media secara instan.
4. Pengujian fullscreen mode dan black screen overlay.

### Phase 3: Desktop Operator Dashboard
1. Implementasi layout 3-kolom (Media Library, Program/Next Preview, Playlist & Properties).
2. Implementasi Preview video/gambar sinkron dengan status live.
3. Kontrol transisi (CUT/FADE dengan durasi 250ms–2000ms).
4. Kontrol playback (Play, Pause, Loop, Black Screen).
5. Keyboard shortcut handler dengan input-guard.

### Phase 4: Mobile Web Virtual Deck (HP Remote)
1. Implementasi responsive routing (`/remote` atau otomatis mendeteksi user-agent mobile).
2. Desain *Virtual Quick-Action Grid* (tombol pad sentuh bernomor besar dengan thumbnail & status border).
3. Sticky bottom action bar untuk tombol TAKE, CUT/FADE, dan BLACK SCREEN.
4. Fitur pemindaian QR Code di dashboard desktop untuk membuka kontrol HP secara instan.

### Phase 5: Single-Binary Embed & Testing
1. Konfigurasi `//go:embed` pada Go backend untuk menyatukan build frontend (`web/dist`) ke dalam binary.
2. Kompilasi binary Windows `.exe`.
3. Pengujian skenario lapangan:
   * Laptop mode Hotspot mandiri (tanpa internet).
   * HP terhubung via Wi-Fi hotspot dan mengontrol pemutaran video 1080p.
   * Uji pergantian cepat CUT/FADE dan toleransi pemutusan koneksi (reconnection test).

---

## 10. Acceptance Criteria Checklist

- [ ] **Single Binary Executable:** Server dapat dijalankan di Windows dengan mengklik ganda file `.exe` tanpa instalasi dependensi tambahan.
- [ ] **Hotspot Offline Operation:** Laptop dan HP dapat beroperasi penuh tanpa koneksi internet.
- [ ] **QR Code Quick Access:** Dashboard laptop menampilkan QR Code alamat IP lokal yang bisa langsung dibuka oleh browser HP.
- [ ] **Zero-Leakage Output:** Jendela output pada monitor eksternal tidak menampilkan UI dashboard, kursor, atau kontrol player.
- [ ] **A/B Deck FADE & Instant CUT:** Transisi FADE berjalan mulus antar dua video/gambar tanpa frame kedip hitam, dan perintah CUT dieksekusi di bawah 100 ms.
- [ ] **Real-time Mobile Sync:** Perubahan status (misal Play/Pause atau CUE di HP) ter-update di laptop dan output dalam waktu < 50 ms.
- [ ] **HTTP 206 Video Scrubbing:** Video dapat di-play dan di-seek secara mulus baik di preview maupun di layar output.
- [ ] **Safe Keyboard Controls:** Pengetikan pada kolom search tidak memicu pintasan keyboard pemutar.
