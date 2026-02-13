#!/bin/bash
# Run Expo dev server with tunnel on the VPS
# Usage: SSH into VM, then run this script

set -euo pipefail

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

REPO_DIR="$HOME/projects/midl-journal"

# ── Clone if needed ─────────────────────────────────────────
if [ ! -d "$REPO_DIR" ]; then
  echo "Repo not found. Cloning..."
  mkdir -p "$HOME/projects"
  cd "$HOME/projects"
  git clone git@github.com:Ronitron007/midl-journal.git

  echo ""
  echo "Repo cloned. Now copy .env.local from your laptop:"
  echo "  gcloud compute scp app/.env.local midl-dev-server:~/projects/midl-journal/app/.env.local --zone=asia-southeast1-b"
  echo ""
  echo "Then re-run this script."
  exit 0
fi

cd "$REPO_DIR/app"

# ── Check .env.local before proceeding ──────────────────────
if [ ! -f .env.local ]; then
  echo "ERROR: .env.local not found."
  echo "Copy it from your laptop:"
  echo "  gcloud compute scp app/.env.local midl-dev-server:~/projects/midl-journal/app/.env.local --zone=asia-southeast1-b"
  exit 1
fi

# ── Pull latest ─────────────────────────────────────────────
git pull origin main

# ── Install deps ────────────────────────────────────────────
npm install

# ── Start dev server with tunnel ────────────────────────────
echo "Starting Expo dev server with tunnel..."
npx expo start --dev-client --tunnel
