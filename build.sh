#!/bin/sh
set -e
(cd web && npm install && npm run build)
GOOS=${GOOS:-windows} GOARCH=${GOARCH:-amd64} go build -ldflags "-s -w" -o mediadeck$([ "${GOOS:-windows}" = windows ] && echo .exe) ./cmd/server
