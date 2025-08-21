from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from .ollama_client import summarize_to_tags
from .recipes import tags_to_recipe, AVAILABLE_TAGS

app = FastAPI(title="Soundscapes API", version="1.0.0")

# CORS: allow local dev frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    query: str

class RecipeResponse(BaseModel):
    recipe: dict

@app.get("/api/health")
def health():
    return {"ok": True}

@app.get("/api/tags")
def tags():
    return {"available": AVAILABLE_TAGS}

@app.post("/api/generate", response_model=RecipeResponse)
async def generate(req: GenerateRequest):
    query = (req.query or "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="query is required")

    # Try using Ollama to classify into tags; fallback to simple heuristic
    tags = await summarize_to_tags(query)
    recipe = tags_to_recipe(tags)
    return {"recipe": recipe}
