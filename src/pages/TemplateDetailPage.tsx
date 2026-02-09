import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Template, Category, Task, Package, DEFAULT_TASK_STATUS } from '../types';
import { loadData, saveTemplate, savePackage } from '../utils/storage';
import { generateId } from '../utils/idGenerator';
import { findNewTasks, addNewTasksToPackage } from '../utils/packageUtils';
import PackageSelectionModal from '../components/PackageSelectionModal';
import LoadingBulldozer from '../components/LoadingBulldozer';

const CATEGORY_COLORS = [
  '#14532d', '#166534', '#15803d', '#16a34a', '#22c55e',
  '#4ade80', '#86efac', '#bbf7d0', '#052e16', '#14532d'
];

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  
  const [template, setTemplate] = useState<Template>({
    id: generateId(),
    name: '',
    description: '',
    categories: [],
    tasks: [],
    createdAt: new Date().toISOString(),
  });
  const [originalTemplate, setOriginalTemplate] = useState<Template | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<Template[]>([]);
  const [selectedTemplateToDuplicate, setSelectedTemplateToDuplicate] = useState<string>('');
  const [addingTaskToCategory, setAddingTaskToCategory] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState<string>('');
  const [newTaskDescription, setNewTaskDescription] = useState<string>('');
  const [newTaskLeadReviewTime, setNewTaskLeadReviewTime] = useState<string>('');
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [packagesUsingTemplate, setPackagesUsingTemplate] = useState<Package[]>([]);
  const [selectedPackageIds, setSelectedPackageIds] = useState<Set<string>>(new Set());
  const [newTasksToAdd, setNewTasksToAdd] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await loadData();

        if (isNew) {
          // Load available templates for duplication
          setAvailableTemplates(data.templates);
        } else if (id) {
          const found = data.templates.find(t => t.id === id);
          if (found) {
            // Store a deep copy of the original template for comparison
            setOriginalTemplate(JSON.parse(JSON.stringify(found)));
            setTemplate(found);

            // Find packages using this template
            const packages = data.packages.filter(p => p.templateId === id);
            setPackagesUsingTemplate(packages);
          } else {
            navigate('/templates');
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isNew, navigate]);

  const handleSave = async () => {
    if (!template.name.trim()) {
      alert('Please enter a template name');
      return;
    }

    // If this is an existing template (not new), check for new tasks
    if (!isNew && originalTemplate) {
      const newTasks = findNewTasks(originalTemplate, template);
      
      // If there are new tasks and packages using this template, show modal
      if (newTasks.length > 0 && packagesUsingTemplate.length > 0) {
        setNewTasksToAdd(newTasks);
        setSelectedPackageIds(new Set(packagesUsingTemplate.map(p => p.id)));
        setShowPackageModal(true);
        return;
      }
    }

    // Save template and navigate
    try {
      await saveTemplate(template);
      navigate('/templates');
    } catch (error) {
      alert('Error saving template: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleConfirmPackageSelection = async () => {
    if (selectedPackageIds.size === 0) {
      alert('Please select at least one package');
      return;
    }

    try {
      // Update selected packages with new tasks
      for (const pkg of packagesUsingTemplate) {
        if (selectedPackageIds.has(pkg.id)) {
          const updatedPackage = addNewTasksToPackage(pkg, newTasksToAdd, template);
          await savePackage(updatedPackage);
        }
      }

      // Save template
      await saveTemplate(template);
      
      // Show success message
      const packageCount = selectedPackageIds.size;
      const taskCount = newTasksToAdd.length;
      alert(
        `Template saved successfully!\n\n` +
        `${taskCount} new task${taskCount !== 1 ? 's' : ''} ${taskCount !== 1 ? 'have' : 'has'} been added to ${packageCount} package${packageCount !== 1 ? 's' : ''}.`
      );

      // Close modal and navigate
      setShowPackageModal(false);
      navigate('/templates');
    } catch (error) {
      alert('Error saving: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleCancelPackageSelection = async () => {
    try {
      // Just save the template without updating packages
      await saveTemplate(template);
      setShowPackageModal(false);
      navigate('/templates');
    } catch (error) {
      alert('Error saving template: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleTogglePackage = (packageId: string) => {
    const newSelected = new Set(selectedPackageIds);
    if (newSelected.has(packageId)) {
      newSelected.delete(packageId);
    } else {
      newSelected.add(packageId);
    }
    setSelectedPackageIds(newSelected);
  };

  const handleSelectAllPackages = () => {
    setSelectedPackageIds(new Set(packagesUsingTemplate.map(p => p.id)));
  };

  const handleDeselectAllPackages = () => {
    setSelectedPackageIds(new Set());
  };

  const handleAddCategory = () => {
    const name = prompt('Enter category name:');
    if (name && name.trim()) {
      const newCategory: Category = {
        id: generateId(),
        name: name.trim(),
        color: CATEGORY_COLORS[template.categories.length % CATEGORY_COLORS.length],
      };
      setTemplate({
        ...template,
        categories: [...template.categories, newCategory],
      });
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm('Delete this category? Tasks in this category will also be removed.')) {
      setTemplate({
        ...template,
        categories: template.categories.filter(c => c.id !== categoryId),
        tasks: template.tasks.filter(t => t.categoryId !== categoryId),
      });
    }
  };

  const handleAddTask = (categoryId: string) => {
    if (!newTaskName.trim()) {
      alert('Please enter a task name');
      return;
    }
    
    const leadReviewTime = newTaskLeadReviewTime ? parseInt(newTaskLeadReviewTime, 10) : undefined;
    
    const newTask: Task = {
      id: generateId(),
      name: newTaskName.trim(),
      description: newTaskDescription.trim() || undefined,
      categoryId,
      completed: false,
      leadReviewTime,
      status: DEFAULT_TASK_STATUS,
    };
    
    setTemplate({
      ...template,
      tasks: [...template.tasks, newTask],
    });
    
    // Reset form
    setNewTaskName('');
    setNewTaskDescription('');
    setNewTaskLeadReviewTime('');
    setAddingTaskToCategory(null);
  };

  const handleCancelAddTask = () => {
    setNewTaskName('');
    setNewTaskDescription('');
    setNewTaskLeadReviewTime('');
    setAddingTaskToCategory(null);
  };

  const handleStartEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setNewTaskName(task.name);
    setNewTaskDescription(task.description || '');
    setNewTaskLeadReviewTime(task.leadReviewTime?.toString() || '');
  };

  const handleSaveEditTask = () => {
    if (!editingTaskId || !newTaskName.trim()) {
      alert('Please enter a task name');
      return;
    }
    
    const leadReviewTime = newTaskLeadReviewTime ? parseInt(newTaskLeadReviewTime, 10) : undefined;
    
    handleUpdateTask(editingTaskId, {
      name: newTaskName.trim(),
      description: newTaskDescription.trim() || undefined,
      leadReviewTime,
    });
    
    // Reset form
    setNewTaskName('');
    setNewTaskDescription('');
    setNewTaskLeadReviewTime('');
    setEditingTaskId(null);
  };

  const handleCancelEditTask = () => {
    setNewTaskName('');
    setNewTaskDescription('');
    setNewTaskLeadReviewTime('');
    setEditingTaskId(null);
  };

  const handleDeleteTask = (taskId: string) => {
    setTemplate({
      ...template,
      tasks: template.tasks.filter(t => t.id !== taskId),
    });
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTemplate({
      ...template,
      tasks: template.tasks.map(t =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    });
  };

  const handleDuplicateTemplate = (templateId: string) => {
    const templateToDuplicate = availableTemplates.find(t => t.id === templateId);
    if (!templateToDuplicate) return;

    // Create a mapping of old category IDs to new category IDs
    const categoryIdMap = new Map<string, string>();
    const newCategories = templateToDuplicate.categories.map(category => {
      const newCategoryId = generateId();
      categoryIdMap.set(category.id, newCategoryId);
      return {
        ...category,
        id: newCategoryId,
      };
    });

    // Create new tasks with updated category IDs
    const newTasks = templateToDuplicate.tasks.map(task => ({
      ...task,
      id: generateId(),
      categoryId: categoryIdMap.get(task.categoryId) || task.categoryId,
      completed: false,
      completedDate: undefined,
      status: DEFAULT_TASK_STATUS,
    }));

    setTemplate({
      id: generateId(),
      name: `${templateToDuplicate.name} (Copy)`,
      description: templateToDuplicate.description,
      categories: newCategories,
      tasks: newTasks,
      createdAt: new Date().toISOString(),
    });
    setSelectedTemplateToDuplicate(''); // Reset selection
  };

  const tasksByCategory = template.categories.map(category => ({
    category,
    tasks: template.tasks.filter(t => t.categoryId === category.id),
  }));

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <Link to="/templates" style={{ color: '#166534', textDecoration: 'none', marginBottom: '0.5rem', display: 'block' }}>
            ← Back to Templates
          </Link>
        </div>
        <div className="page-loading">
          <LoadingBulldozer />
          <span className="page-loading-text">Loading template…</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PackageSelectionModal
        isOpen={showPackageModal}
        packages={packagesUsingTemplate}
        selectedPackageIds={selectedPackageIds}
        onTogglePackage={handleTogglePackage}
        onSelectAll={handleSelectAllPackages}
        onDeselectAll={handleDeselectAllPackages}
        onConfirm={handleConfirmPackageSelection}
        onCancel={handleCancelPackageSelection}
        newTasksCount={newTasksToAdd.length}
      />
      <div className="page-header">
        <div>
          <Link to="/templates" style={{ color: '#166534', textDecoration: 'none', marginBottom: '0.5rem', display: 'block' }}>
            ← Back to Templates
          </Link>
          <h1 className="page-title">{isNew ? 'Create Template' : 'Edit Template'}</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/templates" className="btn btn-secondary">
            Cancel
          </Link>
          <button onClick={handleSave} className="btn btn-primary">
            Save Template
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        {isNew && availableTemplates.length > 0 && (
          <div className="form-group" style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '2px solid #f3f4f6' }}>
            <label className="form-label">Duplicate from Existing Template (Optional)</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <select
                className="form-select"
                value={selectedTemplateToDuplicate}
                onChange={(e) => {
                  setSelectedTemplateToDuplicate(e.target.value);
                  if (e.target.value) {
                    handleDuplicateTemplate(e.target.value);
                  } else {
                    // Reset to blank template
                    setTemplate({
                      id: generateId(),
                      name: '',
                      description: '',
                      categories: [],
                      tasks: [],
                      createdAt: new Date().toISOString(),
                    });
                  }
                }}
                style={{ flex: 1 }}
              >
                <option value="">Start from scratch</option>
                {availableTemplates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.categories.length} categories, {t.tasks.length} tasks)
                  </option>
                ))}
              </select>
            </div>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
              Select a template to copy all its categories and tasks. You can modify them after duplicating.
            </p>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Template Name *</label>
          <input
            type="text"
            className="form-input"
            value={template.name}
            onChange={(e) => setTemplate({ ...template, name: e.target.value })}
            placeholder="e.g., Foundation Works"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            value={template.description}
            onChange={(e) => setTemplate({ ...template, description: e.target.value })}
            placeholder="Optional description for this template"
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Categories & Tasks</h2>
        <button onClick={handleAddCategory} className="btn btn-primary btn-sm">
          + Add Category
        </button>
      </div>

      {template.categories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <h2 className="empty-state-title">No Categories Yet</h2>
          <p className="empty-state-text">
            Add categories to organize your tasks (e.g., Permits, Materials, Site Preparation).
          </p>
          <button onClick={handleAddCategory} className="btn btn-primary">
            Add Your First Category
          </button>
        </div>
      ) : (
        <div>
          {tasksByCategory.map(({ category, tasks }) => (
            <div key={category.id} className="category-section">
              <div className="category-header">
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    backgroundColor: category.color,
                  }}
                />
                <h3 className="category-title">{category.name}</h3>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="btn btn-danger btn-sm"
                  style={{ marginLeft: 'auto' }}
                >
                  Delete Category
                </button>
                <button
                  onClick={() => {
                    setAddingTaskToCategory(category.id);
                    setEditingTaskId(null);
                  }}
                  className="btn btn-success btn-sm"
                >
                  + Add Task
                </button>
              </div>
              {tasks.length === 0 && !addingTaskToCategory ? (
                <p style={{ color: '#6b7280', fontStyle: 'italic', padding: '1rem' }}>
                  No tasks in this category yet. Click "Add Task" to get started.
                </p>
              ) : (
                <div className="task-list">
                  {tasks.map(task => {
                    const isEditing = editingTaskId === task.id;
                    return isEditing ? (
                      <div key={task.id} className="card" style={{ marginBottom: '0.75rem', padding: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label className="form-label">Task Name *</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Enter task name"
                            value={newTaskName}
                            onChange={(e) => setNewTaskName(e.target.value)}
                            autoFocus
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label className="form-label">Description</label>
                          <textarea
                            className="form-textarea"
                            placeholder="Optional task description"
                            value={newTaskDescription}
                            onChange={(e) => setNewTaskDescription(e.target.value)}
                            style={{ minHeight: '80px' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label className="form-label">Lead/Review Time (days)</label>
                          <input
                            type="number"
                            min="0"
                            className="form-input"
                            placeholder="0"
                            value={newTaskLeadReviewTime}
                            onChange={(e) => setNewTaskLeadReviewTime(e.target.value)}
                            style={{ width: '150px' }}
                          />
                          <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                            {newTaskLeadReviewTime && parseInt(newTaskLeadReviewTime, 10) > 0
                              ? `Due date will be ${newTaskLeadReviewTime} day${parseInt(newTaskLeadReviewTime, 10) !== 1 ? 's' : ''} before expected start date`
                              : 'Due date will match expected start date'}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={handleCancelEditTask} className="btn btn-secondary btn-sm">
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveEditTask}
                            className="btn btn-primary btn-sm"
                            disabled={!newTaskName.trim()}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div key={task.id} className="task-item">
                        <div className="task-content" style={{ flex: 1 }}>
                          <div className="task-name">{task.name}</div>
                          {task.description && (
                            <div className="task-description">{task.description}</div>
                          )}
                          {task.leadReviewTime && task.leadReviewTime > 0 && (
                            <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '0.25rem', fontWeight: 500 }}>
                              Lead/Review Time: {task.leadReviewTime} day{task.leadReviewTime !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleStartEditTask(task)}
                            className="btn btn-outline btn-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="btn btn-danger btn-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {addingTaskToCategory === category.id && (
                    <div className="card" style={{ marginTop: '0.75rem', padding: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-label">Task Name *</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter task name"
                          value={newTaskName}
                          onChange={(e) => setNewTaskName(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-textarea"
                          placeholder="Optional task description"
                          value={newTaskDescription}
                          onChange={(e) => setNewTaskDescription(e.target.value)}
                          style={{ minHeight: '80px' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-label">Lead/Review Time (days)</label>
                        <input
                          type="number"
                          min="0"
                          className="form-input"
                          placeholder="0"
                          value={newTaskLeadReviewTime}
                          onChange={(e) => setNewTaskLeadReviewTime(e.target.value)}
                          style={{ width: '150px' }}
                        />
                        <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                          {newTaskLeadReviewTime && parseInt(newTaskLeadReviewTime, 10) > 0
                            ? `Due date will be ${newTaskLeadReviewTime} day${parseInt(newTaskLeadReviewTime, 10) !== 1 ? 's' : ''} before expected start date`
                            : 'Due date will match expected start date'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={handleCancelAddTask} className="btn btn-secondary btn-sm">
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAddTask(category.id)}
                          className="btn btn-primary btn-sm"
                          disabled={!newTaskName.trim()}
                        >
                          Add Task
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

