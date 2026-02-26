#!/usr/bin/env bash
# Emergent Privacy Stack - Management CLI
# Enterprise Architecture Control Interface

set -e

COMMAND=$1
ARGS="${@:2}"

function show_help() {
    echo "Emergent Privacy Stack CLI"
    echo ""
    echo "Usage:"
    echo "  ./manage.sh [command] [args...]"
    echo ""
    echo "VPN Control Plane (Headscale) Commands:"
    echo "  vpn-init               Create 'admin' user and generate a 24h reusable auth key."
    echo "  vpn-key                Generate a new reusable auth key for 'admin'."
    echo "  vpn-register <key>     Register a node using the provided key (for mobile devices)."
    echo "  vpn-nodes              List all connected VPN nodes."
    echo "  vpn-qr                 Generate a QR code to easily scan the custom server URL on mobile."
    echo ""
    echo "Stack Control Commands:"
    echo "  up                     Start the entire stack (with permission checks)."
    echo "  down                   Stop the entire stack."
    echo "  logs [service]         View live logs for a specific service (or all if omitted)."
    echo "                         (services: headscale, unbound, adguardhome, torproxy, dockerproxy)"
    echo ""
}

function get_admin_id() {
    docker exec headscale headscale users list -o json | awk -F': ' '/"id"/ {id=$2; sub(/,/, "", id)} /"name": "admin"/ {print id; exit}'
}

case $COMMAND in
    vpn-init)
        echo "=> Initializing VPN Control Plane namespace..."
        # Ignore error if admin already exists
        docker exec headscale headscale users create admin || true
        ADMIN_ID=$(get_admin_id)
        if [ -z "$ADMIN_ID" ]; then
            echo "Error: Could not retrieve admin user ID."
            exit 1
        fi
        echo "=> Generating 24h reusable Authentication Key for admin (ID: $ADMIN_ID)..."
        docker exec headscale headscale preauthkeys create --user $ADMIN_ID --reusable --expiration 24h
        ;;
    
    vpn-key)
        ADMIN_ID=$(get_admin_id)
        if [ -z "$ADMIN_ID" ]; then
            echo "Error: admin user not found. Run vpn-init first."
            exit 1
        fi
        echo "=> Generating new 24h reusable Authentication Key for admin (ID: $ADMIN_ID)..."
        docker exec headscale headscale preauthkeys create --user $ADMIN_ID --reusable --expiration 24h
        ;;

    vpn-register)
        if [ -z "$2" ]; then
            echo "Error: Missing node key. Usage: ./manage.sh vpn-register <key>"
            exit 1
        fi
        echo "=> Registering external node..."
        # Note: nodes register is deprecated in newer headscale, but we provide it as a fallback
        # The modern command is auth register --auth-id
        docker exec headscale headscale nodes register --user admin --key "$2" || \
        docker exec headscale headscale auth register --user admin --auth-id "$2"
        echo "=> Node registered."
        ;;
    
    vpn-nodes)
        echo "=> Querying connected nodes..."
        docker exec headscale headscale nodes list
        ;;

    vpn-qr)
        # Determine LAN IP dynamically
        LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")
        SERVER_URL="http://${LAN_IP}:6500"
        echo "=> Generating QR code for Server URL: $SERVER_URL"
        echo "=> Open the Tailscale app on your phone, go to Add Account -> Custom Server -> Scan QR"
        # Use python in an ephemeral container to generate an ASCII QR code to the terminal
        docker run --rm python:3.9-alpine sh -c "pip install qrcode > /dev/null 2>&1 && qr --ascii '$SERVER_URL'"
        ;;

    up)
        echo "=> Spinning up God-Level architecture..."
        make up
        ;;

    down)
        echo "=> Tearing down stack..."
        make down
        ;;

    logs)
        docker compose logs -f $ARGS
        ;;

    *)
        show_help
        exit 1
        ;;
esac
