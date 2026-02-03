import { supabase } from '../lib/supabase';
import { AppData, Template, Package, Category, Task } from '../types';

/**
 * Load all data from Supabase
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
    // Upsert template
    const { error: templateError } = await supabase
      .from('templates')
      .upsert({
        id: template.id,
        name: template.name,
        description: template.description || null,
        created_at: template.createdAt,
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
      });

    if (packageError) throw packageError;

    // Delete existing categories and tasks for this package
    await supabase.from('categories').delete().eq('package_id', pkg.id);
    await supabase.from('tasks').delete().eq('package_id', pkg.id);

    // Insert categories
    if (pkg.categories.length > 0) {
      const categoriesToInsert = pkg.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        template_id: null,
        package_id: pkg.id,
      }));

      const { error: categoriesError } = await supabase
        .from('categories')
        .insert(categoriesToInsert);

      if (categoriesError) throw categoriesError;
    }

    // Insert tasks
    if (pkg.tasks.length > 0) {
      const tasksToInsert = pkg.tasks.map(task => ({
        id: task.id,
        name: task.name,
        description: task.description || null,
        category_id: task.categoryId,
        completed: task.completed,
        completed_date: task.completedDate ? new Date(task.completedDate).toISOString() : null,
        due_date: task.dueDate || null,
        lead_review_time: task.leadReviewTime || null,
        template_id: null,
        package_id: pkg.id,
      }));

      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(tasksToInsert);

      if (tasksError) throw tasksError;
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
