# MediaDeck --- Desain UI Dashboard

**Jenis dokumen:** UI/UX Design Specification\
**Versi:** 1.0\
**Status:** Rancangan desain\
**Produk:** MediaDeck --- Dual-Screen Media Controller\
**Gaya visual:** Dark Broadcast Control Room + Visual Media Library

------------------------------------------------------------------------

## 1. Tujuan Desain

Dokumen ini mendefinisikan rancangan antarmuka pengguna (UI) MediaDeck
berdasarkan layout dashboard yang dipilih. Antarmuka ditujukan bagi
operator yang perlu mengelola dan mengganti media dengan cepat saat
presentasi, seminar, acara kampus, pemutaran video promosi, dan kegiatan
multimedia.

Dashboard berjalan pada monitor operator. Media yang dipilih ditampilkan
pada jendela output terpisah yang dapat dipindahkan ke monitor eksternal
dan diatur ke mode fullscreen.

### Prinsip desain

1.  **Cepat dioperasikan:** aksi utama mudah dijangkau dan hanya
    membutuhkan sedikit langkah.
2.  **Preview berbeda dari Output:** operator dapat membedakan media
    yang sedang aktif dengan media yang akan ditampilkan.
3.  **Kontras tinggi:** informasi penting mudah dibaca dalam kondisi
    acara.
4.  **Status jelas:** output, playback, loading, dan error memiliki
    indikator yang konsisten.
5.  **Minim distraksi:** hindari dekorasi, animasi, dan warna aksen
    berlebihan.
6.  **Desktop-first:** layout dioptimalkan untuk komputer dengan monitor
    operator dan monitor eksternal.

## 2. Arah Visual

### Nama style

**Dark Broadcast Control Room**

Gabungkan struktur panel dari perangkat lunak broadcast dengan media
library visual yang menggunakan thumbnail. UI harus terasa profesional,
ringkas, dan fungsional.

### Karakter visual

-   Latar gelap netral.
-   Panel bertingkat dengan perbedaan warna yang halus.
-   Teal sebagai aksen utama.
-   Merah hanya untuk status LIVE atau tindakan berisiko.
-   Kuning untuk warning atau status loading.
-   Thumbnail media menjadi fokus visual di library.
-   Tombol utama memiliki label teks yang jelas, bukan ikon saja.
-   Radius sudut sederhana dan bayangan minimal.

## 3. Design Tokens

### 3.1 Palet warna

  Token                      Hex         Penggunaan
  -------------------------- ----------- ----------------------------------------
  `--bg-app`                 `#111318`   Latar utama aplikasi
  `--bg-panel`               `#1B1E26`   Panel, sidebar, dan toolbar
  `--bg-elevated`            `#282D38`   Item library, tombol sekunder, kontrol
  `--bg-hover`               `#343A47`   Hover pada item dan tombol
  `--border-default`         `#343741`   Border panel dan pemisah
  `--text-primary`           `#F4F5F7`   Teks utama
  `--text-secondary`         `#B6BAC5`   Deskripsi dan metadata
  `--text-muted`             `#858B99`   Label tambahan
  `--accent-primary`         `#20B8A6`   Aksi utama, pilihan aktif, fokus
  `--accent-primary-hover`   `#39C9B8`   Hover aksi utama
  `--status-live`            `#EF6262`   Indikator LIVE dan peringatan kritis
  `--status-warning`         `#E9B44C`   Loading, warning, perhatian
  `--status-success`         `#39C98A`   Output siap dan operasi berhasil
  `--status-error`           `#EF6262`   Error pemuatan media

Pastikan kontras teks memenuhi kebutuhan keterbacaan. Jangan
mengandalkan warna saja untuk menyampaikan status; gunakan label atau
ikon pendamping.

### 3.2 Tipografi

-   **Font utama:** Inter atau Geist.
-   **Judul halaman:** 22--24 px, semibold.
-   **Judul panel:** 14--16 px, semibold.
-   **Teks utama dan tombol:** 13--14 px.
-   **Metadata:** 11--12 px.
-   **Label kecil:** 10--11 px, medium, dapat menggunakan huruf kapital.

Gunakan angka tabular untuk durasi dan nilai yang berubah, jika
tersedia. Hindari teks terlalu kecil pada kontrol yang sering digunakan.

### 3.3 Spacing dan bentuk

  Token           Nilai Penggunaan
  ------------- ------- ---------------------------------
  `space-1`        4 px Jarak ikon dan label
  `space-2`        8 px Jarak antar-kontrol kecil
  `space-3`       12 px Padding item
  `space-4`       16 px Padding panel
  `space-5`       20 px Jarak antarbagian
  `space-6`       24 px Jarak kelompok utama
  `radius-sm`      4 px Badge dan elemen kecil
  `radius-md`      8 px Tombol, input, dan item
  `radius-lg`     12 px Panel dan preview
  `radius-xl`     16 px Container utama jika diperlukan

Gunakan border tipis dan bayangan minimal. Panel harus dibedakan
terutama melalui warna permukaan dan jarak, bukan bayangan tebal.

## 4. Struktur Layout Dashboard

### 4.1 Kerangka utama

Dashboard desktop menggunakan tiga area utama:

1.  **Kolom kiri --- Media Library**
    -   Lebar rekomendasi: 240--300 px.
    -   Berisi pencarian, filter tipe media, tombol tambah media, dan
        grid thumbnail.
2.  **Kolom tengah --- Preview dan Controls**
    -   Mengambil ruang terbesar.
    -   Berisi Program/Output Preview, Next Preview, transition
        controls, dan playback controls.
3.  **Kolom kanan --- Playlist dan Properties**
    -   Lebar rekomendasi: 240--300 px.
    -   Berisi urutan media, detail item terpilih, dan pengaturan
        output.

Header berada di bagian atas dengan tinggi sekitar 56--64 px. Panel
dapat memiliki scroll masing-masing agar kontrol utama tetap terlihat.

### 4.2 Wireframe konseptual

``` text
┌──────────────────────────────────────────────────────────────────────────────┐
│ MediaDeck                                      ● PROGRAM   ● OUTPUT READY    │
├───────────────────┬─────────────────────────────────────┬────────────────────┤
│ MEDIA LIBRARY     │ PROGRAM · OUTPUT  │ PREVIEW · NEXT  │ PLAYLIST           │
│ [ Search...     ] │ ┌───────────────┐ │ ┌─────────────┐ │ [1] Opening.mp4    │
│ [ + Add Media   ] │ │               │ │ │             │ │ [2] Sponsor.png    │
│ [All][Video][Img] │ │  Live Media   │ │ │ Next Media  │ │ [3] Website        │
│                   │ │               │ │ │             │ │                    │
│ [Thumbnail]      │ └───────────────┘ │ └─────────────┘ │ PROPERTIES         │
│ [Thumbnail]      │                   │                  │ Name / Type        │
│ [Thumbnail]      │ TRANSITION         │                  │ Loop / Fit         │
│ [Thumbnail]      │ [ CUT ] [ FADE ]   │                  │                    │
│                   │ [Play][Pause][Loop][Black]           │ OUTPUT SETTINGS    │
│                   │                                       │ [ Open Output ]    │
└───────────────────┴─────────────────────────────────────┴────────────────────┘
```

Wireframe ini menunjukkan struktur informasi, bukan ukuran final setiap
komponen.

## 5. Header

### Elemen

-   Ikon aplikasi dan nama `MediaDeck`.
-   Indikator status output.
-   Indikator status Program.
-   Tombol pengaturan.
-   Opsional: indikator jendela output terhubung atau terputus.

### Perilaku

-   `OUTPUT READY`: output terbuka dan siap menerima perintah.
-   `OUTPUT DISCONNECTED`: jendela output tidak terhubung atau tidak
    merespons.
-   `LOADING`: media sedang dipersiapkan.
-   `ERROR`: media atau output mengalami kegagalan.

Gunakan badge dan teks; jangan mengandalkan titik warna saja.

## 6. Media Library --- Kolom Kiri

### Komponen

1.  Judul `Media Library`.
2.  Pencarian berdasarkan nama.
3.  Tombol `+ Add Media`.
4.  Filter `All`, `Video`, `Image`, `Web`.
5.  Grid atau daftar thumbnail.
6.  Menu item untuk rename, remove, atau melihat detail.

### Kartu media

Setiap kartu menampilkan:

-   Thumbnail atau placeholder.
-   Nama file atau judul.
-   Badge tipe media: VIDEO, IMAGE, atau WEB.
-   Durasi untuk video jika tersedia.
-   Penanda terpilih.
-   Menu tindakan sekunder.

### Interaksi

-   Klik item: memuat item ke area Preview/Next.
-   Aksi `Take to Output`: mengirim media ke output menggunakan mode
    transisi aktif.
-   Drag-and-drop: dapat digunakan untuk mengubah urutan playlist jika
    implementasi mendukungnya.
-   Item yang sedang aktif diberi border atau indikator program yang
    berbeda dari item terpilih.

Jangan langsung menampilkan item hanya karena thumbnail diklik; gunakan
alur Preview lalu Take to Output agar operator tidak salah mengubah
layar audiens.

## 7. Program Preview dan Next Preview --- Kolom Tengah

### 7.1 Program / Output

Menunjukkan media yang sedang ditayangkan. Jika output window belum
terhubung, tampilkan placeholder dan status koneksi.

Label yang digunakan: `PROGRAM · OUTPUT`.

### 7.2 Preview / Next

Menunjukkan media yang dipilih untuk ditayangkan berikutnya. Label yang
digunakan: `PREVIEW · NEXT`.

### Aturan visual

-   Kedua preview memiliki rasio dasar 16:9.
-   Gunakan letterbox/pillarbox bila rasio media berbeda.
-   Jangan memotong gambar tanpa alasan.
-   Tampilkan nama media dan status loading secara ringkas.
-   Gunakan border teal atau indikator yang konsisten untuk item yang
    dipilih.
-   Program dan Preview harus mudah dibedakan melalui label, bukan warna
    saja.

### Aksi utama

Tombol `TAKE TO OUTPUT` harus mudah ditemukan setelah operator memilih
media. Pada layout lebar, tombol dapat berada di bawah Next Preview atau
di dekat kontrol transisi.

## 8. Transition Controls

### Pilihan mode

-   **CUT:** mengganti media secara instan.
-   **FADE:** mengganti media dengan animasi opacity.

### Rancangan komponen

-   Dua tombol segmented: `CUT` dan `FADE`.
-   Jika FADE aktif, tampilkan pilihan durasi.
-   Durasi default: 500 ms.
-   Pilihan durasi: 250 ms, 500 ms, 1 detik, 2 detik.
-   Mode aktif menggunakan warna aksen teal dan label aktif.
-   Mode tidak aktif menggunakan surface sekunder.

CUT harus terlihat sebagai opsi yang berbeda, bukan sebagai tombol
destructive. FADE tidak boleh menjalankan transisi sampai operator
mengirim media ke output.

## 9. Playback Controls

Kontrol yang tersedia:

  -----------------------------------------------------------------------
  Kontrol                 Fungsi                  Ketentuan UI
  ----------------------- ----------------------- -----------------------
  Play                    Memulai video           Dinonaktifkan jika
                                                  media bukan video atau
                                                  belum siap

  Pause                   Menjeda video           Status aktif hanya saat
                                                  video berjalan

  Loop                    Mengulang video         Tampilkan status on/off
                                                  dengan jelas

  Black Screen            Menghitamkan output     Beri status aktif dan
                                                  cara kembali yang jelas

  Take to Output          Menampilkan media       Aksi utama dan mudah
                          terpilih                ditemukan
  -----------------------------------------------------------------------

Black Screen harus menjadi overlay atau state output, bukan menutup
jendela. Ketika aktif, dashboard menunjukkan status
`BLACK SCREEN ACTIVE`.

## 10. Playlist dan Properties --- Kolom Kanan

### 10.1 Playlist

Setiap baris playlist menampilkan:

-   Nomor urut.
-   Thumbnail kecil atau ikon jenis media.
-   Nama media.
-   Menu untuk memindahkan, menghapus, atau mengatur item.
-   Indikator media aktif dan item berikutnya.

Fitur minimum: tambah ke playlist, pilih item, hapus item, dan ubah
urutan. Drag-and-drop menjadi peningkatan yang disarankan.

### 10.2 Properties

Menampilkan detail media terpilih:

-   Nama.
-   Tipe.
-   Durasi jika tersedia.
-   Sumber atau URL.
-   Opsi playback yang relevan.
-   Mode penyesuaian tampilan: `Contain` atau `Cover`, dengan `Contain`
    sebagai default untuk menghindari pemotongan.

### 10.3 Output Settings

-   Tombol `Open Output`.
-   Status jendela output.
-   Instruksi singkat untuk memindahkan jendela ke monitor kedua.
-   Tombol atau petunjuk `Enter Fullscreen`.
-   Opsi rasio atau fit mode jika diperlukan.

Browser mungkin memerlukan interaksi pengguna untuk membuka jendela atau
mengaktifkan fullscreen. UI harus menjelaskan langkah tersebut dan tidak
menjanjikan penempatan monitor otomatis.

## 11. Output Display UI

Output adalah jendela terpisah dan tidak menampilkan kontrol dashboard.

### Keadaan output

1.  **Ready:** placeholder netral ketika belum ada media.
2.  **Loading:** indikator loading yang tidak mengganggu.
3.  **Playing:** video atau halaman media aktif.
4.  **Black Screen:** layar hitam penuh.
5.  **Error:** pesan error minimal jika media gagal dimuat.

### Aturan tampilan

-   Tidak ada header dashboard.
-   Tidak ada thumbnail library atau playlist.
-   Background hitam atau warna netral.
-   Media mengikuti ukuran viewport.
-   Video menggunakan kontrol tersembunyi pada mode output, kecuali
    kontrol diperlukan untuk troubleshooting.
-   Klik atau keyboard operator tidak boleh mengubah konten output
    secara tidak sengaja.

## 12. Micro-interactions dan Feedback

  -----------------------------------------------------------------------
  Aksi                                Feedback
  ----------------------------------- -----------------------------------
  Hover kartu media                   Border atau surface sedikit berubah

  Memilih media                       Kartu mendapat indikator selected

  Media sedang loading                Spinner dan label `Loading`

  Take to Output berhasil             Status program diperbarui

  Output terputus                     Warning dengan aksi `Reconnect`

  File tidak didukung                 Pesan error dan saran format

  URL tidak bisa di-embed             Penjelasan batasan iframe dan opsi
                                      membuka eksternal

  Black Screen aktif                  Badge `BLACK SCREEN ACTIVE`

  Playlist berubah                    Perubahan tersimpan atau status
                                      penyimpanan ditampilkan
  -----------------------------------------------------------------------

Gunakan animasi pendek dan tidak berlebihan. Hindari animasi yang
menunda tindakan operator.

## 13. Keyboard Shortcuts

  Tombol          Aksi
  --------------- --------------------------------------------
  `Space`         Play/Pause video sesuai konteks
  `Enter`         Take selected media to output
  `Arrow Right`   Pilih item berikutnya
  `Arrow Left`    Pilih item sebelumnya
  `C`             Pilih CUT
  `F`             Pilih FADE
  `B`             Toggle Black Screen
  `L`             Toggle Loop
  `Esc`           Keluar fullscreen jika browser mengizinkan

Tampilkan daftar shortcut melalui tooltip atau dialog
`Keyboard Shortcuts`. Shortcut harus dinonaktifkan saat fokus berada
pada input, textarea, atau kontrol teks lain.

## 14. Responsivitas

### Desktop lebar (≥ 1440 px)

-   Tampilkan tiga kolom sekaligus.
-   Dua preview berdampingan.
-   Media library menampilkan grid thumbnail.
-   Playlist dan properties tetap terlihat.

### Desktop sedang (1024--1439 px)

-   Pertahankan library dan area preview.
-   Kolom kanan dapat diperkecil atau menjadi panel tab.
-   Pastikan tombol CUT, FADE, dan Take to Output tetap mudah dijangkau.

### Layar sempit (\< 1024 px)

-   Tampilkan peringatan bahwa mode operator paling nyaman pada desktop.
-   Ubah kolom menjadi tab: `Library`, `Control`, `Playlist`.
-   Jangan mengasumsikan layar sempit cocok untuk mengoperasikan acara
    secara penuh.

Output display harus responsif terhadap resolusi monitor, terpisah dari
responsivitas dashboard.

## 15. Aksesibilitas dan Usability

-   Gunakan teks dan ikon untuk kontrol penting.
-   Pastikan fokus keyboard terlihat.
-   Berikan label aksesibel pada ikon tanpa teks.
-   Jangan menggunakan warna sebagai satu-satunya indikator status.
-   Pastikan area klik cukup besar untuk penggunaan cepat.
-   Sediakan konfirmasi untuk aksi yang dapat menghentikan output atau
    menghapus banyak item.
-   Hindari dialog konfirmasi pada aksi rutin seperti memilih media atau
    menjalankan CUT.

## 16. Rekomendasi Implementasi UI

-   **Framework:** React + TypeScript + Vite.
-   **Styling:** Tailwind CSS.
-   **Komponen:** shadcn/ui untuk dialog, dropdown, tabs, tooltip, dan
    input.
-   **Ikon:** Lucide.
-   **State management:** React state untuk tahap awal; Zustand jika
    state lintas komponen semakin kompleks.
-   **Animasi:** CSS transitions untuk FADE dan feedback UI.
-   **Layout:** CSS Grid untuk tiga kolom dan Flexbox untuk kontrol.
-   **Output:** halaman/jendela terpisah dengan renderer video, gambar,
    dan iframe.

Gunakan design tokens untuk warna, spacing, radius, dan tipografi agar
konsistensi mudah dijaga.

## 17. Checklist Implementasi Desain

-   [ ] Header menampilkan nama aplikasi dan status output.
-   [ ] Media library memiliki pencarian, filter, tombol tambah, dan
    thumbnail.
-   [ ] Program Preview berbeda jelas dari Next Preview.
-   [ ] CUT dan FADE selalu mudah ditemukan.
-   [ ] Durasi FADE hanya terlihat atau aktif ketika FADE dipilih.
-   [ ] Playback controls memiliki state enabled/disabled yang benar.
-   [ ] Playlist dapat menampilkan item aktif dan item berikutnya.
-   [ ] Properties menyesuaikan jenis media yang dipilih.
-   [ ] Output display tidak menampilkan kontrol operator.
-   [ ] Black Screen memiliki status aktif yang jelas.
-   [ ] Loading, error, dan disconnected state memiliki desain.
-   [ ] Layout tetap dapat digunakan pada lebar desktop sedang.
-   [ ] Fokus keyboard dan label aksesibel tersedia.
-   [ ] UI tidak bergantung pada warna saja untuk menyampaikan status.

## 18. Kesimpulan

MediaDeck menggunakan gaya **Dark Broadcast Control Room + Visual Media
Library**. Layout tiga kolom menempatkan media library di kiri, Program
dan Preview serta kontrol di tengah, dan playlist serta properties di
kanan.

Prioritas desain adalah memisahkan media aktif dari media berikutnya,
menjaga CUT/FADE tetap mudah dijangkau, dan memberikan status yang jelas
saat output siap, loading, terputus, atau mengalami error. Desain ini
menjadi acuan implementasi UI MVP MediaDeck.
