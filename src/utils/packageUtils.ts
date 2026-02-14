import { Package, Task, Template, DEFAULT_TASK_STATUS } from '../types';
import { generateId } from './idGenerator';

/**
 * Calculates the due date for a task from the package's expected start date.
 * - If the task has no lead time: due date = start date.
 * - If the task has lead time (days): due date = start date minus that many days.
 */
export const calculateDueDate = (expectedStartDate: string, leadReviewTime?: number): string => {
  if (leadReviewTime !== undefined && leadReviewTime > 0) {
    const startDate = new Date(expectedStartDate);
    startDate.setDate(startDate.getDate() - leadReviewTime);
    return startDate.toISOString().split('T')[0];
  }
  return expectedStartDate;
};

/**
 * Adds new tasks from a template to a package
 * Only adds tasks that don't already exist in the package (by name and category)
 */
export const addNewTasksToPackage = (
  pkg: Package,
  newTasks: Task[],
  template: Template
): Package => {
  // Create a set of existing task names in the package, grouped by category
  const existingTasks = new Set<string>();
  pkg.tasks.forEach(task => {
    const category = pkg.categories.find(c => c.id === task.categoryId);
    if (category) {
      // Use category name + task name as unique identifier
      existingTasks.add(`${category.name}:${task.name}`);
    }
  });

  // Filter out tasks that already exist
  const tasksToAdd: Task[] = [];
  newTasks.forEach(templateTask => {
    const category = template.categories.find(c => c.id === templateTask.categoryId);
    if (category) {
      const taskKey = `${category.name}:${templateTask.name}`;
      if (!existingTasks.has(taskKey)) {
        // Create a new task for the package with calculated due date
        const newTask: Task = {
          id: generateId(),
          name: templateTask.name,
          description: templateTask.description,
          categoryId: templateTask.categoryId,
          completed: false,
          dueDate: calculateDueDate(pkg.expectedStartDate, templateTask.leadReviewTime),
          leadReviewTime: templateTask.leadReviewTime,
          status: DEFAULT_TASK_STATUS,
          taskOwner: templateTask.taskOwner,
          taskAssignee: templateTask.taskAssignee,
        };
        tasksToAdd.push(newTask);
      }
    }
  });

  // If no new tasks to add, return package as-is
  if (tasksToAdd.length === 0) {
    return pkg;
  }

  // Ensure all categories from the template exist in the package
  const updatedCategories = [...pkg.categories];
  template.categories.forEach(templateCategory => {
    const exists = updatedCategories.some(c => c.id === templateCategory.id);
    if (!exists) {
      updatedCategories.push(templateCategory);
    }
  });

  return {
    ...pkg,
    categories: updatedCategories,
    tasks: [...pkg.tasks, ...tasksToAdd],
  };
};

/**
 * Finds new tasks in an updated template compared to the original
 * Returns tasks that exist in the new template but not in the old one
 */
export const findNewTasks = (oldTemplate: Template, newTemplate: Template): Task[] => {
  // Create a set of existing task identifiers (category name + task name)
  const existingTaskKeys = new Set<string>();
  oldTemplate.tasks.forEach(task => {
    const category = oldTemplate.categories.find(c => c.id === task.categoryId);
    if (category) {
      existingTaskKeys.add(`${category.name}:${task.name}`);
    }
  });

  // Find tasks in new template that don't exist in old template
  const newTasks: Task[] = [];
  newTemplate.tasks.forEach(task => {
    const category = newTemplate.categories.find(c => c.id === task.categoryId);
    if (category) {
      const taskKey = `${category.name}:${task.name}`;
      if (!existingTaskKeys.has(taskKey)) {
        newTasks.push(task);
      }
    }
  });

  return newTasks;
};
