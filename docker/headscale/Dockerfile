FROM golang:alpine AS builder

# Install build dependencies
RUN apk add --no-cache git make

WORKDIR /app
COPY . .

# Build headscale
RUN CGO_ENABLED=0 go build -o headscale -ldflags="-s -w" ./cmd/headscale

FROM alpine:latest
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /app/headscale /usr/local/bin/headscale

# Setup headscale environment
RUN mkdir -p /var/lib/headscale /etc/headscale

EXPOSE 8080
ENTRYPOINT ["headscale"]
