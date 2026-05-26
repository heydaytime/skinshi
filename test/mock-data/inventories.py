"""
Mock inventory data generators for Steam API testing.
"""

import time

CS2_APP_ID = 730
CS2_CONTEXT_ID = "2"

# Common CS2 case class IDs
CASE_CLASS_IDS = {
    "kilowatt": "5710094579",
    "revolution": "5249965892",
    "dreams_nightmares": "4847453303",
    "recoil": "4627377280",
    "fracture": "4235832874",
    "snakebite": "4054920364",
}


def get_mock_inventory(steamid: str = "76561198000000001", appid: int = CS2_APP_ID, contextid: str = CS2_CONTEXT_ID):
    """Generate mock CS2 inventory"""
    
    assets = []
    descriptions = []
    asset_id_base = int(time.time())
    
    # Add some mock cases
    case_items = [
        {
            "classid": CASE_CLASS_IDS["kilowatt"],
            "name": "Kilowatt Case",
            "market_hash_name": "Kilowatt Case",
            "type": "Base Grade Container",
        },
        {
            "classid": CASE_CLASS_IDS["revolution"],
            "name": "Revolution Case",
            "market_hash_name": "Revolution Case",
            "type": "Base Grade Container",
        },
        {
            "classid": CASE_CLASS_IDS["dreams_nightmares"],
            "name": "Dreams & Nightmares Case",
            "market_hash_name": "Dreams & Nightmares Case",
            "type": "Base Grade Container",
        },
    ]
    
    for i, item in enumerate(case_items):
        asset_id = str(asset_id_base + i)
        assets.append({
            "appid": appid,
            "contextid": contextid,
            "assetid": asset_id,
            "classid": item["classid"],
            "instanceid": "0",
            "amount": "1"
        })
        
        descriptions.append({
            "appid": appid,
            "classid": item["classid"],
            "instanceid": "0",
            "icon_url": "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvB0m7XQR2I7dVcD7-r2e1c1gKPLP2lEvYzizYbRlKOlZ-2HxTwEvpR13L6S89mk2wLm_0VkYjihIoWRIwI7ZViE-gO3wOfq15O0tJ7JwHFlsj5iuyjL30vgGaL0_Q",
            "icon_url_large": "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvB0m7XQR2I7dVcD7-r2e1c1gKPLP2lEvYzizYbRlKOlZ-2HxTwEvpR13L6S89mk2wLm_0VkYjihIoWRIwI7ZViE-gO3wOfq15O0tJ7JwHFlsj5iuyjL30vgGaL0_Q",
            "name": item["name"],
            "market_hash_name": item["market_hash_name"],
            "type": item["type"],
            "tradable": 1,
            "marketable": 1,
            "commodity": 1
        })
    
    return {
        "success": True,
        "total_inventory_count": len(assets),
        "assets": assets,
        "descriptions": descriptions,
        "more_items": False
    }


def get_mock_partner_inventory(steamid: str = "76561198000000002", appid: int = CS2_APP_ID):
    """Generate mock partner inventory for trade offers"""
    return get_mock_inventory(steamid, appid, CS2_CONTEXT_ID)
