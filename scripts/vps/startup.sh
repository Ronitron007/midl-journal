#!/bin/bash
# GCP VM startup script — installs Node.js, git, and project deps
# Runs automatically on first boot via metadata startup-script

set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

# ── System packages ─────────────────────────────────────────
apt-get update -y
apt-get install -y curl git build-essential

# ── Node.js 20 LTS via nvm ─────────────────────────────────
DEFAULT_USER=$(getent passwd 1000 | cut -d: -f1)
DEFAULT_HOME="/home/$DEFAULT_USER"

sudo -u "$DEFAULT_USER" bash -c '
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm alias default 20
  npm install -g npm@latest
'

# ── Create project directory ────────────────────────────────
mkdir -p "$DEFAULT_HOME/projects"
chown "$DEFAULT_USER:$DEFAULT_USER" "$DEFAULT_HOME/projects"

echo "Startup complete."
