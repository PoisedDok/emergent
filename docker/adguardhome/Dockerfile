FROM golang:alpine AS builder

# Install dependencies for AdGuard Home build
RUN apk add --no-cache git make npm nodejs bash python3

WORKDIR /app
COPY . .

# Build the frontend and backend using AdGuard Home's Makefile
# Re-init git to avoid submodule errors
RUN rm -rf .git && \
    git init && \
    git config user.email "test@test.com" && \
    git config user.name "Test" && \
    git commit --allow-empty -m "init" && \
    make build REVISION=dev VERSION=v0.0.0

FROM alpine:latest
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /app/AdGuardHome /opt/adguardhome/AdGuardHome

WORKDIR /opt/adguardhome

EXPOSE 53/tcp 53/udp 3000/tcp
ENTRYPOINT ["./AdGuardHome"]
