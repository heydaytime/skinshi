"""
Mock Steam API - Supports trading between Bot and Shared accounts
Bot Account: 76561198773889166 (HeyDayTime) - Empty inventory initially
Shared Account: 76561199001917145 (HeyDay) - 1000 cases, all other SteamIDs resolve to this
"""

from mitmproxy import http, ctx
import json
import base64
import time
import random
import os
import re
from urllib.parse import parse_qs, urlparse

# Bot account (steam-service itself)
BOT_ACCOUNT = {
    "steamID": "76561198773889166",
    "name": "HeyDayTime",
    "onlineState": "offline",
    "stateMessage": "Offline",
    "privacyState": "public",
    "visibilityState": "3",
    "avatarHash": "5bf9b72391489307e766644a5b5435bc18d4b00a",
    "vacBanned": False,
    "tradeBanState": "None",
    "isLimitedAccount": False,
    "customURL": "",
    "memberSince": "Fri Oct 31 2025 00:00:00 GMT-0500 (Central Daylight Time)",
    "location": "",
    "realName": "",
    "summary": ""
}

# Shared account (all other SteamIDs)
SHARED_ACCOUNT = {
    "steamID": "76561199001917145",
    "name": "HeyDay",
    "onlineState": "online",
    "stateMessage": "Online",
    "privacyState": "public",
    "visibilityState": "3",
    "avatarHash": "e8dffbe2504a7ea75ef2639f093be6e8215063e3",
    "vacBanned": False,
    "tradeBanState": "None",
    "isLimitedAccount": False,
    "customURL": "heydaytime",
    "memberSince": "Sat Nov 09 2019 00:00:00 GMT-0600 (Central Standard Time)",
    "location": "Vatican City State (Holy See)",
    "realName": "Mihir",
    "summary": ""
}

MOCK_REFRESH_TOKEN = "eyAidHlwIjogIkpXVCIsICJhbGciOiAiRWREU0EiIH0.eyAiaXNzIjogInN0ZWFtIiwgInN1YiI6ICI3NjU2MTE5ODc3Mzg4OTE2NiIsICJhdWQiOiBbICJ3ZWIiLCAicmVuZXciLCAiZGVyaXZlIiBdLCAiZXhwIjogMTc5NDY4NjkyMSwgIm5iZiI6IDE3Njc4NTI3NjUsICJpYXQiOiAxNzc2NDkyNzY1LCAianRpIjogIjAwMEJfMjgwOUM1QkNfOUIyRjciLCAib2F0IjogMTc3NjQ5Mjc2NSwgInBlciI6IDEsICJpcF9zdWJqZWN0IjogIjUwLjkzLjIyMi4xMTkiLCAiaXBfY29uZmlybWVyIjogIjUwLjkzLjIyMi4xMTkiIH0.29YXtqwQdnd-f_5SreZzUqwaa4dHT8pE05StCjnaA_WGasBPBprU1SXbGH_BKqbgSYZHtS1EkvpbS3dtkTqfCQ"
MOCK_ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3NjU2MTE5ODc3Mzg4OTE2NiIsImF1ZCI6WyJ3ZWIiXSwiaXNzIjoic3RlYW0iLCJleHAiOjE3OTQ2ODY5MjEsImlhdCI6MTc3NjQ5Mjc2NX0.mock"

# Case definitions
CASE_DEFINITIONS = [
    {
        "classid": "5710094579",
        "name": "Kilowatt Case",
        "icon_url": "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_frnEVvqf_a6VoIfGSXz7Hlbwg57QwSS_mxhl15jiGyN37c3_GZw91W8BwRflK7EfKsa2sfw",
        "background_color": "393b3e"
    },
    {
        "classid": "6918191812",
        "name": "Fever Case",
        "icon_url": "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_frncVtqv7MPE8JaHHCj_Dl-wk4-NtFirikURy4jiGwo2udHqVaAEjDZp3EflK7EeSMnMs4w",
        "background_color": "393b3e"
    },
    {
        "classid": "6210138906",
        "name": "Gallery Case",
        "icon_url": "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_frnYVuPD5baE6IfTFCmSRme0j5eU5SXrjkRwmt2rWnoqhdnjEPQQiDpRxTflK7EePRV2-Kg",
        "background_color": "393b3e"
    },
    {
        "classid": "5189384637",
        "name": "Revolution Case",
        "icon_url": "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_frnAVvfb6aqduc_TFVjTCxbx05OU4S3jilE9w4DzRnImtIy2Sa1JzDJEhRPlK7EcO4U8gfA",
        "background_color": "393b3e"
    },
    {
        "classid": "4901046679",
        "name": "Recoil Case",
        "icon_url": "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_frnMVu6b-avA-JqSSCjSWwuhz47U9TCzlxh9yt2WGnNqgIi-fbgUkWMNxFPlK7EdIJF6a2Q",
        "background_color": "393b3e"
    },
    {
        "classid": "3761545285",
        "name": "Prisma 2 Case",
        "icon_url": "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_fr3cV6vT9avBvefWWDDGTxbZ14rhsTX7qkE90sDiHwt2pdC-TblJ2DsB1QPlK7Ee9riHKAA",
        "background_color": "393b3e"
    },
    {
        "classid": "4717330486",
        "name": "Dreams & Nightmares Case",
        "icon_url": "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_frnIV7Kb5OaU-JqfHDzXFle0u4LY8Gy_kkRgisGzcm4v4J3vDOAQmDMdyRvlK7EcmeCU3yw",
        "background_color": "393b3e"
    }
]

# State file
STATE_FILE = "/tmp/mock-steam-state.json"

class MockSteamAddon:
    def __init__(self):
        self.next_asset_id = 50000000000
        self.bot_inventory = []  # Bot starts empty
        self.shared_inventory = []  # Shared account gets 1000 cases
        self._load_or_generate_inventories()
    
    def _load_or_generate_inventories(self):
        """Load or generate inventories"""
        if os.path.exists(STATE_FILE):
            try:
                with open(STATE_FILE, 'r') as f:
                    state = json.load(f)
                    self.bot_inventory = state.get('bot_inventory', [])
                    self.shared_inventory = state.get('shared_inventory', [])
                    self.next_asset_id = state.get('next_asset_id', 50000001000)
                ctx.log.info(f"📦 Loaded bot: {len(self.bot_inventory)} items, shared: {len(self.shared_inventory)} items")
                return
            except:
                pass
        
        # Generate shared inventory (1000 cases)
        self._generate_shared_inventory()
        self._save_state()
    
    def _generate_shared_inventory(self):
        """Generate 1000 fake case items for shared account"""
        ctx.log.info("🎲 Generating 1000 cases for shared account...")
        self.shared_inventory = []
        
        for i in range(1000):
            case = random.choice(CASE_DEFINITIONS)
            item = {
                "appid": "730",
                "contextid": "2",
                "assetid": str(self.next_asset_id + i),
                "classid": case["classid"],
                "instanceid": str(random.randint(1, 9999999999)),
                "icon_url": case["icon_url"],
                "background_color": case["background_color"],
                "name": case["name"]
            }
            self.shared_inventory.append(item)
        
        self.next_asset_id += 1000
        ctx.log.info(f"✅ Generated {len(self.shared_inventory)} shared items")
    
    def _save_state(self):
        """Save inventory state"""
        state = {
            'bot_inventory': self.bot_inventory,
            'shared_inventory': self.shared_inventory,
            'next_asset_id': self.next_asset_id
        }
        try:
            with open(STATE_FILE, 'w') as f:
                json.dump(state, f)
        except:
            pass
    
    def _is_bot_steamid(self, steamid: str) -> bool:
        """Check if SteamID is the bot account"""
        return steamid == BOT_ACCOUNT["steamID"]
    
    def _get_account_for_steamid(self, steamid: str) -> dict:
        """Return account info for any SteamID (bot or shared)"""
        if self._is_bot_steamid(steamid):
            return BOT_ACCOUNT
        return SHARED_ACCOUNT
    
    def _get_inventory_for_steamid(self, steamid: str) -> list:
        """Get inventory for SteamID"""
        if self._is_bot_steamid(steamid):
            return self.bot_inventory
        return self.shared_inventory
    
    def _find_item_by_assetid(self, inventory: list, assetid: str) -> dict:
        """Find item in inventory by assetid"""
        for item in inventory:
            if item["assetid"] == assetid:
                return item
        return None
    
    def _move_item(self, from_inventory: list, to_inventory: list, assetid: str) -> bool:
        """Move item between inventories"""
        item = self._find_item_by_assetid(from_inventory, assetid)
        if item:
            from_inventory.remove(item)
            # Assign new unique assetid when moving
            item["assetid"] = str(self.next_asset_id)
            self.next_asset_id += 1
            to_inventory.append(item)
            self._save_state()
            return True
        return False

    def request(self, flow: http.HTTPFlow) -> None:
        host = flow.request.pretty_host
        path = flow.request.path
        
        ctx.log.info(f"🎯 INTERCEPTED: {flow.request.method} {host}{path}")
        
        headers = {
            "Content-Type": "application/json",
            "X-eresult": "1",
            "X-Mock-Steam": "INTERCEPTED"
        }
        
        if "api.steampowered.com" in host:
            self._handle_api(flow, headers)
        elif "login.steampowered.com" in host:
            self._handle_login(flow, headers)
        elif "steamcommunity.com" in host:
            self._handle_community(flow, headers)
    
    def _handle_api(self, flow: http.HTTPFlow, headers: dict) -> None:
        path = flow.request.path
        
        # Trade offer endpoints
        if "GetTradeOffer" in path:
            ctx.log.info("📤 GetTradeOffer")
            flow.response = http.Response.make(200, json.dumps({
                "response": {
                    "offer": {
                        "tradeofferid": "1234567890",
                        "accountid_other": 123456,
                        "message": "",
                        "expiration_time": int(time.time()) + 604800,
                        "trade_offer_state": 3,  # Accepted
                        "items_to_give": [],
                        "items_to_receive": [],
                        "is_our_offer": True,
                        "time_created": int(time.time()),
                        "time_updated": int(time.time())
                    }
                }
            }).encode(), headers)
        elif "GetTradeOffers" in path:
            ctx.log.info("📤 GetTradeOffers")
            flow.response = http.Response.make(200, json.dumps({
                "response": {
                    "trade_offers_sent": [],
                    "trade_offers_received": [],
                    "descriptions": []
                }
            }).encode(), headers)
        elif "GetTradeOffersSummary" in path:
            flow.response = http.Response.make(200, json.dumps({
                "response": {
                    "pending_gifts": 0,
                    "newly_accepted_gifts": 0,
                    "updated_escrow": 0,
                    "new_offers": 0,
                    "historical_offers": 0
                }
            }).encode(), headers)
        elif "GetPasswordRSAPublicKey" in path:
            ctx.log.info("📤 RSA Public Key")
            flow.response = http.Response.make(200, json.dumps({
                "response": {
                    "publickey_mod": "f73d590fafe84d88f2cfb8ec11e999b38e99e3f9f818b2c23221e7c4aa576e2303238ab90872d3d3467d17f45c5299779d81b21e38a938d4cd0a49c40ec3371ba1a87c3af8ca18b4b514df593510149cb99d4cd524a3c55bc3d116bfbb446af50eb218a92e0f169f3bb938ddee64771799e9f254c571846c28f8c776cec031e0bee277f61600e4572afc9fb194e77e7d54434f4e67e65440da4792be5ef9fb08a8023318e2465de8df9c2d9356de7ef32ee774418384bd617b0ccb4c42abd72d367a39e0d5e065ee1abaf38611482535556fade75ced6102210cc110d40873bd614f08287ca3a3820d98244a7595289f8689b6c9c94955ff564f8571ac21c5e9",
                    "publickey_exp": "010001",
                    "timestamp": str(int(time.time()))
                }
            }).encode(), headers)
        elif "BeginAuthSessionViaCredentials" in path:
            ctx.log.info("📤 BeginAuthSession")
            flow.response = http.Response.make(200, json.dumps({
                "response": {
                    "client_id": "1234567890",
                    "request_id": base64.b64encode(b"mock_request").decode(),
                    "interval": 5,
                    "allowed_confirmations": [{"confirmation_type": 0}],
                    "steamid": BOT_ACCOUNT["steamID"]
                }
            }).encode(), headers)
        elif "PollAuthSessionStatus" in path:
            ctx.log.info("📤 PollAuthSessionStatus")
            flow.response = http.Response.make(200, json.dumps({
                "response": {
                    "refresh_token": MOCK_REFRESH_TOKEN,
                    "access_token": MOCK_ACCESS_TOKEN,
                    "account_name": "_heydaytime_",
                    "had_remote_interaction": False
                }
            }).encode(), headers)
        else:
            flow.response = http.Response.make(200, json.dumps({"response": {}}).encode(), headers)
    
    def _handle_login(self, flow: http.HTTPFlow, headers: dict) -> None:
        path = flow.request.path
        
        if "finalizelogin" in path:
            ctx.log.info("📤 Finalize Login")
            cookie_headers = headers.copy()
            cookie_headers["set-cookie"] = f"steamRefresh_steam={MOCK_REFRESH_TOKEN}; Path=/; Secure; HttpOnly"
            flow.response = http.Response.make(200, json.dumps({
                "steamID": BOT_ACCOUNT["steamID"],
                "accountName": "_heydaytime_",
                "transfer_info": [{"url": "https://steamcommunity.com/login/settoken", "params": {"nonce": "mock", "auth": "mock"}}]
            }).encode(), cookie_headers)
        else:
            flow.response = http.Response.make(200, json.dumps({}).encode(), headers)
    
    def _handle_community(self, flow: http.HTTPFlow, headers: dict) -> None:
        path = flow.request.path
        
        if "login/settoken" in path:
            ctx.log.info("📤 SetToken")
            cookie_headers = headers.copy()
            cookie_headers["set-cookie"] = f"steamLoginSecure={BOT_ACCOUNT['steamID']}%7C%7C{MOCK_ACCESS_TOKEN}; Path=/; Secure; HttpOnly"
            flow.response = http.Response.make(200, b"OK", cookie_headers)
        
        elif "xml=1" in path:
            # Extract SteamID from URL
            match = re.search(r'/profiles/(\d+)', path)
            if match:
                steamid = match.group(1)
            else:
                match = re.search(r'/id/([^/]+)', path)
                steamid = SHARED_ACCOUNT["steamID"]  # Default to shared
            
            account = self._get_account_for_steamid(steamid)
            ctx.log.info(f"📤 Profile XML for {account['name']} ({steamid})")
            
            flow.response = http.Response.make(200, f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<profile>
    <steamID64>{account['steamID']}</steamID64>
    <steamID><![CDATA[{account['name']}]]></steamID>
    <onlineState>{account['onlineState']}</onlineState>
    <stateMessage><![CDATA[{account['stateMessage']}]]></stateMessage>
    <privacyState>{account['privacyState']}</privacyState>
    <visibilityState>{account['visibilityState']}</visibilityState>
    <avatarIcon>https://avatars.steamstatic.com/{account['avatarHash']}.jpg</avatarIcon>
    <avatarMedium>https://avatars.steamstatic.com/{account['avatarHash']}_medium.jpg</avatarMedium>
    <avatarFull>https://avatars.steamstatic.com/{account['avatarHash']}_full.jpg</avatarFull>
    <vacBanned>0</vacBanned>
    <tradeBanState>{account['tradeBanState']}</tradeBanState>
    <isLimitedAccount>0</isLimitedAccount>
    <customURL>{account['customURL']}</customURL>
    <memberSince>{account['memberSince']}</memberSince>
    <steamRating></steamRating>
    <hoursPlayed2Wk>0.0</hoursPlayed2Wk>
    <headline><![CDATA[]]></headline>
    <location>{account['location']}</location>
    <realname><![CDATA[{account['realName']}]]></realname>
    <summary><![CDATA[{account['summary']}]]></summary>
</profile>""".encode(), {"Content-Type": "text/xml"})
        
        elif "/inventory/" in path:
            # Extract SteamID from URL
            match = re.search(r'/inventory/(\d+)', path)
            if match:
                steamid = match.group(1)
            else:
                steamid = SHARED_ACCOUNT["steamID"]
            
            inventory = self._get_inventory_for_steamid(steamid)
            account = self._get_account_for_steamid(steamid)
            
            ctx.log.info(f"📤 Inventory for {account['name']}: {len(inventory)} items")
            
            flow.response = http.Response.make(200, json.dumps({
                "success": True,
                "total_inventory_count": len(inventory),
                "assets": [{"appid": item["appid"], "contextid": item["contextid"], 
                           "assetid": item["assetid"], "classid": item["classid"],
                           "instanceid": item["instanceid"], "amount": "1"} for item in inventory],
                "descriptions": [{"appid": item["appid"], "classid": item["classid"],
                                 "instanceid": item["instanceid"], "icon_url": item["icon_url"],
                                 "icon_url_large": item["icon_url"], "name": item["name"],
                                 "market_hash_name": item["name"], "type": "Base Grade Container",
                                 "background_color": item["background_color"], "tradable": 1,
                                 "marketable": 1, "commodity": 1} for item in inventory],
                "more_items": False
            }), headers)
        
        elif "/tradeoffer/new/send" in path:
            ctx.log.info("📤 SEND TRADE OFFER - Processing Trade!")
            # Parse the form data to get trade details
            body = flow.request.content.decode('utf-8', errors='ignore')
            ctx.log.info(f"Trade data received: {len(body)} bytes")
            
            # Parse form data to get json_tradeoffer
            trade_offer = None
            for param in body.split('&'):
                if param.startswith('json_tradeoffer='):
                    try:
                        import urllib.parse
                        trade_json = urllib.parse.unquote(param[16:])
                        trade_offer = json.loads(trade_json)
                        ctx.log.info(f"Parsed trade offer: {json.dumps(trade_offer)[:500]}...")
                    except Exception as e:
                        ctx.log.error(f"Failed to parse trade: {e}")
                    break
            
            # Process item transfers
            if trade_offer:
                # their_items = items coming TO bot FROM shared account
                their_items = trade_offer.get('them', {}).get('assets', [])
                # my_items = items going FROM bot TO shared account
                my_items = trade_offer.get('me', {}).get('assets', [])
                
                ctx.log.info(f"Trade: {len(my_items)} items from bot -> shared, {len(their_items)} items from shared -> bot")
                
                # Move their items (shared -> bot)
                for item_data in their_items:
                    assetid = item_data.get('assetid')
                    if assetid:
                        ctx.log.info(f"Moving asset {assetid} from shared inventory to bot inventory")
                        if self._move_item(self.shared_inventory, self.bot_inventory, assetid):
                            ctx.log.info(f"✅ Successfully moved asset {assetid} to bot")
                        else:
                            ctx.log.warn(f"⚠️ Asset {assetid} not found in shared inventory")
                
                # Move my items (bot -> shared)
                for item_data in my_items:
                    assetid = item_data.get('assetid')
                    if assetid:
                        ctx.log.info(f"Moving asset {assetid} from bot inventory to shared inventory")
                        if self._move_item(self.bot_inventory, self.shared_inventory, assetid):
                            ctx.log.info(f"✅ Successfully moved asset {assetid} to shared")
                        else:
                            ctx.log.warn(f"⚠️ Asset {assetid} not found in bot inventory")
                
                # Save state after trade
                self._save_state()
                ctx.log.info(f"📦 Post-trade: Bot has {len(self.bot_inventory)} items, Shared has {len(self.shared_inventory)} items")
            
            # Return trade sent response
            flow.response = http.Response.make(200, json.dumps({
                "tradeofferid": str(int(time.time())),
                "needs_mobile_confirmation": False,
                "needs_email_confirmation": False
            }).encode(), headers)
        
        elif "/tradeoffer/" in path and "/accept" in path:
            ctx.log.info("📤 ACCEPT TRADE OFFER")
            flow.response = http.Response.make(200, json.dumps({
                "success": True,
                "tradeid": str(int(time.time()))
            }).encode(), headers)
        
        elif "/mobileconf/getlist" in path:
            ctx.log.info("📤 Get Confirmations")
            flow.response = http.Response.make(200, json.dumps({
                "success": True,
                "conf": []
            }).encode(), headers)
        
        else:
            flow.response = http.Response.make(200, b"OK", {"Content-Type": "text/plain"})

addons = [MockSteamAddon()]
