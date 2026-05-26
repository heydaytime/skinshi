# Mock Steam API - Complete Documentation

## Overview

This mock Steam API intercepts all Steam traffic using **mitmproxy** and returns fake responses, allowing the steam service to run without connecting to real Steam servers. All traffic stays on your local machine.

## Architecture

```
Steam Service (port 8001)
    ↓ HTTP_PROXY/HTTPS_PROXY
mitmproxy (port 8082)
    ↓ Intercepts requests to:
       - api.steampowered.com
       - login.steampowered.com
       - steamcommunity.com
    ↓ Returns mock responses
Mock Steam Addon (Python)
    ↓ Manages state
Redis (caching, auth)
```

## File Structure

```
test/
├── mock-steam-addon.py      # Main mitmproxy addon - intercepts all Steam traffic
├── start-all.sh             # One-command startup script
├── setup.sh                 # Initial setup (install mitmproxy, certs)
├── run-mock.sh              # Start just the mock server
├── test-mock.ts             # Test script for endpoints
├── mock-data/               # Data generators (optional, mostly inline now)
│   ├── profiles.py
│   ├── inventories.py
│   └── items.py
├── steam/
│   └── index.ts             # Sets auth credentials in Redis
└── DOCS.md                  # This file
```

## Critical Implementation Details

### 1. Certificate Trust (THE BIGGEST PITFALL)

**Problem:** Steam libraries (steam-session, steamcommunity) use Node's HTTPS which validates certificates strictly.

**Solution:** 
```bash
# Install mitmproxy CA certificate system-wide
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ~/.mitmproxy/mitmproxy-ca-cert.pem

# Then run steam service with these env vars:
export NODE_EXTRA_CA_CERTS="$HOME/.mitmproxy/mitmproxy-ca-cert.pem"
export HTTP_PROXY=http://localhost:8082
export HTTPS_PROXY=http://localhost:8082
```

**Without this:** You'll get `ECONNREFUSED` or certificate validation errors.

### 2. Local Mode vs Regular Mode

**Attempted:** `mitmproxy --mode local:bun` to capture only Bun processes

**Reality:** `--mode local:bun` doesn't work reliably. Use regular proxy mode instead:
```bash
mitmdump --mode regular@8082 -s mock-steam-addon.py
```

Then explicitly set `HTTP_PROXY`/`HTTPS_PROXY` environment variables.

### 3. Response Format Gotchas

**Protobuf vs JSON:**
- steam-session library uses protobuf internally
- But WebAPI transport expects JSON responses with `response` wrapper
- The library decodes JSON then converts to protobuf

**Required headers:**
```python
headers = {
    "Content-Type": "application/json",
    "X-eresult": "1",  # EResult.OK - critical for auth success
}
```

**Set-Cookie header format:**
- mitmproxy's `Response.make()` expects cookies as string, not list
- Multiple cookies require special handling

### 4. Auth Flow Sequence

The steam-session library follows this exact sequence:

1. `GetPasswordRSAPublicKey` - Gets RSA key for password encryption
2. `BeginAuthSessionViaCredentials` - Starts auth session
3. `PollAuthSessionStatus` - Returns refresh/access tokens
4. `jwt/finalizelogin` - Exchanges tokens for web cookies
5. Multiple `login/settoken` calls - Sets cookies on various domains
6. SteamCommunity/TradeManager initialize with cookies

**Critical:** Each step must return the exact format expected or the library throws errors.

### 5. Inventory State Persistence

**State file:** `/tmp/mock-steam-state.json`

This file persists across mock restarts. Contains:
- `bot_inventory`: Items owned by bot (76561198773889166)
- `shared_inventory`: Items owned by shared account (76561199001917145)
- `next_asset_id`: Counter for generating unique assetids

**To reset:** `rm /tmp/mock-steam-state.json`

### 6. Trade Mechanics

**Trade endpoint:** `POST /trade/send` on steam service

**What happens:**
1. Steam service sends trade to steamcommunity.com/tradeoffer/new/send
2. Mock intercepts, parses `json_tradeoffer` form parameter
3. Mock moves items between inventories:
   - `theirAssets` → FROM shared TO bot
   - `myAssets` → FROM bot TO shared
4. Items get NEW assetids when moved (to simulate Steam behavior)
5. State saved to `/tmp/mock-steam-state.json`

**Item format:**
```json
{
  "appid": "730",
  "contextid": "2",
  "assetid": "50000000001",  // Unique per item
  "classid": "5710094579",   // Shared by same case type
  "instanceid": "123456789",
  "icon_url": "...",
  "background_color": "393b3e",
  "name": "Kilowatt Case"
}
```

### 7. Two-Account System

**Bot Account** (76561198773889166):
- Profile: HeyDayTime (offline)
- Inventory: Initially empty
- This is who the steam service is logged in as

**Shared Account** (76561199001917145 + all other SteamIDs):
- Profile: HeyDay (online)
- Inventory: 1000 cases initially
- Any SteamID except the bot maps to this account

## How to Use

### Quick Start

```bash
# One command to start everything
cd /Users/mihirbelose/ProgrammingProjects/heydaytime/skinshi/test
./start-all.sh

# You'll see logs from both mock [MOCK] and steam service [STEAM]
# Look for: "Got cookies!" and "Ready to trade."
```

### Manual Start (if you need control)

**Terminal 1 - Mock:**
```bash
cd /Users/mihirbelose/ProgrammingProjects/heydaytime/skinshi/test
mitmdump --mode regular@8082 -s mock-steam-addon.py
```

**Terminal 2 - Steam Service:**
```bash
export NODE_EXTRA_CA_CERTS="$HOME/.mitmproxy/mitmproxy-ca-cert.pem"
export HTTP_PROXY=http://localhost:8082
export HTTPS_PROXY=http://localhost:8082
cd /Users/mihirbelose/ProgrammingProjects/heydaytime/skinshi/services/steam
bun run src/index.ts
```

### Test Endpoints

```bash
# Bot profile (steam service's account)
curl http://localhost:8001/profile/id/76561198773889166

# Shared profile (any other SteamID)
curl http://localhost:8001/profile/id/76561199001917145

# Bot inventory
curl http://localhost:8001/inventory/mine

# Shared inventory
curl http://localhost:8001/inventory/id/76561199001917145

# Trade (move item from shared to bot)
curl -X POST http://localhost:8001/trade/send \
  -H "Content-Type: application/json" \
  -d '{
    "tradeUrl": "https://steamcommunity.com/tradeoffer/new/?partner=123456&token=abc123",
    "message": "Test trade",
    "myAssets": [],
    "theirAssets": [{
      "appid": "730",
      "contextid": "2",
      "assetid": "50000000001",
      "amount": 1
    }]
  }'
```

### Direct Mock Access (Bypasses Steam Service Cache)

Sometimes the steam service caches data in Redis. To see actual mock state:

```bash
# Bot inventory directly from mock
curl -x http://localhost:8082 \
  'https://steamcommunity.com/inventory/76561198773889166/730/2?l=english&count=1000' | jq

# Shared inventory directly from mock
curl -x http://localhost:8082 \
  'https://steamcommunity.com/inventory/76561199001917145/730/2?l=english&count=1000' | jq
```

## Common Issues & Solutions

### Issue: "ECONNREFUSED" or "unable to verify the first certificate"

**Cause:** Certificate not trusted or proxy not set

**Fix:**
```bash
# Re-install certificate
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ~/.mitmproxy/mitmproxy-ca-cert.pem

# Ensure env vars are set
export NODE_EXTRA_CA_CERTS="$HOME/.mitmproxy/mitmproxy-ca-cert.pem"
export HTTP_PROXY=http://localhost:8082
export HTTPS_PROXY=http://localhost:8082
```

### Issue: "Authentication data is empty"

**Cause:** Redis doesn't have auth credentials

**Fix:**
```bash
cd /Users/mihirbelose/ProgrammingProjects/heydaytime/skinshi
bun run test/steam/index.ts
```

### Issue: "Got cookies!" appears but inventory is empty

**Cause:** Steam service caches inventory in Redis

**Fix:** 
- Wait for cache to expire (100 seconds per services/steam/src/config.ts)
- Or restart steam service
- Or check direct mock access to verify items exist

### Issue: Inventory shows 0 items after trade

**Cause:** Same as above - Redis cache

**Fix:** Check direct mock access to verify trade worked:
```bash
curl -x http://localhost:8082 \
  'https://steamcommunity.com/inventory/76561198773889166/730/2' | jq '.total_inventory_count'
```

### Issue: Invalid RSA public key error

**Cause:** Happens when proxy env vars aren't set, so steam service hits real Steam

**Fix:** Ensure HTTP_PROXY/HTTPS_PROXY are exported before running steam service

### Issue: Port 8080 already in use

**Cause:** Another service using port 8080

**Fix:** The mock now uses port 8082 by default. If that's also taken, edit `start-all.sh` to use a different port.

## Case Class IDs (for reference)

These are the valid CS2 case class IDs used in the mock:

- `5710094579` - Kilowatt Case
- `6918191812` - Fever Case
- `6210138906` - Gallery Case
- `5189384637` - Revolution Case
- `4901046679` - Recoil Case
- `4717330486` - Dreams & Nightmares Case

## Reset Everything

To start completely fresh:

```bash
# 1. Kill all processes
pkill -f mitmdump
pkill -f "bun run src/index.ts"

# 2. Clear mock state (inventory)
rm -f /tmp/mock-steam-state.json

# 3. Clear Redis cache
redis-cli FLUSHDB

# 4. Restart
./start-all.sh
```

## Key Implementation Files

### mock-steam-addon.py

**Key classes/functions:**
- `MockSteamAddon.__init__()`: Loads/generates inventories
- `MockSteamAddon.request()`: Main interceptor, routes by host
- `MockSteamAddon._handle_api()`: api.steampowered.com endpoints
- `MockSteamAddon._handle_login()`: login.steampowered.com endpoints
- `MockSteamAddon._handle_community()`: steamcommunity.com endpoints
- `MockSteamAddon._move_item()`: Transfers items between inventories

**Important state:**
- `self.bot_inventory`: List of items for bot account
- `self.shared_inventory`: List of items for shared account
- `self.next_asset_id`: Counter for unique asset IDs

### start-all.sh

**What it does:**
1. Kills old processes
2. Checks/starts Redis
3. Sets auth credentials in Redis
4. Starts mitmproxy with mock addon
5. Sets environment variables
6. Starts steam service
7. Shows combined logs

## Debugging Tips

1. **Check mock is intercepting:**
   ```bash
   tail -f /tmp/mock-steam.log | grep "🎯 INTERCEPTED"
   ```

2. **Check trade processing:**
   ```bash
   tail -f /tmp/mock-steam.log | grep -E "(TRADE|Moving|asset)"
   ```

3. **Check state file:**
   ```bash
   cat /tmp/mock-steam-state.json | jq '{bot: (.bot_inventory | length), shared: (.shared_inventory | length)}'
   ```

4. **Check steam service logs:**
   ```bash
   tail -f /tmp/steam-service.log
   ```

## Security Note

The mock accepts ANY trade URL format since it's all local. In production, Steam validates trade URLs against actual Steam accounts. Here, trades always succeed immediately.

---

**Created:** 2024
**Purpose:** Local Steam API testing without external network calls
**Status:** Working - auth, inventory, profile, and trading all functional
