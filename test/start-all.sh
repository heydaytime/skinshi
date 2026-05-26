#!/bin/bash
# Start Mock Steam API and Steam Service - All-in-one script
# This script starts everything and shows logs from both processes

set -e

echo "========================================"
echo "  Mock Steam API + Steam Service"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Kill any existing processes first
echo -e "${YELLOW}Step 1: Cleaning up old processes...${NC}"
pkill -f "mitmdump.*mock-steam-addon" 2>/dev/null || true
pkill -f "bun run src/index.ts" 2>/dev/null || true
sleep 2

# Check Redis
echo -e "${YELLOW}Step 2: Checking Redis...${NC}"
if ! redis-cli ping > /dev/null 2>&1; then
    echo -e "${RED}Redis is not running! Starting it...${NC}"
    brew services start redis
    sleep 2
    if ! redis-cli ping > /dev/null 2>&1; then
        echo -e "${RED}Failed to start Redis. Please start it manually:${NC}"
        echo "  brew services start redis"
        exit 1
    fi
fi
echo -e "${GREEN}✓ Redis is running${NC}"

# Set up auth in Redis
echo -e "${YELLOW}Step 3: Setting up Steam auth in Redis...${NC}"
cd /Users/mihirbelose/ProgrammingProjects/heydaytime/skinshi
bun run test/steam/index.ts > /dev/null 2>&1
echo -e "${GREEN}✓ Auth data set in Redis${NC}"

# Start mock server
echo -e "${YELLOW}Step 4: Starting Mock Steam API (mitmdump)...${NC}"
cd /Users/mihirbelose/ProgrammingProjects/heydaytime/skinshi/test

# Clear old log
> /tmp/mock-steam.log

# Start mitmdump in background
nohup mitmdump --mode regular@8082 -s mock-steam-addon.py > /tmp/mock-steam.log 2>&1 &
MOCK_PID=$!

# Wait for mock to be ready
echo "  Waiting for mock server to start..."
for i in {1..30}; do
    if lsof -i :8082 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Mock server running on port 8082 (PID: $MOCK_PID)${NC}"
        break
    fi
    sleep 0.5
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ Mock server failed to start${NC}"
        cat /tmp/mock-steam.log
        exit 1
    fi
done

# Show mock logs in background
tail -f /tmp/mock-steam.log | while read line; do
    echo -e "${BLUE}[MOCK]${NC} $line"
done &
TAIL_PID=$!

# Give tail a moment to start
sleep 1

# Run steam service
echo ""
echo -e "${YELLOW}Step 5: Starting Steam Service...${NC}"
echo -e "${YELLOW}       (This will show 'Got cookies!' when mock auth works)${NC}"
echo ""
echo "========================================"
echo ""

# Set environment variables and run steam service
export NODE_EXTRA_CA_CERTS="$HOME/.mitmproxy/mitmproxy-ca-cert.pem"
export HTTP_PROXY=http://localhost:8082
export HTTPS_PROXY=http://localhost:8082
export NODE_TLS_REJECT_UNAUTHORIZED=0

cd /Users/mihirbelose/ProgrammingProjects/heydaytime/skinshi/services/steam

# Trap Ctrl+C to clean up
cleanup() {
    echo ""
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    kill $TAIL_PID 2>/dev/null || true
    kill $MOCK_PID 2>/dev/null || true
    echo -e "${GREEN}✓ All processes stopped${NC}"
    exit 0
}
trap cleanup INT TERM

# Run steam service - this will block until Ctrl+C
bun run src/index.ts 2>&1 | while read line; do
    echo -e "${GREEN}[STEAM]${NC} $line"
done

# Cleanup when steam service exits
cleanup
