#!/bin/bash
# Provision a GCP VM for Expo dev server with ngrok tunnel
# Usage: ./scripts/vps/provision.sh

set -euo pipefail

# ── Config ──────────────────────────────────────────────────
PROJECT_ID="midl-journal"
ZONE="asia-southeast1-b"
MACHINE_TYPE="e2-medium"  # 2 vCPU, 4GB RAM — metro bundler needs this
VM_NAME="midl-dev-server"
DISK_SIZE="30"  # GB — node_modules is large

# ── Set project ─────────────────────────────────────────────
gcloud config set project "$PROJECT_ID"

# ── Create firewall rule (SSH only) ─────────────────────────
echo "Creating firewall rule for SSH..."
gcloud compute firewall-rules create allow-ssh-dev \
  --direction=INGRESS \
  --priority=1000 \
  --network=default \
  --action=ALLOW \
  --rules=tcp:22 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=dev-server \
  2>/dev/null || echo "Firewall rule already exists, skipping."

# ── Create VM ───────────────────────────────────────────────
echo "Creating VM: $VM_NAME in $ZONE..."
gcloud compute instances create "$VM_NAME" \
  --zone="$ZONE" \
  --machine-type="$MACHINE_TYPE" \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size="${DISK_SIZE}GB" \
  --boot-disk-type=pd-balanced \
  --tags=dev-server \
  --metadata-from-file=startup-script=scripts/vps/startup.sh \
  --scopes=default

echo ""
echo "VM created. Wait ~2 min for startup script to finish, then:"
echo "  gcloud compute ssh $VM_NAME --zone=$ZONE"
echo ""
echo "To stop (save cost):  gcloud compute instances stop $VM_NAME --zone=$ZONE"
echo "To start again:       gcloud compute instances start $VM_NAME --zone=$ZONE"
