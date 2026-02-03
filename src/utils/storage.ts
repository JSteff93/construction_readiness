import { AppData, Template, Package } from '../types';
import * as supabaseStorage from './supabaseStorage';

const STORAGE_KEY = 'construction-readiness-data';

// Check if Supabase is configured
const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && key && url !== 'your_supabase_project_url' && key !== 'your_supabase_anon_key');
};

// LocalStorage fallback functions
const loadDataLocal = (): AppData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading data from storage:', error);
  }
  return { templates: [], packages: [] };
};

const saveDataLocal = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data to storage:', error);
  }
};

const saveTemplateLocal = (template: Template): void => {
  const data = loadDataLocal();
  const index = data.templates.findIndex(t => t.id === template.id);
  if (index >= 0) {
    data.templates[index] = template;
  } else {
    data.templates.push(template);
  }
  saveDataLocal(data);
};

const deleteTemplateLocal = (templateId: string): void => {
  const data = loadDataLocal();
  data.templates = data.templates.filter(t => t.id !== templateId);
  data.packages = data.packages.filter(p => p.templateId !== templateId);
  saveDataLocal(data);
};

const savePackageLocal = (pkg: Package): void => {
  const data = loadDataLocal();
  const index = data.packages.findIndex(p => p.id === pkg.id);
  if (index >= 0) {
    data.packages[index] = pkg;
  } else {
    data.packages.push(pkg);
  }
  saveDataLocal(data);
};

const deletePackageLocal = (packageId: string): void => {
  const data = loadDataLocal();
  data.packages = data.packages.filter(p => p.id !== packageId);
  saveDataLocal(data);
};

// Main exported functions - use Supabase if configured, otherwise fallback to localStorage
export const loadData = async (): Promise<AppData> => {
  if (isSupabaseConfigured()) {
    try {
      return await supabaseStorage.loadData();
    } catch (error) {
      console.error('Error loading from Supabase, falling back to localStorage:', error);
      return loadDataLocal();
    }
  }
  return loadDataLocal();
};

export const saveData = async (data: AppData): Promise<void> => {
  if (isSupabaseConfigured()) {
    try {
      // Save all templates and packages
      for (const template of data.templates) {
        await supabaseStorage.saveTemplate(template);
      }
      for (const pkg of data.packages) {
        await supabaseStorage.savePackage(pkg);
      }
    } catch (error) {
      console.error('Error saving to Supabase, falling back to localStorage:', error);
      saveDataLocal(data);
    }
  } else {
    saveDataLocal(data);
  }
};

export const saveTemplate = async (template: Template): Promise<void> => {
  if (isSupabaseConfigured()) {
    try {
      await supabaseStorage.saveTemplate(template);
    } catch (error) {
      console.error('Error saving template to Supabase, falling back to localStorage:', error);
      saveTemplateLocal(template);
    }
  } else {
    saveTemplateLocal(template);
  }
};

export const deleteTemplate = async (templateId: string): Promise<void> => {
  if (isSupabaseConfigured()) {
    try {
      await supabaseStorage.deleteTemplate(templateId);
    } catch (error) {
      console.error('Error deleting template from Supabase, falling back to localStorage:', error);
      deleteTemplateLocal(templateId);
    }
  } else {
    deleteTemplateLocal(templateId);
  }
};

export const savePackage = async (pkg: Package): Promise<void> => {
  if (isSupabaseConfigured()) {
    try {
      await supabaseStorage.savePackage(pkg);
    } catch (error) {
      console.error('Error saving package to Supabase, falling back to localStorage:', error);
      savePackageLocal(pkg);
    }
  } else {
    savePackageLocal(pkg);
  }
};

export const deletePackage = async (packageId: string): Promise<void> => {
  if (isSupabaseConfigured()) {
    try {
      await supabaseStorage.deletePackage(packageId);
    } catch (error) {
      console.error('Error deleting package from Supabase, falling back to localStorage:', error);
      deletePackageLocal(packageId);
    }
  } else {
    deletePackageLocal(packageId);
  }
};
