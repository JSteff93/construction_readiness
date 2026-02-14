import * as XLSX from 'xlsx';
import { Template, Category, Task, DEFAULT_TASK_STATUS } from '../types';
import { generateId } from './idGenerator';

const CATEGORY_COLORS = [
  '#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe',
  '#43e97b', '#fa709a', '#fee140', '#30cfd0', '#330867'
];

/**
 * Downloads a template as an Excel file
 */
export const downloadTemplateAsExcel = (template: Template): void => {
  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Template Info
  const templateInfo = [
    ['Template Name', template.name],
    ['Description', template.description || ''],
  ];
  const templateSheet = XLSX.utils.aoa_to_sheet(templateInfo);
  XLSX.utils.book_append_sheet(workbook, templateSheet, 'Template Info');

  // Sheet 2: Tasks (main sheet for editing)
  const tasksData: any[] = [
    ['Category', 'Task Name', 'Description', 'Lead Review Time (days)', 'Task Owner', 'Task Assignee'],
  ];

  // Group tasks by category
  template.categories.forEach(category => {
    const categoryTasks = template.tasks.filter(t => t.categoryId === category.id);
    if (categoryTasks.length === 0) {
      // Add at least one row for each category
      tasksData.push([category.name, '', '', '', '', '']);
    } else {
      categoryTasks.forEach(task => {
        tasksData.push([
          category.name,
          task.name,
          task.description || '',
          task.leadReviewTime || '',
          task.taskOwner || '',
          task.taskAssignee || '',
        ]);
      });
    }
  });

  const tasksSheet = XLSX.utils.aoa_to_sheet(tasksData);
  
  // Set column widths
  tasksSheet['!cols'] = [
    { wch: 20 }, // Category
    { wch: 30 }, // Task Name
    { wch: 40 }, // Description
    { wch: 20 }, // Lead Review Time
    { wch: 20 }, // Task Owner
    { wch: 20 }, // Task Assignee
  ];

  XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Tasks');

  // Download the file
  const fileName = `${template.name.replace(/[^a-z0-9]/gi, '_')}_template.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

/**
 * Downloads a blank Excel template
 */
export const downloadBlankTemplate = (): void => {
  const workbook = XLSX.utils.book_new();

  // Template Info sheet
  const templateInfo = [
    ['Template Name', ''],
    ['Description', ''],
  ];
  const templateSheet = XLSX.utils.aoa_to_sheet(templateInfo);
  XLSX.utils.book_append_sheet(workbook, templateSheet, 'Template Info');

  // Tasks sheet with headers and example rows
  const tasksData = [
    ['Category', 'Task Name', 'Description', 'Lead Review Time (days)', 'Task Owner', 'Task Assignee'],
    ['Permits', 'Building Permit', 'Obtain building permit from local authority', '14', '', ''],
    ['Permits', 'Electrical Permit', 'Obtain electrical permit', '7', '', ''],
    ['Materials', 'Concrete Order', 'Order concrete for foundation', '21', '', ''],
    ['Materials', 'Rebar Delivery', 'Schedule rebar delivery', '14', '', ''],
    ['Site Preparation', 'Site Survey', 'Complete site survey', '30', '', ''],
  ];

  const tasksSheet = XLSX.utils.aoa_to_sheet(tasksData);
  
  // Set column widths
  tasksSheet['!cols'] = [
    { wch: 20 },
    { wch: 30 },
    { wch: 40 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Tasks');

  XLSX.writeFile(workbook, 'template_blank.xlsx');
};

/**
 * Parses an Excel file and creates a Template
 */
export const parseExcelToTemplate = (file: File): Promise<Template> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Read Template Info sheet
        let templateName = 'Imported Template';
        let templateDescription = '';

        if (workbook.SheetNames.includes('Template Info')) {
          const templateSheet = workbook.Sheets['Template Info'];
          const templateData = XLSX.utils.sheet_to_json(templateSheet, { header: 1 }) as any[][];
          
          if (templateData.length > 0 && templateData[0][0] === 'Template Name' && templateData[0][1]) {
            templateName = String(templateData[0][1]).trim();
          }
          if (templateData.length > 1 && templateData[1][0] === 'Description' && templateData[1][1]) {
            templateDescription = String(templateData[1][1]).trim();
          }
        }

        // Read Tasks sheet
        let tasksSheetName = 'Tasks';
        if (!workbook.SheetNames.includes('Tasks')) {
          // Try to find the sheet with tasks data (usually the second sheet or first non-template-info sheet)
          tasksSheetName = workbook.SheetNames.find(name => name !== 'Template Info') || workbook.SheetNames[0];
        }

        const tasksSheet = workbook.Sheets[tasksSheetName];
        const tasksData = XLSX.utils.sheet_to_json(tasksSheet, { header: 1 }) as any[][];

        if (tasksData.length < 2) {
          reject(new Error('Excel file must contain at least a header row and one data row'));
          return;
        }

        // Validate header row
        const headers = tasksData[0].map((h: any) => String(h).toLowerCase().trim());
        const categoryIndex = headers.findIndex((h: string) => h.includes('category'));
        const taskNameIndex = headers.findIndex((h: string) => h.includes('task') && h.includes('name'));
        const descriptionIndex = headers.findIndex((h: string) => h.includes('description'));
        const leadTimeIndex = headers.findIndex((h: string) => h.includes('lead') || h.includes('review') || h.includes('time'));
        const taskOwnerIndex = headers.findIndex((h: string) => h.includes('task') && h.includes('owner'));
        const taskAssigneeIndex = headers.findIndex((h: string) => h.includes('task') && h.includes('assignee'));

        if (categoryIndex === -1 || taskNameIndex === -1) {
          reject(new Error('Excel file must have "Category" and "Task Name" columns'));
          return;
        }

        // Parse data rows
        const categoryMap = new Map<string, Category>();
        const tasks: Task[] = [];

        for (let i = 1; i < tasksData.length; i++) {
          const row = tasksData[i];
          const categoryName = String(row[categoryIndex] || '').trim();
          const taskName = String(row[taskNameIndex] || '').trim();

          if (!categoryName || !taskName) {
            continue; // Skip empty rows
          }

          // Get or create category
          let category = categoryMap.get(categoryName);
          if (!category) {
            category = {
              id: generateId(),
              name: categoryName,
              color: CATEGORY_COLORS[categoryMap.size % CATEGORY_COLORS.length],
            };
            categoryMap.set(categoryName, category);
          }

          // Create task
          const description = descriptionIndex >= 0 ? String(row[descriptionIndex] || '').trim() : '';
          const leadTimeStr = leadTimeIndex >= 0 ? String(row[leadTimeIndex] || '').trim() : '';
          const leadTime = leadTimeStr ? parseInt(leadTimeStr, 10) : undefined;
          const taskOwner = taskOwnerIndex >= 0 ? String(row[taskOwnerIndex] || '').trim() : '';
          const taskAssignee = taskAssigneeIndex >= 0 ? String(row[taskAssigneeIndex] || '').trim() : '';

          const task: Task = {
            id: generateId(),
            name: taskName,
            description: description || undefined,
            categoryId: category.id,
            completed: false,
            leadReviewTime: leadTime && !isNaN(leadTime) ? leadTime : undefined,
            status: DEFAULT_TASK_STATUS,
            taskOwner: taskOwner || undefined,
            taskAssignee: taskAssignee || undefined,
          };

          tasks.push(task);
        }

        if (categoryMap.size === 0 || tasks.length === 0) {
          reject(new Error('No valid categories or tasks found in Excel file'));
          return;
        }

        const template: Template = {
          id: generateId(),
          name: templateName,
          description: templateDescription || undefined,
          categories: Array.from(categoryMap.values()),
          tasks,
          createdAt: new Date().toISOString(),
        };

        resolve(template);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
};
