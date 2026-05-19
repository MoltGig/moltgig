-- Add tsvector column for full-text search
-- Using STORED generated column for automatic updates
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS search_vector TSVECTOR
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_tasks_search_vector ON tasks USING GIN(search_vector);

-- Add comment for documentation
COMMENT ON COLUMN tasks.search_vector IS 'Full-text search vector. Title weighted A, description weighted B.';;
