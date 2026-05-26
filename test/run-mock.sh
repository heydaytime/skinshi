#!/bin/bash
# Run the mock Steam API with mitmproxy

set -e

cd "$(dirname "$0")"

echo "=== Starting Mock Steam API ==="
echo ""
echo "This will intercept all Steam traffic and return mock responses."
echo ""

# Check if mitmproxy is installed
if ! command -v mitmproxy &> /dev/null; then
    echo "❌ mitmproxy is not installed. Run ./setup.sh first."
    exit 1
fi

# Check for CA cert
MITM_CERT="$HOME/.mitmproxy/mitmproxy-ca-cert.pem"
if [ ! -f "$MITM_CERT" ]; then
    echo "❌ mitmproxy CA certificate not found."
    echo "   Please run 'mitmproxy' once to generate it, then run this script again."
    exit 1
fi

echo "✓ Using mitmproxy CA: $MITM_CERT"
echo ""
echo "Starting mitmproxy in local mode (capturing Bun processes only)..."
echo ""
echo "Press 'q' to quit, 'f' to follow flow"
echo ""

# Check if we need to use alternative port
PORT=8080
if lsof -i :8080 > /dev/null 2>&1; then
    PORT=8082
    echo "⚠️  Port 8080 is in use, using port $PORT instead"
    echo ""
fi

# Run mitmproxy with local capture mode (captures only from this machine)
# and our mock addon
exec mitmproxy --mode local:bun@$PORT -s mock-steam-addon.py
