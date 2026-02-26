# Emergent Privacy Stack

> A self-hosted, God-level, sovereign network infrastructure with strict Zero-Trust paradigms.
>
> **Architected by [Krish Dokania](https://github.com/PoisedDok) | Built at [Aether Inc.](https://aetherinc.xyz)**

Emergent is not a typical homelab tutorial. It is a highly opinionated, brutally secure, production-ready stack for running your own private internet. It combines **Headscale** (Zero-Trust Mesh VPN), **AdGuard Home** (DNS sinkhole), **Unbound** (DNS-over-TLS), and **Tor Proxy** (The Ghost Protocol) into an impenetrable fortress.

```mermaid
flowchart TD
    %% Define Styles
    classDef client fill:#2a2a2a,stroke:#4a4a4a,stroke-width:2px,color:#fff
    classDef wireguard fill:#1e3a8a,stroke:#3a7ca5,stroke-width:2px,color:#fff
    classDef container fill:#1c1917,stroke:#c2410c,stroke-width:2px,color:#fff
    classDef external fill:#3f3f46,stroke:#71717a,stroke-width:2px,color:#fff

    subgraph Clients ["Encrypted VPN Clients"]
        phone["iPhone (Tailscale App)\nIP: 100.64.0.2"]:::client
        laptop["Windows Laptop (Tailscale)\nIP: 100.64.0.3"]:::client
    end

    subgraph Tunnel ["The Transport Layer"]
        wg["WireGuard Encrypted Tunnel\n(Direct Peer-to-Peer)"]:::wireguard
    end

    subgraph Server ["Mac Mini (Docker Host)"]
        hs["Headscale Control Plane\nPort: 6500 (Auth & IP Assign)"]:::container
        
        subgraph DNS_Flow ["DNS Resolution Path"]
            ag["AdGuard Home\nIP: 100.64.0.1:53\n(Ad/Tracker Blackhole)"]:::container
            mdns["Headscale MagicDNS\nIP: 100.100.100.100\n(Client Name Resolver)"]:::container
            un["Unbound\nIP: 172.20.0.10\n(DNS-over-TLS)"]:::container
        end

        subgraph Proxy_Flow ["Tor Proxy Path"]
            tor["Tor Proxy\nIP: 100.64.0.1:6506 (HTTP)"]:::container
        end
    end

    subgraph External ["The Wild West"]
        isp["Your ISP\n(Sees Only Encrypted Gibberish)"]:::external
        cf["Cloudflare DNS (1.1.1.1:853)"]:::external
        tornet["The Tor Network"]:::external
        web["Internet / .onion sites"]:::external
    end

    %% Auth Flow
    phone -.->|"1. Auth Request"| hs
    laptop -.->|"1. Auth Request"| hs

    %% Data Flow
    phone <==>|"2. WireGuard Data"| wg
    laptop <==>|"2. WireGuard Data"| wg
    
    wg <==>|"3. DNS Queries"| ag
    wg <==>|"3. Proxy Traffic"| tor

    %% Internal DNS Logic
    ag -->|"Who is 100.64.0.2?"| mdns
    mdns -.->|"It's krish-phone"| ag
    ag -->|"Where is google.com?"| un

    %% Outbound
    un -->|"Encrypted DNS Query"| isp
    tor -->|"Encrypted Onion Traffic"| isp
    
    isp -->cf
    isp -->tornet
    tornet -->web
```

## Why This Stack is Different (The Philosophy)

### Built by Aether Inc.
At [Aether Inc.](https://aetherinc.xyz), we build "The Assistant That Actually Knows You. (And Keeps Your Secrets.)" Our core mission is absolute privacy—an AI companion that operates without sharing a single word with the internet. We realize that true digital sovereignty requires an underlying network architecture that is just as paranoid and secure as the software running on top of it. **The Emergent Stack is that architecture.** We are open-sourcing it because privacy is a fundamental human right, not a premium feature.

Most open-source stack tutorials make critical security flaws:
1. They bind internal administration dashboards to `0.0.0.0` (exposing them to the entire local Wi-Fi network).
2. They map the raw Docker socket into containers, allowing easy privilege escalation.
3. They rely on pre-built Docker hub images which are susceptible to supply-chain attacks.
4. They break client-level tracking when routing DNS through a VPN, resulting in a single anonymous client IP making 10,000 queries.

**The Emergent Stack fixes all of this:**
*   **Immutable Supply Chain:** The `docker-compose.yml` does not pull image binaries. It uses Git Submodules to pull the source code of Headscale and AdGuard, building the binaries locally on your machine via multi-stage Dockerfiles.
*   **Zero-Trust Bindings:** AdGuard Home and Tor Proxy ports are bound *exclusively* to the Headscale VPN IP (`100.64.0.1`) and `127.0.0.1`. If an attacker gets onto your physical Wi-Fi, they will scan your server and see absolutely nothing.
*   **Hardened Docker Socket:** The raw `/var/run/docker.sock` is locked behind a strict, read-only `docker-socket-proxy`.
*   **Dynamic DNS Tracking:** AdGuard Home is wired back into Headscale's MagicDNS (`100.100.100.100`). When a connected VPN client queries a domain, AdGuard dynamically resolves their Tailscale IP to their machine hostname. You get perfect, per-device traffic statistics without manually hardcoding IPs.
*   **Automatic Exit Node:** The included `acl.json` is pre-configured to automatically approve `0.0.0.0/0` routes. This allows your host machine to instantly function as an encrypted Exit Node for your mobile devices on public Wi-Fi.

## Architecture & Data Flow

1.  **Headscale (Port 6500):** Acts purely as the Control Plane. It authenticates devices and brokers WireGuard keys. It does *not* route data.
2.  **WireGuard:** Once authenticated, clients form a direct, encrypted, peer-to-peer tunnel with the server.
3.  **AdGuard Home:** Intercepts all DNS queries from the WireGuard tunnel. If the domain is an ad tracker, it drops the connection.
4.  **Unbound:** If AdGuard allows the request, it is forwarded to the local Unbound container, which wraps the query in military-grade TLS and sends it to Cloudflare (`1.1.1.1:853`). Your ISP cannot see your DNS requests.
5.  **Tor Proxy (Port 6506):** An isolated container. When your browser requests a `.onion` address, the traffic is routed over the VPN, injected into the Tor proxy, and bounced through 3 global nodes.

## Prerequisites

*   A Linux or macOS host server (e.g., a Mac Mini, Raspberry Pi, or VPS).
*   Docker and Docker Compose installed.
*   Git installed.
*   Optional: The Tailscale app installed on your client devices (iOS, Android, Windows, Mac).

## 1-Click Deployment

1.  **Clone the repository and its submodules:**
    ```bash
    git clone https://github.com/PoisedDok/emergent.git
    cd emergent
    make setup
    ```
2.  **Configure Environment:**
    ```bash
    cp .env.example .env
    ```
    *(Edit `.env` to change the arbitrary ports if desired, default is 6500-6550).*
3.  **Build from Source:**
    ```bash
    make build
    ```
4.  **Launch the God-Level Stack:**
    ```bash
    make up
    ```

## Managing the Stack (`manage.sh`)

We built a custom CLI wrapper to make administering this complex stack trivial.

1.  **Initialize the VPN:**
    ```bash
    ./manage.sh vpn-init
    ```
    *This creates the `admin` user and generates your first 24-hour Headscale pre-auth key.*
2.  **Connect a Mobile Device:**
    ```bash
    ./manage.sh vpn-qr
    ```
    *This generates an ASCII QR code in your terminal. Open the Tailscale app on your phone -> Settings -> Accounts -> Add Account -> Custom Control Server -> Scan QR.*
3.  **View Connected Devices:**
    ```bash
    ./manage.sh vpn-nodes
    ```

## Post-Setup Tasks

1.  **Access the AdGuard Dashboard:**
    *   Ensure your client is connected to the VPN.
    *   Navigate to `http://100.64.0.1:6502` (or `http://127.0.0.1:6502` if on the host machine).
    *   Default Login: `admin` / `emergent`.
    *   *Change this password immediately in Settings -> General Settings.*
2.  **Access the Tor Network:**
    *   On your laptop, install a proxy extension like [Proxy SwitchyOmega](https://chrome.google.com/webstore/detail/proxy-switchyomega/padekgcemlokbodaoccmeicigpcbgilc) or FoxyProxy.
    *   Create a new profile: Protocol `HTTP`, Server `100.64.0.1`, Port `6506`.
    *   You can now resolve `.onion` addresses.

## License & Attribution

This project is licensed under the MIT License. Copyright (c) 2026 Krish Dokania / Aether Inc.

This stack integrates and heavily relies on the brilliance of the following open-source projects. We have embedded them as submodules to allow you to build from source:
*   [Headscale](https://github.com/juanfont/headscale) by Juan Font (BSD-3-Clause)
*   [AdGuard Home](https://github.com/AdguardTeam/AdGuardHome) by AdGuard (GPL-3.0)
*   [Unbound Docker](https://github.com/MatthewVance/unbound-docker) by Matthew Vance (MIT)
*   [Tor Proxy](https://github.com/gnzsnz/torproxy) by gnzsnz (MIT)
*   [Docker Socket Proxy](https://github.com/Tecnativa/docker-socket-proxy) by Tecnativa (MIT)
