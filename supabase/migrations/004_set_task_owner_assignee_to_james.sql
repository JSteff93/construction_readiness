-- One-time migration: Set all existing tasks' owner and assignee to "James"
UPDATE tasks
SET task_owner = 'James',
    task_assignee = 'James';
