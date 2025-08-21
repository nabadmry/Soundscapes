#!/usr/bin/env bash
set -e
# Activate venv if you want:
# python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
