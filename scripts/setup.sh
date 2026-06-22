#!/usr/bin/env bash
set -e

echo "============================================"
echo " ResumeForge Local - Setup Script"
echo "============================================"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo ""
echo "[1/4] Creating Python virtual environment..."
cd backend
python3 -m venv venv
source venv/bin/activate

echo ""
echo "[2/4] Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "[3/4] Downloading NLP models..."
python scripts/download_nlp_models.py
python -c "import nltk; nltk.download('punkt'); nltk.download('punkt_tab'); nltk.download('stopwords')"

cd ../frontend
echo ""
echo "[4/4] Installing frontend dependencies..."
npm install

cd ..
echo ""
echo "============================================"
echo " Setup complete!"
echo ""
echo " To start the backend:"
echo "   cd backend && source venv/bin/activate"
echo "   uvicorn app.main:app --reload --port 8000"
echo ""
echo " To start the frontend (new terminal):"
echo "   cd frontend && npm run dev"
echo ""
echo " Or use Docker:"
echo "   docker-compose up --build"
echo "============================================"
