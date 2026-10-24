# Stage 1: Build Frontend React
FROM node:20-alpine AS frontend-builder
WORKDIR /app/web
COPY web/package*.json ./
RUN npm install
COPY web/ ./
RUN npm run build

# Stage 2: Build Backend Golang dengan Embedded Frontend
FROM golang:1.23-alpine AS backend-builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
COPY --from=frontend-builder /app/web/dist ./web/dist
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o mediadeck ./cmd/server

# Stage 3: Runner Container Super Ringan
FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=backend-builder /app/mediadeck .
RUN mkdir -p /app/data/media

EXPOSE 8080
ENV PORT=8080
CMD ["./mediadeck", "-data", "/app/data"]
