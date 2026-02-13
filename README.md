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



gcloud compute ssh midl-dev-server --zone=asia-southeast1-b

To stop (save cost):  gcloud compute instances stop midl-dev-server --zone=asia-southeast1-b
To start again:       gcloud compute instances start midl-dev-server --zone=asia-southeast1-b
