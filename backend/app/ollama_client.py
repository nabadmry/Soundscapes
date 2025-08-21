import os, json
import httpx

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")

SYSTEM = (
    "You are an assistant that maps a user's ambient sound request into tags. "
    "Return ONLY a compact JSON array of lowercase tags from this list: "
    "['rain','thunder','wind','forest','birds','river','waves','fireplace','cafe','train','night']. "
    "Pick 2-5 that best match the request. No extra text."
)

PROMPT_TEMPLATE = "Request: {query}\nJSON tags:"

AVAILABLE = {'rain','thunder','wind','forest','birds','river','waves','fireplace','cafe','train','night'}

async def summarize_to_tags(query: str) -> list[str]:
    """Try Ollama; if unavailable or fails, fall back to keyword heuristic."""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            payload = {
                "model": OLLAMA_MODEL,
                "prompt": f"""{SYSTEM}\n\n{PROMPT_TEMPLATE.format(query=query)}""",
                "stream": False,
            }
            r = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
            r.raise_for_status()
            txt = r.json().get("response", "").strip()
            # Attempt to parse JSON array
            import json as _json
            tags = _json.loads(txt)
            tags = [t for t in tags if isinstance(t, str)]
            # keep only available
            tags = [t for t in tags if t in AVAILABLE]
            if tags:
                return tags[:5]
    except Exception:
        pass

    # Fallback heuristic
    q = query.lower()
    tags = []
    def add(tag, *keys):
        if any(k in q for k in keys):
            tags.append(tag)
    add("rain", "rain", "drizzle", "storm")
    add("thunder", "thunder", "storm")
    add("wind", "wind", "breeze", "gust")
    add("forest", "forest", "woods", "jungle")
    add("birds", "bird", "sparrow", "chirp")
    add("river", "river", "stream", "brook")
    add("waves", "ocean", "sea", "waves", "beach")
    add("fireplace", "fire", "campfire", "hearth")
    add("cafe", "cafe", "coffee", "shop")
    add("train", "train", "rail", "track")
    add("night", "night", "midnight", "evening")
    # ensure uniqueness and limit
    seen = set()
    out = []
    for t in tags:
        if t not in seen:
            out.append(t)
            seen.add(t)
    return out[:5] if out else ["rain","wind","night"]
