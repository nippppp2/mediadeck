# MediaDeck --- Rancangan Sistem Media Control Dashboard

**Jenis dokumen:** Rancangan sistem dan spesifikasi MVP\
**Versi:** 1.0\
**Status:** Draft rancangan\
**Platform target:** Website lokal berbasis browser, dengan output pada
monitor eksternal

------------------------------------------------------------------------

## 1. Ringkasan Eksekutif

MediaDeck adalah website untuk mengelola dan menampilkan media pada
monitor eksternal secara cepat. Operator mengendalikan media melalui
dashboard pada monitor utama, sedangkan audiens melihat output media
pada jendela terpisah yang dapat dipindahkan ke monitor eksternal dan
dijalankan dalam mode fullscreen.

Sistem mendukung tiga jenis media pada MVP:

-   Video lokal, seperti MP4 dan WebM.
-   Gambar lokal, seperti PNG, JPG, dan WebP.
-   Halaman web melalui URL, selama situs mengizinkan kontennya
    ditampilkan melalui `iframe`.

Perpindahan media menyediakan dua mode: **CUT**, untuk mengganti media
secara langsung, dan **FADE**, untuk transisi dengan animasi. Kontrol
playback video mencakup Play, Pause, Loop, dan Black Screen.

MVP dirancang berjalan secara lokal di browser tanpa akun pengguna atau
server cloud. React, TypeScript, Vite, Tailwind CSS, IndexedDB, dan
BroadcastChannel API direkomendasikan sebagai fondasi teknis.

## 2. Latar Belakang dan Permasalahan

Ketika mengoperasikan presentasi, seminar, acara kampus, pemutaran video
promosi, atau kegiatan multimedia, operator sering perlu berpindah
antara video, gambar, dan halaman web. Berpindah aplikasi atau mencari
file secara manual dapat memperlambat proses dan meningkatkan risiko
salah menampilkan konten.

MediaDeck dirancang untuk menyediakan satu pusat kontrol yang
memungkinkan operator:

1.  Menyiapkan media sebelum acara.
2.  Memeriksa media berikutnya melalui preview.
3.  Mengirim media ke output dengan satu aksi.
4.  Mengontrol video tanpa berpindah aplikasi.
5.  Menampilkan output secara fullscreen di monitor eksternal.

## 3. Tujuan Sistem

### 3.1 Tujuan utama

-   Mempercepat perpindahan media yang ditampilkan kepada audiens.
-   Memisahkan antarmuka operator dari tampilan audiens.
-   Menyediakan kontrol media yang sederhana dan mudah dikenali.
-   Mendukung perpindahan instan dan transisi halus.
-   Menyimpan metadata media dan playlist secara lokal di browser.

### 3.2 Di luar cakupan MVP

-   Integrasi langsung dengan OBS Studio.
-   Kolaborasi banyak operator melalui jaringan.
-   Sistem login, role, dan backend cloud.
-   Streaming langsung ke platform video.
-   Otomatisasi penuh pengelolaan jendela oleh sistem operasi.
-   Pemutaran atau pengunduhan otomatis dari situs web yang membatasi
    akses.

## 4. Pengguna dan Skenario

### 4.1 Operator

Operator menambahkan media, mengatur playlist, memilih transisi, dan
mengontrol output dari dashboard.

### 4.2 Audiens

Audiens hanya melihat media yang sedang ditayangkan pada monitor
eksternal. Mereka tidak melihat dashboard, library, atau kontrol
operator.

### 4.3 Skenario penggunaan

  -----------------------------------------------------------------------
  Kondisi                 Aksi operator           Hasil yang diharapkan
  ----------------------- ----------------------- -----------------------
  Sebelum acara           Menambahkan video       Video tersedia di media
                          opening                 library

  Acara dimulai           Mengirim video ke       Video tampil di monitor
                          output                  eksternal

  Beralih ke judul acara  Memilih gambar dan      Gambar langsung
                          menjalankan CUT         menggantikan video

  Menampilkan sponsor     Memilih gambar dan      Konten berubah melalui
                          menjalankan FADE        transisi halus

  Jeda acara              Menjalankan Black       Output menjadi hitam
                          Screen                  tanpa menutup jendela

  Penutupan               Menampilkan video       Video penutup tampil
                          closing                 pada output
  -----------------------------------------------------------------------

## 5. Rancangan UI/UX

### 5.1 Prinsip desain

-   **Dark control room:** latar gelap dengan kontras tinggi.
-   **Status jelas:** status output, media aktif, dan error mudah
    dikenali.
-   **Aksi cepat:** kontrol utama dapat dijangkau tanpa banyak langkah.
-   **Pemisahan tampilan:** dashboard operator tidak muncul pada output
    audiens.
-   **Feedback langsung:** aplikasi menunjukkan status loading, ready,
    playing, paused, dan error.
-   **Pencegahan kesalahan:** media yang akan ditampilkan dapat
    diperiksa melalui preview.

### 5.2 Struktur dashboard

  -----------------------------------------------------------------------
  Area                    Komponen                Fungsi
  ----------------------- ----------------------- -----------------------
  Header                  Logo, nama aplikasi,    Identitas dan status
                          status output,          sistem
                          pengaturan              

  Program Preview         Tampilan representatif  Memeriksa media yang
                          media aktif             sedang ditayangkan

  Next Preview            Tampilan media yang     Memeriksa konten
                          dipilih berikutnya      sebelum dikirim

  Transition Bar          CUT, FADE, pilihan      Mengatur cara
                          durasi                  perpindahan

  Playback Controls       Play, Pause, Loop,      Mengontrol video dan
                          Black Screen            output

  Media Library           Thumbnail, pencarian,   Mengelola koleksi media
                          filter, tambah media    

  Playlist                Daftar dan urutan media Mengatur urutan acara

  Output Settings         Buka output, panduan    Mengelola jendela
                          fullscreen, rasio layar output
  -----------------------------------------------------------------------

### 5.3 Layout yang disarankan

Pada desktop lebar, gunakan tiga kolom:

-   **Kolom kiri:** media library dan pencarian.
-   **Kolom tengah:** program preview, next preview, transisi, dan
    playback controls.
-   **Kolom kanan:** playlist, detail media, dan output settings.

Pada layar lebih kecil, panel dapat diubah menjadi tab atau drawer.

### 5.4 Output display

Jendela output harus:

-   Menampilkan hanya media yang ditayangkan.
-   Tidak memiliki toolbar atau kontrol operator di dalam konten output.
-   Mendukung fullscreen melalui browser.
-   Menyesuaikan gambar dan video terhadap rasio layar.
-   Memperlihatkan status loading atau error yang terkontrol.
-   Tetap terbuka ketika operator berpindah media.

## 6. Kebutuhan Fungsional

  -----------------------------------------------------------------------
  ID                Fitur             Deskripsi         Prioritas
  ----------------- ----------------- ----------------- -----------------
  FR-01             Media Library     Menambahkan dan   Must
                                      mengelola video,  
                                      gambar, dan URL   
                                      web               

  FR-02             Thumbnail         Menampilkan       Must
                                      representasi      
                                      visual media      

  FR-03             Preview           Memeriksa media   Must
                                      sebelum           
                                      ditayangkan       

  FR-04             Output Window     Membuka output di Must
                                      jendela terpisah  

  FR-05             CUT               Mengganti media   Must
                                      secara langsung   

  FR-06             FADE              Mengganti media   Must
                                      dengan animasi    
                                      opacity           

  FR-07             Video Playback    Play, Pause, dan  Must
                                      Loop untuk video  

  FR-08             Black Screen      Menampilkan layar Must
                                      hitam tanpa       
                                      menutup output    

  FR-09             Playlist          Menambah,         Must
                                      menghapus,        
                                      memilih, dan      
                                      mengurutkan media 

  FR-10             Keyboard          Menjalankan       Should
                    Shortcuts         kontrol melalui   
                                      keyboard          

  FR-11             Local Persistence Menyimpan         Must
                                      metadata dan      
                                      playlist secara   
                                      lokal             

  FR-12             Error Feedback    Menampilkan error Must
                                      saat media gagal  
                                      dimuat            

  FR-13             Output Status     Menampilkan       Should
                                      status jendela    
                                      output            

  FR-14             Search and Filter Mencari media     Should
                                      berdasarkan nama  
                                      atau jenis        
  -----------------------------------------------------------------------

## 7. Kebutuhan Nonfungsional

-   **Performa:** perintah CUT harus terasa instan pada kondisi normal;
    target respons perintah di bawah 100 ms, tidak termasuk waktu
    pemuatan media.
-   **Stabilitas:** dashboard tidak boleh ikut reload hanya karena media
    output berganti.
-   **Usability:** kontrol utama memiliki label atau ikon yang jelas.
-   **Kompatibilitas:** target awal Google Chrome atau browser Chromium
    modern pada desktop.
-   **Privasi:** file dan metadata dikelola secara lokal; tidak ada
    upload ke server dalam MVP.
-   **Ketahanan:** kegagalan memuat satu media tidak boleh membuat
    seluruh dashboard berhenti.
-   **Aksesibilitas:** kontrol dapat difokuskan dengan keyboard dan
    memiliki label yang bermakna.
-   **Keamanan:** URL website divalidasi dan konten eksternal
    diperlakukan sebagai konten tidak tepercaya.

## 8. Alur Penggunaan

1.  Operator membuka dashboard MediaDeck.
2.  Operator menambahkan file video/gambar atau memasukkan URL website.
3.  Operator memeriksa item yang masuk ke media library.
4.  Operator membuka jendela External Display.
5.  Operator memindahkan jendela output ke monitor kedua.
6.  Operator mengaktifkan fullscreen pada monitor eksternal.
7.  Operator memilih media dari library atau playlist.
8.  Operator memeriksa preview dan memilih CUT atau FADE.
9.  Operator mengirim media ke output.
10. Operator mengontrol video atau berpindah ke media berikutnya.
11. Jika diperlukan, operator mengaktifkan Black Screen.
12. Setelah sesi selesai, operator menutup output dan menyimpan
    perubahan playlist.

## 9. Aturan Perpindahan Media

### 9.1 CUT

CUT mengganti konten output langsung ke media baru tanpa animasi
transisi. Gunakan untuk perpindahan cepat dan situasi ketika ketepatan
waktu lebih penting daripada efek visual.

### 9.2 FADE

FADE menggunakan dua lapisan konten: lapisan media aktif dan lapisan
media berikutnya. Lapisan berikutnya dipersiapkan, kemudian opacity
kedua lapisan dianimasikan.

Durasi awal yang disarankan adalah 500 ms. Pilihan durasi MVP:

-   250 ms
-   500 ms
-   1 detik
-   2 detik

Jika media berikutnya belum siap, sistem harus menunggu kesiapan media
atau memberikan status loading, bukan menampilkan layar kosong secara
tidak terduga.

### 9.3 Perbedaan jenis media

-   **Gambar ke gambar:** dapat menggunakan CUT atau FADE.
-   **Gambar ke video:** siapkan video sebelum transisi; mulai playback
    sesuai kebijakan autoplay browser.
-   **Video ke gambar:** hentikan atau jeda video lama setelah
    pergantian berhasil.
-   **Video ke video:** siapkan video berikutnya dan hindari audio dari
    dua video berjalan bersamaan.
-   **Halaman web:** transisi bergantung pada kesiapan iframe dan
    kebijakan situs. Tidak semua halaman dapat ditampilkan melalui
    iframe.

## 10. Keyboard Shortcuts

  Tombol          Aksi
  --------------- --------------------------------------------------
  `Space`         Play/Pause video yang aktif, bila sesuai konteks
  `Enter`         Tampilkan media yang dipilih
  `Arrow Right`   Pilih media berikutnya
  `Arrow Left`    Pilih media sebelumnya
  `C`             Pilih mode CUT
  `F`             Pilih mode FADE
  `B`             Aktifkan/nonaktifkan Black Screen
  `L`             Aktifkan/nonaktifkan Loop
  `Esc`           Keluar dari fullscreen jika browser mengizinkan

Pintasan harus diabaikan ketika fokus berada pada input, textarea, atau
elemen yang sedang menerima teks. Perlu ada pencegahan agar satu tombol
tidak memicu aksi ganda.

## 11. Arsitektur Teknis

### 11.1 Stack yang direkomendasikan

  -----------------------------------------------------------------------
  Lapisan                 Teknologi               Tanggung jawab
  ----------------------- ----------------------- -----------------------
  UI                      React + TypeScript      Komponen dashboard dan
                                                  output

  Build tool              Vite                    Dev server dan bundling

  Styling                 Tailwind CSS            Layout dan sistem
                                                  visual

  Video                   HTML5 Video             Playback, pause, loop

  Gambar                  HTML Image              Render gambar

  Web                     iframe                  Embed halaman yang
                                                  mengizinkan embedding

  Penyimpanan             IndexedDB               Metadata, playlist, dan
                                                  blob file jika
                                                  diperlukan

  Komunikasi              BroadcastChannel API    Sinkronisasi dashboard
                                                  dan output

  State                   Store React atau        Status media, playlist,
                          Zustand                 dan output
  -----------------------------------------------------------------------

### 11.2 Gambaran arsitektur

``` text
┌───────────────────────────────┐
│       Operator Dashboard      │
│ Library · Preview · Playlist │
│ Transition · Playback Controls│
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│       Media Control Engine    │
│ State · CUT/FADE · Commands   │
│ Playback · Error Handling     │
└──────────────┬────────────────┘
               │ BroadcastChannel
               ▼
┌───────────────────────────────┐
│         Output Window         │
│ Video Renderer                │
│ Image Renderer                │
│ Web Renderer                  │
│ Fullscreen Display            │
└───────────────────────────────┘

Penyimpanan lokal:
IndexedDB → metadata media, playlist, dan blob file
```

### 11.3 Komunikasi antarjendela

Dashboard dan output harus berjalan pada origin yang sama agar
BroadcastChannel dapat digunakan secara konsisten.

Contoh pesan yang dapat dipakai:

``` ts
type OutputCommand =
  | { type: "SET_MEDIA"; mediaId: string; transition: "CUT" | "FADE" }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "TOGGLE_LOOP"; enabled: boolean }
  | { type: "BLACK_SCREEN"; enabled: boolean }
  | { type: "PING" };

type OutputStatus =
  | { type: "READY" }
  | { type: "LOADING"; mediaId: string }
  | { type: "PLAYING"; mediaId: string }
  | { type: "PAUSED"; mediaId: string }
  | { type: "ERROR"; mediaId?: string; message: string };
```

Contoh di atas adalah kontrak pesan konseptual; implementasi perlu
menambahkan validasi payload, penanganan koneksi, dan pengelolaan status
ketika jendela output ditutup atau dibuka kembali.

## 12. Struktur Folder

``` text
mediadeck/
├── public/
├── src/
│   ├── app/
│   │   ├── Dashboard.tsx
│   │   └── Output.tsx
│   ├── components/
│   │   ├── MediaLibrary.tsx
│   │   ├── PreviewPanel.tsx
│   │   ├── PlaylistPanel.tsx
│   │   ├── TransitionControls.tsx
│   │   └── PlaybackControls.tsx
│   ├── media/
│   │   ├── VideoRenderer.tsx
│   │   ├── ImageRenderer.tsx
│   │   └── WebRenderer.tsx
│   ├── services/
│   │   ├── mediaStorage.ts
│   │   └── outputChannel.ts
│   ├── store/
│   │   └── mediaStore.ts
│   ├── types/
│   │   └── media.ts
│   └── main.tsx
├── package.json
└── vite.config.ts
```

## 13. Model Data

### 13.1 Media Item

``` ts
type MediaType = "video" | "image" | "web";

interface MediaItem {
  id: string;
  name: string;
  type: MediaType;
  source: string;
  thumbnail?: string;
  duration?: number;
  createdAt: number;
}
```

`source` dapat berupa URL objek lokal untuk file yang sedang dibuka atau
URL website. Untuk file lokal yang perlu dipertahankan setelah refresh,
file/blob harus disimpan secara benar di IndexedDB dan URL objek dibuat
ulang ketika dibutuhkan.

### 13.2 Playlist

``` ts
interface Playlist {
  id: string;
  name: string;
  mediaIds: string[];
  updatedAt: number;
}
```

### 13.3 Output State

``` ts
interface OutputState {
  activeMediaId: string | null;
  selectedMediaId: string | null;
  transition: "CUT" | "FADE";
  fadeDurationMs: number;
  isBlackScreen: boolean;
  isLoopEnabled: boolean;
  status: "DISCONNECTED" | "READY" | "LOADING" | "PLAYING" | "PAUSED" | "ERROR";
}
```

## 14. Penyimpanan dan Pengelolaan File

IndexedDB direkomendasikan untuk menyimpan metadata, playlist, dan blob
file jika ukuran media sesuai dengan kapasitas browser.

Hal yang harus diperhatikan:

-   Jangan hanya menyimpan `blob:` URL karena URL tersebut tidak
    bertahan setelah sesi browser berakhir.
-   Simpan file/blob atau referensi yang dapat dipulihkan, lalu buat
    ulang object URL saat aplikasi dibuka.
-   Berikan pesan jika kuota penyimpanan browser tidak mencukupi.
-   Sediakan opsi menghapus media agar pengguna dapat mengelola ruang
    penyimpanan.
-   Media eksternal yang hanya direferensikan melalui URL tidak otomatis
    tersedia saat offline.
-   Pengguna perlu memilih file melalui file picker browser; website
    biasa tidak dapat membaca sembarang direktori komputer tanpa izin.

## 15. Batasan Browser dan Mitigasi

  -----------------------------------------------------------------------
  Batasan                 Dampak                  Mitigasi
  ----------------------- ----------------------- -----------------------
  Autoplay dibatasi       Video dengan suara      Mulai playback setelah
                          mungkin tidak langsung  klik operator
                          berjalan                

  Website melarang iframe URL tidak bisa          Beri pesan yang jelas
                          ditampilkan di output   dan sediakan aksi buka
                                                  di tab eksternal

  Output window diblokir  Browser dapat memblokir Buka output sebagai
                          popup                   respons langsung
                                                  terhadap klik pengguna

  Fullscreen memerlukan   Output mungkin tidak    Sediakan tombol
  izin/interaksi          otomatis fullscreen     fullscreen di jendela
                                                  output

  Storage quota terbatas  File besar mungkin      Tangani error kuota dan
                          gagal disimpan          jelaskan
                                                  keterbatasannya

  Output ditutup          Dashboard kehilangan    Deteksi status dan
                          target output           sediakan tombol buka
                                                  ulang

  Media tidak kompatibel  Video gagal diputar     Validasi tipe file dan
                                                  tampilkan pesan error

  Tab background dibatasi Timer atau render dapat Uji perilaku browser
                          melambat                dan jangan mengandalkan
                                                  timer untuk
                                                  sinkronisasi presisi
  -----------------------------------------------------------------------

Untuk kebutuhan yang memerlukan kontrol penuh atas file system,
penempatan jendela, atau keandalan acara jangka panjang, aplikasi
desktop berbasis Electron atau Tauri dapat dipertimbangkan sebagai tahap
lanjutan.

## 16. Rencana Pengembangan

### Tahap 1 --- Fondasi

-   Inisialisasi React, TypeScript, Vite, dan Tailwind CSS.
-   Membuat layout dashboard dan komponen UI.
-   Membuat tipe data media dan playlist.

### Tahap 2 --- Media Library

-   Menambahkan video dan gambar lokal.
-   Menambahkan URL website.
-   Menampilkan thumbnail dan metadata.
-   Membuat pencarian, filter, dan playlist.
-   Menyimpan metadata dan file ke IndexedDB.

### Tahap 3 --- Output Window

-   Membuat halaman output terpisah.
-   Mengimplementasikan BroadcastChannel.
-   Menambahkan status output dan mekanisme buka ulang.
-   Menguji fullscreen pada monitor kedua.

### Tahap 4 --- Playback dan Transisi

-   Membuat renderer video, gambar, dan web.
-   Mengimplementasikan CUT dan FADE.
-   Menambahkan Play, Pause, Loop, dan Black Screen.
-   Menambahkan keyboard shortcuts dan feedback error.

### Tahap 5 --- Pengujian

-   Menguji media yang didukung dan tidak didukung.
-   Menguji perpindahan berulang dengan cepat.
-   Menguji video panjang dan audio.
-   Menguji jendela output yang ditutup atau direfresh.
-   Menguji penyimpanan setelah browser ditutup dan dibuka kembali.
-   Menguji berbagai resolusi monitor.

## 17. Kriteria Penerimaan MVP

-   [ ] Operator dapat menambahkan video, gambar, dan URL website.
-   [ ] Dashboard dan output berada di jendela terpisah.
-   [ ] Output dapat dipindahkan ke monitor kedua dan fullscreen.
-   [ ] CUT mengganti media tanpa me-reload dashboard.
-   [ ] FADE berjalan dengan durasi yang dipilih.
-   [ ] Play, Pause, dan Loop bekerja pada video yang didukung browser.
-   [ ] Black Screen menghitamkan output tanpa menutup jendela.
-   [ ] Playlist dapat dibuat dan diurutkan.
-   [ ] Metadata dan playlist tetap tersedia setelah refresh.
-   [ ] File lokal yang dipilih dapat dipulihkan sesuai mekanisme
    penyimpanan yang diimplementasikan.
-   [ ] Error pemutaran ditampilkan dengan jelas.
-   [ ] Shortcut tidak mengganggu pengetikan pada input.
-   [ ] Jika output terputus, dashboard dapat mendeteksi dan membuka
    ulang output.

## 18. Risiko dan Rekomendasi

### Risiko utama

1.  **Website tidak dapat di-embed.** Ini adalah batasan kebijakan
    situs, bukan bug yang dapat selalu diperbaiki dari frontend.
2.  **Media lokal berukuran besar.** Penyimpanan browser memiliki batas
    dan perilakunya berbeda antarperangkat.
3.  **Perbedaan codec video.** Format file tidak menjamin codec di
    dalamnya didukung oleh browser.
4.  **Output window terputus.** Pengguna harus memperoleh indikator yang
    jelas dan mekanisme pemulihan.
5.  **Transisi video.** Menyiapkan dua video sekaligus dapat menambah
    penggunaan memori dan CPU.

### Rekomendasi

-   Bangun MVP sebagai website lokal terlebih dahulu.
-   Utamakan kestabilan CUT dan playback sebelum menambahkan efek
    lanjutan.
-   Gunakan IndexedDB untuk penyimpanan lokal yang dapat dipulihkan.
-   Tampilkan status output dan error secara eksplisit.
-   Uji pada perangkat dan monitor yang benar-benar akan digunakan.
-   Pertimbangkan versi desktop jika pengendalian jendela dan media
    lokal menjadi kebutuhan utama.

## 19. Kesimpulan

MediaDeck dirancang sebagai dashboard multimedia lokal yang memisahkan
kontrol operator dari output audiens. Fitur inti MVP mencakup media
library, output window, video/gambar/website, CUT, FADE, playlist,
playback controls, keyboard shortcuts, dan penyimpanan lokal.

Arsitektur React + TypeScript + Vite dengan IndexedDB dan
BroadcastChannel merupakan titik awal yang sederhana dan dapat
dikembangkan. Keberhasilan implementasi terutama bergantung pada
pengelolaan jendela output, kesiapan media sebelum transisi, dan
penanganan batasan browser.
