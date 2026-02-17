export interface Category {
  id: string;
  name: string;
  color: string;
}

export const TASK_STATUSES = [
  'Pending',
  'In Progress',
  'Waiting',
  'Complete',
  'Delegated',
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const DEFAULT_TASK_STATUS: TaskStatus = 'Pending';

export interface Task {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  completed: boolean;
  completedDate?: string;
  dueDate?: string;
  leadReviewTime?: number; // in days
  status?: TaskStatus;
  taskOwner?: string;
  taskAssignee?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
  categories: Category[];
  tasks: Task[];
  createdAt: string;
}

export interface Package {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
  templateId: string;
  expectedStartDate: string;
  tasks: Task[];
  categories: Category[];
  createdAt: string;
}

export interface AppData {
  projects: Project[];
  templates: Template[];
  packages: Package[];
}

