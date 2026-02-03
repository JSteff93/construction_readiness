export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  completed: boolean;
  completedDate?: string;
  dueDate?: string;
  leadReviewTime?: number; // in days
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  categories: Category[];
  tasks: Task[];
  createdAt: string;
}

export interface Package {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  expectedStartDate: string;
  tasks: Task[];
  categories: Category[];
  createdAt: string;
}

export interface AppData {
  templates: Template[];
  packages: Package[];
}

