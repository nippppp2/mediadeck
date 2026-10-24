@echo off
REM Build frontend lalu binary tunggal Windows. Butuh Node.js + Go (hanya di mesin build).
cd web || exit /b 1
call npm install || exit /b 1
call npm run build || exit /b 1
cd ..
set GOOS=windows
set GOARCH=amd64
go build -ldflags "-s -w" -o mediadeck.exe ./cmd/server || exit /b 1
echo Selesai: mediadeck.exe
