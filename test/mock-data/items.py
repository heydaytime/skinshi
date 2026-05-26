"""
Mock item definitions for CS2 items.
"""

CS2_ITEMS = {
    "cases": {
        "kilowatt": {
            "classid": "5710094579",
            "name": "Kilowatt Case",
            "market_hash_name": "Kilowatt Case",
            "type": "Base Grade Container",
            "icon_url": "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvB0m7XQR2I7dVcD7-r2e1c1gKPLP2lEvYzizYbRlKOlZ-2HxTwEvpR13L6S89mk2wLm_0VkYjihIoWRIwI7ZViE-gO3wOfq15O0tJ7JwHFlsj5iuyjL30vgGaL0_Q"
        },
        "revolution": {
            "classid": "5249965892",
            "name": "Revolution Case",
            "market_hash_name": "Revolution Case",
            "type": "Base Grade Container",
            "icon_url": "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvB0m7XQR2I7dVcD7-r2e1c1gKPLP2lEvYzizYbRlKOlZ-2HxTwEvpR13L6S89mk2wLm_0VkYjihIoWRIwI7ZViE-gO3wOfq15O0tJ7JwHFlsj5iuyjL30vgGaL0_Q"
        },
        "dreams_nightmares": {
            "classid": "4847453303",
            "name": "Dreams & Nightmares Case",
            "market_hash_name": "Dreams & Nightmares Case",
            "type": "Base Grade Container",
            "icon_url": "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvB0m7XQR2I7dVcD7-r2e1c1gKPLP2lEvYzizYbRlKOlZ-2HxTwEvpR13L6S89mk2wLm_0VkYjihIoWRIwI7ZViE-gO3wOfq15O0tJ7JwHFlsj5iuyjL30vgGaL0_Q"
        },
        "recoil": {
            "classid": "4627377280",
            "name": "Recoil Case",
            "market_hash_name": "Recoil Case",
            "type": "Base Grade Container",
            "icon_url": "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvB0m7XQR2I7dVcD7-r2e1c1gKPLP2lEvYzizYbRlKOlZ-2HxTwEvpR13L6S89mk2wLm_0VkYjihIoWRIwI7ZViE-gO3wOfq15O0tJ7JwHFlsj5iuyjL30vgGaL0_Q"
        },
    },
    "weapons": {
        # Add weapon definitions here if needed
    }
}


def get_item_by_classid(classid: str):
    """Get item definition by class ID"""
    for category in CS2_ITEMS.values():
        for item in category.values():
            if item["classid"] == classid:
                return item
    return None


def create_asset_item(assetid: str, classid: str, appid: int = 730, contextid: str = "2"):
    """Create an asset item for inventory"""
    item_def = get_item_by_classid(classid)
    if not item_def:
        return None
    
    return {
        "appid": appid,
        "contextid": contextid,
        "assetid": assetid,
        "classid": classid,
        "instanceid": "0",
        "amount": "1"
    }


def create_description(classid: str, appid: int = 730):
    """Create item description"""
    item_def = get_item_by_classid(classid)
    if not item_def:
        return None
    
    return {
        "appid": appid,
        "classid": classid,
        "instanceid": "0",
        "icon_url": item_def["icon_url"],
        "icon_url_large": item_def["icon_url"],
        "name": item_def["name"],
        "market_hash_name": item_def["market_hash_name"],
        "type": item_def["type"],
        "tradable": 1,
        "marketable": 1,
        "commodity": 1
    }
