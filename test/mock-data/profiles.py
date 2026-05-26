"""
Mock profile data generators for Steam API testing.
"""

def get_mock_profile_xml(steamid: str = "76561198000000001", vanity: str = None):
    """Generate mock profile XML response"""
    custom_url = vanity or f"user{steamid[-8:]}"
    
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<profile>
  <steamID64>{steamid}</steamID64>
  <steamID><![CDATA[Mock User {steamid[-4:]}]]></steamID>
  <onlineState>online</onlineState>
  <stateMessage><![CDATA[Online]]></stateMessage>
  <privacyState>public</privacyState>
  <visibilityState>3</visibilityState>
  <avatarIcon>https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb.jpg</avatarIcon>
  <avatarMedium>https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_medium.jpg</avatarMedium>
  <avatarFull>https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg</avatarFull>
  <vacBanned>0</vacBanned>
  <tradeBanState>None</tradeBanState>
  <isLimitedAccount>0</isLimitedAccount>
  <customURL>{custom_url}</customURL>
  <memberSince>January 1, 2015</memberSince>
  <steamRating></steamRating>
  <hoursPlayed2Wk>0.0</hoursPlayed2Wk>
  <headline><![CDATA[Mock Profile]]></headline>
  <location>United States</location>
  <realname><![CDATA[Mock User]]></realname>
  <summary><![CDATA[This is a mock profile for testing]]></summary>
</profile>"""


def get_mock_profile_html(steamid: str = "76561198000000001", persona_name: str = "Mock User"):
    """Generate mock profile HTML page"""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{persona_name}</title>
</head>
<body>
    <div class="profile_header_centered">
        <div class="actual_persona_name">{persona_name}</div>
        <div class="profile_summary">
            <div class="header_real_name ellipsis">Mock User</div>
        </div>
    </div>
    <div class="profile_item_links">
        <div class="profile_count_link_total">5</div>
    </div>
</body>
</html>"""


def get_mock_player_summary(steamid: str = "76561198000000001", persona_name: str = "Mock User"):
    """Generate mock player summary for WebAPI"""
    return {
        "steamid": steamid,
        "communityvisibilitystate": 3,
        "profilestate": 1,
        "personaname": persona_name,
        "profileurl": f"https://steamcommunity.com/id/user{steamid[-8:]}/",
        "avatar": "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb.jpg",
        "avatarmedium": "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_medium.jpg",
        "avatarfull": "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg",
        "personastate": 1,
        "realname": "Mock User",
        "primaryclanid": "103582791429521408",
        "timecreated": 1420000000,
        "personastateflags": 0,
        "loccountrycode": "US"
    }
