# MediaDeck v2.0

Server Go (stdlib only, tanpa dependensi eksternal) + frontend React 19/TS/Vite/Tailwind, dibundel jadi satu `mediadeck.exe`.

## Build (di mesin dengan internet, sekali saja)
Butuh Go ≥ 1.22 dan Node ≥ 18.
- Windows: `build.bat`  → menghasilkan `mediadeck.exe`
- Linux/macOS: `./build.sh` (set `GOOS=linux` dst. bila perlu)

## Pakai di lokasi acara (offline)
1. Aktifkan Windows Mobile Hotspot, sambungkan HP.
2. Jalankan `mediadeck.exe` → dashboard terbuka; QR di pojok kanan atas.
3. Scan QR dengan HP → `/remote`.
4. Klik **Open Output Window**, seret ke monitor/proyektor, klik layar sekali (fullscreen + audio).
Data tersimpan di `./data/` (media + `mediadeck.json`). Flag: `-port 8080 -data ./data -no-browser`.

## Dev
`go run ./cmd/server` (port 8080) lalu `cd web && npm run dev` (proxy ke 8080).
