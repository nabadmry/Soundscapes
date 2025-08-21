from typing import List, Dict

AVAILABLE_TAGS = ['rain','thunder','wind','forest','birds','river','waves','fireplace','cafe','train','night']

BASE = {
    "tempo": 60,
    "masterVolume": 0.8,
    "layers": []
}

# Map tags to client-side generator layer definitions
TAG_TO_LAYERS = {
    "rain": [{"type": "rain", "gain": 0.7}],
    "thunder": [{"type": "thunder", "gain": 0.5}],
    "wind": [{"type": "wind", "gain": 0.6}],
    "forest": [{"type": "wind", "gain": 0.3}, {"type": "forest_floor", "gain": 0.3}],
    "birds": [{"type": "birds", "gain": 0.5}],
    "river": [{"type": "river", "gain": 0.6}],
    "waves": [{"type": "waves", "gain": 0.6}],
    "fireplace": [{"type": "fireplace", "gain": 0.5}],
    "cafe": [{"type": "cafe", "gain": 0.6}],
    "train": [{"type": "train", "gain": 0.5}],
    "night": [{"type": "night_crickets", "gain": 0.4}],
}

def tags_to_recipe(tags: List[str]) -> Dict:
    recipe = {**BASE, "layers": []}
    for t in tags:
        layers = TAG_TO_LAYERS.get(t, [])
        recipe["layers"].extend(layers)
    # Cap layers to avoid CPU spikes
    if len(recipe["layers"]) > 8:
        recipe["layers"] = recipe["layers"][:8]
    return recipe
