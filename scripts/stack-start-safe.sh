#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WSL_DISTRO="${WSL_DISTRO:-Ubuntu}"
SKIP_DOCKER="${SKIP_DOCKER:-0}"
BACKEND_DIR="${BACKEND_DIR:-backend}"
FRONTEND_DIR="${FRONTEND_DIR:-frontend}"
BACKEND_CMD="${BACKEND_CMD:-npm run dev}"
FRONTEND_CMD="${FRONTEND_CMD:-npm run dev}"

LOGS_DIR="$REPO_DIR/.ops-logs"
BACKEND_PATH="$REPO_DIR/$BACKEND_DIR"
FRONTEND_PATH="$REPO_DIR/$FRONTEND_DIR"

mkdir -p "$LOGS_DIR"

if [[ "$SKIP_DOCKER" != "1" ]]; then
  echo "Subindo docker compose..."
  (cd "$REPO_DIR" && docker compose up -d)
else
  echo "Skip docker ativo."
fi

start_proc() {
  local name="$1"
  local app_path="$2"
  local cmd="$3"
  local pid_file="$LOGS_DIR/${name}.pid"
  local log_file="$LOGS_DIR/${name}-dev.log"

  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file")"
    if kill -0 "$pid" 2>/dev/null; then
      echo "$name: já ativo (pid $pid)"
      return 0
    fi
    rm -f "$pid_file"
  fi

  nohup bash -lc "cd '$app_path' && $cmd" > "$log_file" 2>&1 < /dev/null &
  echo $! > "$pid_file"
  echo "$name: iniciado (pid $(cat "$pid_file"))"
}

start_proc backend "$BACKEND_PATH" "$BACKEND_CMD"
start_proc frontend "$FRONTEND_PATH" "$FRONTEND_CMD"

echo
echo "Status rápido:"
for n in backend frontend; do
  pid_file="$LOGS_DIR/${n}.pid"
  if [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    echo "$n processo: UP (pid $(cat "$pid_file"))"
  else
    echo "$n processo: DOWN"
  fi
done

echo
echo "docker compose ps:"
(cd "$REPO_DIR" && docker compose ps || true)

echo
echo "Logs:"
echo " - $LOGS_DIR/backend-dev.log"
echo " - $LOGS_DIR/frontend-dev.log"
