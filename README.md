# MIDL Journal

AI-powered meditation companion app built around the MIDL (Mindfulness in Daily Life) 17-skill progression system.

## Stack

- React Native
- Supabase (auth, database, storage)
- OpenAI API
- Tiptap (rich text)
- pgvector (semantic search)

## Structure

```
midl-journal/
├── docs/plans/          # Design documents
├── data/midl-skills/    # Scraped MIDL content
└── src/                 # App source (TBD)
```

## Design

See [docs/plans/2026-01-22-meditation-app-design.md](docs/plans/2026-01-22-meditation-app-design.md)

## Remote Dev Server (GCP)

VM: `midl-dev-server` in `asia-southeast1-b`

### First-time setup

```bash
# 1. Provision VM (from project root)
./scripts/vps/provision.sh

# 2. SSH in
gcloud compute ssh midl-dev-server --zone=asia-southeast1-b

# 3. On VM: set up GitHub SSH key
ssh-keygen -t ed25519 -C "midl-vps"
cat ~/.ssh/id_ed25519.pub
# Add output to GitHub -> Settings -> SSH keys

# 4. On VM: install node (if not already)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 20

# 5. On VM: clone repo
cd ~/projects && git clone git@github.com:Ronitron007/midl-journal.git

# 6. From laptop: copy env file
gcloud compute scp app/.env.local midl-dev-server:~/projects/midl-journal/app/.env.local --zone=asia-southeast1-b

# 7. On VM: start dev server
~/projects/midl-journal/scripts/vps/run-dev.sh
```

### Daily use

```bash
# Start VM
gcloud compute instances start midl-dev-server --zone=asia-southeast1-b

# SSH in
gcloud compute ssh midl-dev-server --zone=asia-southeast1-b

# Run dev server (pulls latest, installs deps, starts tunnel)
~/projects/midl-journal/scripts/vps/run-dev.sh

# Stop VM when done (saves cost — only pay ~$1.50/mo for disk)
gcloud compute instances stop midl-dev-server --zone=asia-southeast1-b
```
