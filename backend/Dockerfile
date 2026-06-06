# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM golang:1.23-alpine AS builder

# Install CA certificates (needed for outbound HTTPS calls, e.g. email APIs).
RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# Download dependencies before copying source so Docker can cache this layer.
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build a statically linked binary with all debug info stripped.
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w -extldflags '-static'" \
    -o /app/server ./cmd/server

# ── Stage 2: minimal runtime ──────────────────────────────────────────────────
FROM gcr.io/distroless/static-debian12:nonroot

# Copy timezone data and CA certs from builder.
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy the compiled binary.
COPY --from=builder /app/server /server

# Expose the API port.
EXPOSE 8080

# Run as the nonroot user provided by distroless.
USER nonroot:nonroot

ENTRYPOINT ["/server"]
