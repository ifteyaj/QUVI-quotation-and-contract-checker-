#!/usr/bin/env bash
# QUVI dev launcher — starts backend + frontend in one terminal.
# Press Ctrl+C to stop both servers.
# Usage: ./dev.sh
#
# Backend (Terminal 1):
# cd backend && .venv/bin/uvicorn main:app --reload --host 127.0.0.1 --port 8000
#
# Frontend (Terminal 2):
# cd frontend && npm run dev

cd "$(dirname "$0")" || exit 1

if [ ! -x backend/.venv/bin/uvicorn ]; then
  echo "Backend venv missing. Rebuild it with:"
  echo "  cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt"
  exit 1
fi

start_backend() {
  cd backend && .venv/bin/uvicorn main:app --reload --host 127.0.0.1 --port 8000
}

start_frontend() {
  cd frontend && npm run dev
}

trap 'kill 0 2>/dev/null' EXIT INT TERM

echo "Starting QUVI dev servers..."
start_backend &
BACKEND_PID=$!
start_frontend &
FRONTEND_PID=$!

echo "Backend : http://127.0.0.1:8000  (docs: http://127.0.0.1:8000/docs)"
echo "Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop both."

wait "$BACKEND_PID" "$FRONTEND_PID"
