#!/bin/bash
# Setup script for mock Steam API testing

set -e

echo "=== Mock Steam API Setup ==="
echo ""

# Check if mitmproxy is installed
if ! command -v mitmproxy &> /dev/null; then
    echo "mitmproxy not found. Installing via Homebrew..."
    brew install mitmproxy
fi

echo "✓ mitmproxy is installed"

# Check if CA certificate exists
MITM_CERT="$HOME/.mitmproxy/mitmproxy-ca-cert.pem"
if [ ! -f "$MITM_CERT" ]; then
    echo ""
    echo "Generating mitmproxy CA certificate..."
    echo "Please run 'mitmproxy' once and then Ctrl+C to exit"
    echo "Then run this script again."
    exit 1
fi

echo "✓ mitmproxy CA certificate exists"

# Check if Redis is running
if ! redis-cli ping &> /dev/null; then
    echo ""
    echo "⚠️  Redis is not running. Starting Redis..."
    brew services start redis || true
    sleep 2
    if ! redis-cli ping &> /dev/null; then
        echo "❌ Failed to start Redis. Please start it manually."
        exit 1
    fi
fi

echo "✓ Redis is running"

# Setup Redis auth data
echo ""
echo "Setting up Steam auth data in Redis..."
cd /Users/mihirbelose/ProgrammingProjects/heydaytime/skinshi
bun run test/steam/index.ts

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Install the mitmproxy CA certificate:"
echo "   sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ~/.mitmproxy/mitmproxy-ca-cert.pem"
echo ""
echo "2. Start mitmproxy in one terminal:"
echo "   cd /Users/mihirbelose/ProgrammingProjects/heydaytime/skinshi/test && ./run-mock.sh"
echo ""
echo "3. Run the steam service in another terminal:"
echo "   cd /Users/mihirbelose/ProgrammingProjects/heydaytime/skinshi/services/steam && bun run src/index.ts"
echo ""
echo "Look for 'Got cookies!' message - that means auth is working!"
