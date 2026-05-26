# Mock Steam API for Testing

## Overview

This directory contains a mock Steam API implementation for testing the steam service (`@services/steam/`) **without making any changes to the steam service code**. The steam service must be tricked into thinking it's talking to real Steam servers.

## Critical Constraint

**⚠️ YOU ARE NOT ALLOWED TO MODIFY ANY CODE OUTSIDE OF `@test/` DIRECTORY ⚠️**

- ❌ No changes to `@services/steam/`
- ❌ No changes to root level files
- ❌ No modifications to existing services
- ✅ Only create new files in `@test/`

## The Problem

The steam service uses these libraries to talk to Steam:
- `steamcommunity` - Profile lookups, trade confirmations
- `steam-session` - Authentication
- `steam-tradeoffer-manager` - Trade offers
- `steam-totp` - 2FA codes

These libraries make HTTPS requests to:
- `steamcommunity.com`
- `api.steampowered.com`
- `login.steampowered.com`

**Bun's fetch() does NOT respect HTTP_PROXY/HTTPS_PROXY environment variables**, so simple proxy settings won't work.

## The Solution: mitmproxy

We'll use **mitmproxy** with local capture mode to intercept all traffic from the steam service process.

### Why mitmproxy?

- ✅ Intercepts ALL traffic without code changes
- ✅ Works with Bun/Node.js
- ✅ Full HTTPS decryption
- ✅ Scriptable with Python addons
- ✅ Can modify requests/responses on the fly

## Setup Instructions

### 1. Install mitmproxy

```bash
brew install mitmproxy
```

### 2. Install mitmproxy CA Certificate

The steam service needs to trust mitmproxy's certificate:

```bash
# Start mitmproxy once to generate certificates
mitmproxy

# Then install the CA certificate:
# Option A: System-wide (recommended)
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ~/.mitmproxy/mitmproxy-ca-cert.pem

# Option B: For Node.js/Bun only
export NODE_EXTRA_CA_CERTS="$HOME/.mitmproxy/mitmproxy-ca-cert.pem"
```

### 3. Set up Steam Auth Env

The steam service reads auth credentials from environment variables. Create `services/steam/.env` from `services/steam/.env.example` and fill in the Steam bot values.

To verify the required variables are present:

```bash
cd /Users/mihirbelose/ProgrammingProjects/heydaytime/skinshi
bun run test/steam/index.ts
```

### 4. Start mitmproxy with Mock Addon

```bash
cd /Users/mihirbelose/ProgrammingProjects/heydaytime/skinshi/test
mitmproxy --mode local:bun -s mock-steam-addon.py
```

This captures all traffic from Bun processes and routes it through our mock addon.

### 5. Run Steam Service

In a new terminal:

```bash
cd /Users/mihirbelose/ProgrammingProjects/heydaytime/skinshi/services/steam
bun run src/index.ts
```

**Expected successful output:**
```
Waiting for authentication details from redis...
[Redis:steam-redis-client] Connected successfully
Using saved refresh token...
Got cookies!
Ready to trade.
HTTP server running on port 8001
```

If you see "Got cookies!" - the mock is working! 🎉

## Endpoints to Mock

The mock must implement these endpoints to fully support profile, inventory, and trade functionality:

### Authentication Endpoints

**Host:** `api.steampowered.com`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/IAuthenticationService/GetPasswordRSAPublicKey/v1/` | GET | Get RSA key for password encryption |
| `/IAuthenticationService/BeginAuthSessionViaCredentials/v1/` | POST | Start authentication session |
| `/IAuthenticationService/PollAuthSessionStatus/v1/` | POST | Check auth status |
| `/IAuthenticationService/UpdateAuthSessionWithSteamGuardCode/v1/` | POST | Submit 2FA code |

**Host:** `login.steampowered.com`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/jwt/finalizelogin` | POST | Exchange refresh token for web cookies |
| `/jwt/checkdevice` | POST | Check device authorization |

### Profile Endpoints

**Host:** `steamcommunity.com`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/id/{vanity}/?xml=1` | GET | Get profile by vanity URL (XML) |
| `/profiles/{steamid64}/?xml=1` | GET | Get profile by SteamID64 (XML) |
| `/id/{vanity}/` | GET | Get profile HTML page |
| `/profiles/{steamid64}/` | GET | Get profile HTML page |

### Inventory Endpoints

**Host:** `steamcommunity.com`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/inventory/{steamid64}/730/2` | GET | Get CS2 inventory (appid=730, context=2) |
| `/profiles/{steamid64}/inventory/json/730/2` | GET | Legacy inventory endpoint |

Query parameters:
- `l=english` - Language
- `count=1000` - Number of items per request
- `start_assetid` - Pagination cursor

### Trade Offer Endpoints

**Host:** `steamcommunity.com`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/tradeoffer/new/send` | POST | Send new trade offer |
| `/tradeoffer/{offerid}/accept` | POST | Accept trade offer |
| `/tradeoffer/{offerid}/` | GET | Get trade offer page |
| `/tradeoffer/new/partnerinventory/` | GET | Get partner inventory for trade |

### Mobile Confirmation Endpoints

**Host:** `steamcommunity.com`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/mobileconf/getlist` | GET | Get pending confirmations |
| `/mobileconf/ajaxop` | POST | Respond to single confirmation |
| `/mobileconf/multiajaxop` | POST | Respond to multiple confirmations |
| `/mobileconf/detailspage/{confId}` | GET | Get confirmation details |

Query parameters for confirmations:
- `p` - Device ID
- `a` - SteamID64
- `k` - Confirmation key (TOTP)
- `t` - Timestamp
- `tag` - Operation tag ("conf", "allow", etc.)

### WebAPI Endpoints

**Host:** `api.steampowered.com`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/IEconService/GetTradeOffer/v1/` | GET | Get trade offer details |
| `/IEconService/GetTradeOffers/v1/` | GET | List trade offers |
| `/IEconService/GetTradeOffersSummary/v1/` | GET | Trade offers summary |
| `/ISteamUser/GetPlayerSummaries/v2/` | GET | Get player info |

## Request/Response Formats

### Authentication

**GetPasswordRSAPublicKey Response:**
```json
{
  "response": {
    "publickey_mod": "ABCDEF1234567890...",
    "publickey_exp": "010001",
    "timestamp": "1234567890"
  }
}
```

**BeginAuthSessionViaCredentials Response:**
```json
{
  "response": {
    "client_id": "1234567890",
    "request_id": "base64_encoded_request_id",
    "interval": 5,
    "allowed_confirmations": [
      {"confirmation_type": 0}
    ],
    "steamid": "76561198000000001"
  }
}
```

**PollAuthSessionStatus Response:**
```json
{
  "response": {
    "refresh_token": "eyJhbGci...",
    "access_token": "eyJhbGci...",
    "account_name": "mockuser",
    "had_remote_interaction": false
  }
}
```

**FinalizeLogin Response:**
```json
{
  "steamID": "76561198000000001",
  "accountName": "mockuser",
  "transfer_info": [
    {
      "url": "https://steamcommunity.com/login/settoken",
      "params": {
        "nonce": "...",
        "auth": "..."
      }
    }
  ]
}
```

### Profile (XML)

**Profile by Vanity/SteamID:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<profile>
  <steamID64>76561198000000001</steamID64>
  <steamID><![CDATA[Mock User]]></steamID>
  <onlineState>online</onlineState>
  <stateMessage><![CDATA[Online]]></stateMessage>
  <privacyState>public</privacyState>
  <visibilityState>3</visibilityState>
  <avatarIcon>https://avatars.steamstatic.com/...</avatarIcon>
  <vacBanned>0</vacBanned>
  <tradeBanState>None</tradeBanState>
  <isLimitedAccount>0</isLimitedAccount>
  <customURL>mockuser</customURL>
  <memberSince>January 1, 2015</memberSince>
  <location>United States</location>
  <realname><![CDATA[Mock User]]></realname>
  <summary><![CDATA[This is a mock profile]]></summary>
</profile>
```

### Inventory

**Inventory Response:**
```json
{
  "success": true,
  "total_inventory_count": 5,
  "assets": [
    {
      "appid": 730,
      "contextid": "2",
      "assetid": "1234567890",
      "classid": "5710094579",
      "instanceid": "0",
      "amount": "1"
    }
  ],
  "descriptions": [
    {
      "appid": 730,
      "classid": "5710094579",
      "instanceid": "0",
      "icon_url": "...",
      "name": "Kilowatt Case",
      "market_hash_name": "Kilowatt Case",
      "type": "Base Grade Container",
      "tradable": 1,
      "marketable": 1
    }
  ],
  "more_items": false
}
```

### Trade Offer

**Send Trade Offer Response:**
```json
{
  "tradeofferid": "1234567890",
  "needs_mobile_confirmation": true,
  "needs_email_confirmation": false
}
```

### Mobile Confirmations

**Get Confirmations Response:**
```json
{
  "success": true,
  "conf": [
    {
      "id": "1234567890",
      "type": "2",
      "creator_id": "1234567890",
      "nonce": "9876543210",
      "creation_time": "1704067200",
      "headline": "Trade Offer",
      "summary": ["You are about to send: 1 item"]
    }
  ]
}
```

## Files to Create

### Required Files in `@test/`

```
test/
├── README.md                    # This file
├── mock-steam-addon.py         # mitmproxy addon script
├── mock-data/                   # Mock data generators
│   ├── profiles.py             # Mock profile data
│   ├── inventories.py          # Mock inventory data
│   └── items.py                # Mock item definitions
└── steam/                       # Already exists
    └── index.ts                # Sets up Redis auth
```

### mitmproxy Addon Structure

The `mock-steam-addon.py` should:

1. Intercept requests to Steam domains
2. Return mock responses based on endpoint
3. Log all intercepted traffic
4. Support configurable mock data

Basic structure:
```python
from mitmproxy import http

class MockSteamAddon:
    def request(self, flow: http.HTTPFlow) -> None:
        host = flow.request.pretty_host
        path = flow.request.path
        
        # Route to appropriate handler
        if host == "api.steampowered.com":
            self.handle_api_request(flow)
        elif host == "steamcommunity.com":
            self.handle_community_request(flow)
        elif host == "login.steampowered.com":
            self.handle_login_request(flow)
    
    def handle_api_request(self, flow: http.HTTPFlow) -> None:
        # Handle WebAPI endpoints
        pass
    
    def handle_community_request(self, flow: http.HTTPFlow) -> None:
        # Handle Steam Community endpoints
        pass
    
    def handle_login_request(self, flow: http.HTTPFlow) -> None:
        # Handle login endpoints
        pass

addons = [MockSteamAddon()]
```

## Testing

### Manual Test with curl

```bash
# Through mitmproxy (must be running)
curl -x http://localhost:8080 \
  https://api.steampowered.com/IAuthenticationService/GetPasswordRSAPublicKey/v1/
```

### Test Scripts

Create test scripts in `@test/` to verify each endpoint:

```bash
# test-auth.sh - Test authentication flow
# test-profile.sh - Test profile endpoints
# test-inventory.sh - Test inventory endpoints
# test-trade.sh - Test trade endpoints
```

## Current State

### ✅ Already Working
- Redis auth setup (`test/steam/index.ts`)

### 🚧 To Implement
1. **mitmproxy addon** (`mock-steam-addon.py`)
2. **Authentication endpoints** - All auth flow endpoints
3. **Profile endpoints** - XML profile lookup
4. **Inventory endpoints** - CS2 inventory fetching
5. **Trade endpoints** - Trade offer creation/confirmation
6. **Mock data generators** - Realistic test data

## Implementation Order

1. **Phase 1: Authentication**
   - Implement auth endpoints in mitmproxy addon
   - Get "Got cookies!" message from steam service

2. **Phase 2: Profile**
   - Implement profile XML endpoints
   - Test profile lookup via steam service API

3. **Phase 3: Inventory**
   - Implement inventory endpoints
   - Test inventory fetching

4. **Phase 4: Trade**
   - Implement trade offer endpoints
   - Test trade creation
   - Implement mobile confirmations

## Important Notes

### Steam Libraries Behavior

- **steam-session**: Uses WebAPI for auth, then `login.steampowered.com/jwt/finalizelogin` for cookies
- **steamcommunity**: Uses XML endpoints for profiles, HTML forms for trades
- **steam-tradeoffer-manager**: Uses steamcommunity's HTTP interface
- **steam-totp**: Generates TOTP codes locally (no network requests)

### Cookie Format

The libraries expect cookies in this format:
```
steamLoginSecure=76561198000000001%7C%7Caccess_token
sessionid=random_session_id
```

### SteamID64 Format

SteamID64 = `76561197960265728 + account_id`
Example: `76561198000000001` (account_id = 1)

### CS2 App ID

- **App ID**: 730
- **Context ID**: 2
- **Item types**: Cases have specific class IDs (see constants in steam service)

## Debugging

### Check if mitmproxy is intercepting

```bash
# View mitmproxy logs
# In mitmproxy UI, you should see all requests

# Check if traffic is going through
# Steam domains should appear in mitmproxy
```

### Check steam service logs

```bash
# Successful auth:
# "Using saved refresh token..."
# "Got cookies!"
# "Ready to trade."

# Failed auth:
# "Refresh token expired, re-authenticating..."
# Error messages
```

### Common Issues

**Issue: "unable to verify the first certificate"**
- Solution: Install mitmproxy CA certificate

**Issue: Traffic bypassing mitmproxy**
- Solution: Make sure mitmproxy is running before steam service
- Check that `--mode local:bun` is capturing Bun processes

**Issue: Auth credentials not found**
- Solution: Run `bun run test/steam/index.ts` to set up Redis

## Next Steps

1. Create `mock-steam-addon.py` with authentication endpoints
2. Test until "Got cookies!" appears
3. Implement profile endpoints
4. Implement inventory endpoints
5. Implement trade endpoints

**Ready to start?** Create the mitmproxy addon in `@test/mock-steam-addon.py`
