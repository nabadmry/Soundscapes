# 🎧 Soundscapes (Frontend + Backend)

Create relaxing ambient sound environments (rain, forest, cafe, etc.) from a simple text prompt.
No audio files required — sounds are procedurally generated in the browser via WebAudio.

## ✨ Features

- Type a keyword like **"rainy night"** or **"cafe with wind"**
- Backend uses **Ollama** (optional) to map prompts → tags; falls back to heuristics
- Frontend synthesizes audio layers: rain, wind, birds, waves, fireplace, etc.
- Works offline (no internet assets)

---

## 🧩 Tech Stack

- **Backend**: FastAPI, `httpx` (Ollama client)
- **Frontend**: React + Vite (WebAudio API procedural synthesis)
- **Optional**: Ollama (local LLM) to better interpret prompts

---

## 🚀 Quick Start

### 1) Backend

```bash
cd backend
# (optional) python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# copy env example if you want to tweak model
cp ../.env.example .env 2>/dev/null || true
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Health check: <http://localhost:8000/api/health>
- Tags list: <http://localhost:8000/api/tags>

**Using Ollama (optional):**

1. Install Ollama: <https://github.com/ollama/ollama>
2. Pull a small model (e.g. `llama3.1` or `mistral`):
   ```bash
   ollama pull llama3.1
   ollama serve
   ```
3. Ensure `.env` (or env vars) has:
   ```bash
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3.1
   ```

If Ollama is not running, the backend falls back to simple keyword matching.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Open: <http://localhost:5173>

> The frontend calls the backend at `http://localhost:8000`.

---

## 🛠 How it Works

- **/api/generate** takes a prompt and returns a **recipe**:
  ```json
  {
    "tempo": 60,
    "masterVolume": 0.8,
    "layers": [
      {"type": "rain", "gain": 0.7},
      {"type": "wind", "gain": 0.6},
      {"type": "night_crickets", "gain": 0.4}
    ]
  }
  ```
- The browser renders each layer with WebAudio (noise + filters + envelopes), so no audio files are needed.

---

## 📂 Project Structure

```
soundscapes/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── ollama_client.py
│   │   └── recipes.py
│   ├── requirements.txt
│   └── run.sh
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       ├── audio/
│       │   └── engine.js
│       ├── main.jsx
│       └── styles.css
└── .env.example
```

---

## 🔧 Troubleshooting

- **No sound?** Most browsers require a user gesture. Click **Generate** first.
- **CORS errors?** Ensure backend runs on `:8000` and frontend on `:5173`.
- **API unreachable?** Check `http://localhost:8000/api/health` and terminal logs.
- **Ollama errors / timeout?** Try without Ollama first; fallback will still work.

---

## 📜 License

MIT — do whatever you like; attribution appreciated.
This is a test change for PR
