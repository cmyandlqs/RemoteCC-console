#!/usr/bin/env bash
set -euo pipefail

URL_FILE="$HOME/.agent-console/tunnel-url.txt"
LOG_FILE="$HOME/.agent-console/tunnel.log"
mkdir -p "$(dirname "$URL_FILE")" "$(dirname "$LOG_FILE")"

echo "[$(date)] Starting cloudflared quick tunnel..." >> "$LOG_FILE"

export PATH="$HOME/bin:$PATH"

cloudflared tunnel --protocol http2 --url http://localhost:4174 2>&1 | while IFS= read -r line; do
  echo "[$(date)] $line" >> "$LOG_FILE"

  if echo "$line" | grep -qoP 'https://[a-z0-9-]+\.trycloudflare\.com'; then
    url=$(echo "$line" | grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com')
    echo "$url" > "$URL_FILE"
    echo "[$(date)] Tunnel URL: $url" >> "$LOG_FILE"
    echo "Tunnel URL: $url"
    echo "Saved to $URL_FILE"
  fi
done
