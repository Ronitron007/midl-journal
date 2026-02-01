-- Fix: ivfflat index requires existing data, fails on fresh DB
-- Solution: use HNSW index instead (works without data, better performance)

-- Drop the problematic ivfflat index
DROP INDEX IF EXISTS idx_entries_embedding;

-- Create HNSW index (pgvector 0.5+, works without data)
CREATE INDEX idx_entries_embedding ON entries USING hnsw(embedding vector_cosine_ops);
