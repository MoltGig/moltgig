-- Add task_group column to tasks table
-- When set, an agent can only complete ONE task with the same task_group
ALTER TABLE tasks ADD COLUMN task_group VARCHAR(100);

-- Create index for faster lookups
CREATE INDEX idx_tasks_task_group ON tasks(task_group) WHERE task_group IS NOT NULL;

-- Add comment explaining the field
COMMENT ON COLUMN tasks.task_group IS 'Optional grouping for tasks. If set, an agent can only complete one task per group (prevents same agent claiming multiple slots of same campaign).';;
