import { supabase } from '../lib/supabase';
import { AppData, Template, Package, Category, Task, DEFAULT_TASK_STATUS } from '../types';

const getCurrentUserId = async (): Promise<string | null> => {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
};

/**
 * Load all data from Supabase (RLS filters by user automatically)
 */
export const loadData = async (): Promise<AppData> => {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }
  
  try {
    // Load templates with their categories and tasks
    const { data: templates, error: templatesError } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (templatesError) throw templatesError;

    // Load packages with their categories and tasks
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('*')
      .order('created_at', { ascending: false });

    if (packagesError) throw packagesError;

    // Load categories for templates
    const { data: templateCategories, error: templateCategoriesError } = await supabase
      .from('categories')
      .select('*')
      .not('template_id', 'is', null);

    if (templateCategoriesError) throw templateCategoriesError;

    // Load categories for packages
    const { data: packageCategories, error: packageCategoriesError } = await supabase
      .from('categories')
      .select('*')
      .not('package_id', 'is', null);

    if (packageCategoriesError) throw packageCategoriesError;

    // Load tasks for templates
    const { data: templateTasks, error: templateTasksError } = await supabase
      .from('tasks')
      .select('*')
      .not('template_id', 'is', null);

    if (templateTasksError) throw templateTasksError;

    // Load tasks for packages
    const { data: packageTasks, error: packageTasksError } = await supabase
      .from('tasks')
      .select('*')
      .not('package_id', 'is', null);

    if (packageTasksError) throw packageTasksError;

    // Transform templates
    const transformedTemplates: Template[] = (templates || []).map((template: any) => {
      const categories: Category[] = (templateCategories || [])
        .filter((c: any) => c.template_id === template.id)
        .map((c: any) => ({
          id: c.id,
          name: c.name,
          color: c.color,
        }));

      const tasks: Task[] = (templateTasks || [])
        .filter((t: any) => t.template_id === template.id)
        .map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description || undefined,
          categoryId: t.category_id,
          completed: t.completed,
          completedDate: t.completed_date ? new Date(t.completed_date).toISOString() : undefined,
          dueDate: t.due_date || undefined,
          leadReviewTime: t.lead_review_time || undefined,
          status: (t.status || DEFAULT_TASK_STATUS) as Task['status'],
          taskOwner: t.task_owner_user_id || undefined,
          taskAssignee: t.task_assignee_user_id || undefined,
        }));

      return {
        id: template.id,
        name: template.name,
        description: template.description || undefined,
        categories,
        tasks,
        createdAt: new Date(template.created_at).toISOString(),
      };
    });

    // Transform packages
    const transformedPackages: Package[] = (packages || []).map((pkg: any) => {
      const categories: Category[] = (packageCategories || [])
        .filter((c: any) => c.package_id === pkg.id)
        .map((c: any) => ({
          id: c.id,
          name: c.name,
          color: c.color,
        }));

      const tasks: Task[] = (packageTasks || [])
        .filter((t: any) => t.package_id === pkg.id)
        .map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description || undefined,
          categoryId: t.category_id,
          completed: t.completed,
          completedDate: t.completed_date ? new Date(t.completed_date).toISOString() : undefined,
          dueDate: t.due_date || undefined,
          leadReviewTime: t.lead_review_time || undefined,
          status: (t.status || DEFAULT_TASK_STATUS) as Task['status'],
          taskOwner: t.task_owner_user_id || undefined,
          taskAssignee: t.task_assignee_user_id || undefined,
        }));

      return {
        id: pkg.id,
        name: pkg.name,
        description: pkg.description || undefined,
        templateId: pkg.template_id,
        expectedStartDate: pkg.expected_start_date,
        categories,
        tasks,
        createdAt: new Date(pkg.created_at).toISOString(),
      };
    });

    return {
      templates: transformedTemplates,
      packages: transformedPackages,
    };
  } catch (error) {
    console.error('Error loading data from Supabase:', error);
    return { templates: [], packages: [] };
  }
};

/**
 * Save a template to Supabase
 */
export const saveTemplate = async (template: Template): Promise<void> => {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }
  
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('You must be signed in to save templates');

    // Upsert template
    const { error: templateError } = await supabase
      .from('templates')
      .upsert({
        id: template.id,
        name: template.name,
        description: template.description || null,
        created_at: template.createdAt,
        user_id: userId,
      });

    if (templateError) throw templateError;

    // Delete existing categories and tasks for this template
    await supabase.from('categories').delete().eq('template_id', template.id);
    await supabase.from('tasks').delete().eq('template_id', template.id);

    // Insert categories
    if (template.categories.length > 0) {
      const categoriesToInsert = template.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        template_id: template.id,
        package_id: null,
      }));

      const { error: categoriesError } = await supabase
        .from('categories')
        .insert(categoriesToInsert);

      if (categoriesError) throw categoriesError;
    }

    // Insert tasks
    if (template.tasks.length > 0) {
      const tasksToInsert = template.tasks.map(task => ({
        id: task.id,
        name: task.name,
        description: task.description || null,
        category_id: task.categoryId,
        completed: task.completed,
        completed_date: task.completedDate ? new Date(task.completedDate).toISOString() : null,
        due_date: task.dueDate || null,
        lead_review_time: task.leadReviewTime || null,
        status: task.status || DEFAULT_TASK_STATUS,
        task_owner_user_id: task.taskOwner || null,
        task_assignee_user_id: task.taskAssignee || null,
        template_id: template.id,
        package_id: null,
      }));

      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(tasksToInsert);

      if (tasksError) throw tasksError;
    }
  } catch (error) {
    console.error('Error saving template to Supabase:', error);
    throw error;
  }
};

/**
 * Delete a template from Supabase
 */
export const deleteTemplate = async (templateId: string): Promise<void> => {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }
  
  try {
    // Delete template (cascade will delete categories and tasks)
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;

    // Also delete packages using this template
    const { error: packagesError } = await supabase
      .from('packages')
      .delete()
      .eq('template_id', templateId);

    if (packagesError) throw packagesError;
  } catch (error) {
    console.error('Error deleting template from Supabase:', error);
    throw error;
  }
};

/**
 * Save a package to Supabase
 */
export const savePackage = async (pkg: Package): Promise<void> => {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }
  
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('You must be signed in to save packages');

    // Upsert package
    const { error: packageError } = await supabase
      .from('packages')
      .upsert({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description || null,
        template_id: pkg.templateId,
        expected_start_date: pkg.expectedStartDate,
        created_at: pkg.createdAt,
        user_id: userId,
      });

    if (packageError) throw packageError;

    // Upsert categories first (never delete all before insert - avoids data loss if insert fails)
    if (pkg.categories.length > 0) {
      const categoriesToUpsert = pkg.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        template_id: null,
        package_id: pkg.id,
      }));

      const { error: categoriesError } = await supabase
        .from('categories')
        .upsert(categoriesToUpsert, { onConflict: 'id' });

      if (categoriesError) throw categoriesError;
    }

    // Remove categories that are no longer in the package
    const currentCategoryIds = new Set(pkg.categories.map(c => c.id));
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('id')
      .eq('package_id', pkg.id);
    const toRemoveCategories = (existingCategories || []).filter((c: { id: string }) => !currentCategoryIds.has(c.id));
    for (const c of toRemoveCategories) {
      await supabase.from('categories').delete().eq('id', (c as { id: string }).id);
    }

    // Upsert tasks (never delete all before insert - avoids data loss if insert fails)
    if (pkg.tasks.length > 0) {
      const tasksToUpsert = pkg.tasks.map(task => ({
        id: task.id,
        name: task.name,
        description: task.description || null,
        category_id: task.categoryId,
        completed: task.completed,
        completed_date: task.completedDate ? new Date(task.completedDate).toISOString() : null,
        due_date: task.dueDate || null,
        lead_review_time: task.leadReviewTime || null,
        status: task.status || DEFAULT_TASK_STATUS,
        task_owner_user_id: task.taskOwner || null,
        task_assignee_user_id: task.taskAssignee || null,
        template_id: null,
        package_id: pkg.id,
      }));

      const { error: tasksError } = await supabase
        .from('tasks')
        .upsert(tasksToUpsert, { onConflict: 'id' });

      if (tasksError) throw tasksError;
    }

    // Remove tasks that are no longer in the package
    const currentTaskIds = new Set(pkg.tasks.map(t => t.id));
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('id')
      .eq('package_id', pkg.id);
    const toRemoveTasks = (existingTasks || []).filter((t: { id: string }) => !currentTaskIds.has(t.id));
    for (const t of toRemoveTasks) {
      await supabase.from('tasks').delete().eq('id', (t as { id: string }).id);
    }
  } catch (error) {
    console.error('Error saving package to Supabase:', error);
    throw error;
  }
};

/**
 * Delete a package from Supabase
 */
export const deletePackage = async (packageId: string): Promise<void> => {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }
  
  try {
    // Delete package (cascade will delete categories and tasks)
    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', packageId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting package from Supabase:', error);
    throw error;
  }
};
