import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Package, Template, Task } from '../types';
import { loadData, savePackage } from '../utils/storage';
import { getCountdownText, getCountdownColor, formatDate } from '../utils/dateUtils';
import { generateId } from '../utils/idGenerator';

export default function PackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  
  const [pkg, setPackage] = useState<Package | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [addingTaskToCategory, setAddingTaskToCategory] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState<string>('');
  const [newTaskDescription, setNewTaskDescription] = useState<string>('');
  const [newTaskLeadReviewTime, setNewTaskLeadReviewTime] = useState<string>('');
  const [previousExpectedStartDate, setPreviousExpectedStartDate] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      const data = await loadData();
      setTemplates(data.templates);
      
      if (isNew) {
        // Initialize new package
        const initialDate = new Date().toISOString().split('T')[0];
        setPackage({
          id: `pkg-${Date.now()}`,
          name: '',
          description: '',
          templateId: '',
          expectedStartDate: initialDate,
          tasks: [],
          categories: [],
          createdAt: new Date().toISOString(),
        });
        setPreviousExpectedStartDate(initialDate);
      } else if (id) {
        const found = data.packages.find(p => p.id === id);
        if (found) {
          // Ensure all tasks have dueDate set
          const tasksWithDueDate = found.tasks.map(t => ({
            ...t,
            dueDate: t.dueDate || calculateDueDate(found.expectedStartDate, t.leadReviewTime),
          }));
          setPackage({ ...found, tasks: tasksWithDueDate });
          setSelectedTemplateId(found.templateId);
          setPreviousExpectedStartDate(found.expectedStartDate);
        } else {
          navigate('/');
        }
      }
    };
    fetchData();
  }, [id, isNew, navigate]);

  const calculateDueDate = (expectedStartDate: string, leadReviewTime?: number): string => {
    if (leadReviewTime !== undefined && leadReviewTime > 0) {
      const startDate = new Date(expectedStartDate);
      startDate.setDate(startDate.getDate() - leadReviewTime);
      return startDate.toISOString().split('T')[0];
    }
    return expectedStartDate;
  };

  const handleExpectedStartDateChange = (newDate: string) => {
    if (!pkg) return;
    
    // During new package creation, never show confirmation dialog
    if (isNew) {
      setPackage({ ...pkg, expectedStartDate: newDate });
      setPreviousExpectedStartDate(newDate);
      return;
    }
    
    // If no previous date set or date hasn't changed, just update
    if (!previousExpectedStartDate || previousExpectedStartDate === newDate) {
      setPackage({ ...pkg, expectedStartDate: newDate });
      setPreviousExpectedStartDate(newDate);
      return;
    }
    
    // If there are no tasks, no need to ask
    if (pkg.tasks.length === 0) {
      setPackage({ ...pkg, expectedStartDate: newDate });
      setPreviousExpectedStartDate(newDate);
      return;
    }
    
    // For existing packages with tasks, ask if due dates should be updated
    const shouldUpdateDueDates = window.confirm(
      'Would you like to update all task due dates based on the new expected start date?\n\n' +
      'Tasks with Lead/Review Time will be calculated as: Expected Start Date - Lead/Review Time\n' +
      'Tasks without Lead/Review Time will be set to the Expected Start Date.'
    );
    
    if (shouldUpdateDueDates) {
      const tasksWithUpdatedDueDates = pkg.tasks.map(t => ({
        ...t,
        dueDate: calculateDueDate(newDate, t.leadReviewTime),
      }));
      setPackage({ ...pkg, expectedStartDate: newDate, tasks: tasksWithUpdatedDueDates });
    } else {
      setPackage({ ...pkg, expectedStartDate: newDate });
    }
    
    setPreviousExpectedStartDate(newDate);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const expectedStartDate = pkg?.expectedStartDate || new Date().toISOString().split('T')[0];

      // Give package categories new ids so they don't conflict with template category rows in the DB
      const templateCategoryIdToNewId: Record<string, string> = {};
      const newCategories = template.categories.map(cat => {
        const newId = generateId();
        templateCategoryIdToNewId[cat.id] = newId;
        return { ...cat, id: newId };
      });

      // Give package tasks new ids and map categoryId to the new package category ids
      const newTasks = template.tasks.map(t => {
        const newCategoryId = templateCategoryIdToNewId[t.categoryId] ?? t.categoryId;
        return {
          id: generateId(),
          name: t.name,
          description: t.description,
          categoryId: newCategoryId,
          completed: false,
          dueDate: calculateDueDate(expectedStartDate, t.leadReviewTime),
          leadReviewTime: t.leadReviewTime,
        };
      });

      setPackage({
        id: pkg?.id || `pkg-${Date.now()}`,
        name: pkg?.name || '',
        description: pkg?.description || '',
        templateId,
        expectedStartDate,
        tasks: newTasks,
        categories: newCategories,
        createdAt: pkg?.createdAt || new Date().toISOString(),
      });
      setSelectedTemplateId(templateId);
      setPreviousExpectedStartDate(expectedStartDate);
    }
  };

  const handleSave = async () => {
    if (!pkg) return;
    if (!pkg.name.trim()) {
      alert('Please enter a package name');
      return;
    }
    if (!pkg.templateId) {
      alert('Please select a template');
      return;
    }
    if (!pkg.expectedStartDate) {
      alert('Please select an expected start date');
      return;
    }
    try {
      await savePackage(pkg);
      navigate('/');
    } catch (error) {
      alert('Error saving package: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleTaskToggle = (taskId: string) => {
    if (!pkg) return;
    setPackage({
      ...pkg,
      tasks: pkg.tasks.map(t =>
        t.id === taskId
          ? {
              ...t,
              completed: !t.completed,
              completedDate: !t.completed ? new Date().toISOString() : undefined,
            }
          : t
      ),
    });
  };

  const handleAddTask = (categoryId: string) => {
    if (!pkg) return;
    if (!newTaskName.trim()) {
      alert('Please enter a task name');
      return;
    }
    
    const leadReviewTime = newTaskLeadReviewTime ? parseInt(newTaskLeadReviewTime, 10) : undefined;
    const dueDate = calculateDueDate(pkg.expectedStartDate, leadReviewTime);
    
    const newTask: Task = {
      id: generateId(),
      name: newTaskName.trim(),
      description: newTaskDescription.trim() || undefined,
      categoryId,
      completed: false,
      dueDate,
      leadReviewTime,
    };
    
    setPackage({
      ...pkg,
      tasks: [...pkg.tasks, newTask],
    });
    
    // Reset form
    setNewTaskName('');
    setNewTaskDescription('');
    setNewTaskLeadReviewTime('');
    setAddingTaskToCategory(null);
  };

  const handleUpdateTaskDueDate = (taskId: string, dueDate: string) => {
    if (!pkg) return;
    setPackage({
      ...pkg,
      tasks: pkg.tasks.map(t => {
        if (t.id === taskId) {
          // Clear leadReviewTime when due date is manually changed
          // to avoid confusion between calculated and manual dates
          return { ...t, dueDate, leadReviewTime: undefined };
        }
        return t;
      }),
    });
  };

  const handleUpdateTaskLeadReviewTime = (taskId: string, leadReviewTime: number | undefined) => {
    if (!pkg) return;
    setPackage({
      ...pkg,
      tasks: pkg.tasks.map(t => {
        if (t.id === taskId) {
          const newDueDate = leadReviewTime !== undefined && leadReviewTime > 0
            ? calculateDueDate(pkg.expectedStartDate, leadReviewTime)
            : pkg.expectedStartDate;
          return { ...t, leadReviewTime, dueDate: newDueDate };
        }
        return t;
      }),
    });
  };

  const isTaskDueDateAfterStartDate = (task: Task): boolean => {
    if (!task.dueDate || !pkg) return false;
    return new Date(task.dueDate) > new Date(pkg.expectedStartDate);
  };

  const handleCancelAddTask = () => {
    setNewTaskName('');
    setNewTaskDescription('');
    setNewTaskLeadReviewTime('');
    setAddingTaskToCategory(null);
  };

  const getCompletionPercentage = () => {
    if (!pkg || pkg.tasks.length === 0) return 0;
    const completed = pkg.tasks.filter(t => t.completed).length;
    return Math.round((completed / pkg.tasks.length) * 100);
  };

  if (isNew) {
    if (!pkg) return <div>Loading...</div>;
    
    return (
      <div>
        <div className="page-header">
          <div>
            <Link to="/" style={{ color: '#667eea', textDecoration: 'none', marginBottom: '0.5rem', display: 'block' }}>
              ← Back to Packages
            </Link>
            <h1 className="page-title">Create Package</h1>
          </div>
        </div>

        <div className="card">
          <div className="form-group">
            <label className="form-label">Package Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Building A - Foundation"
              value={pkg.name}
              onChange={(e) => setPackage({ ...pkg, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Template *</label>
            <select
              className="form-select"
              value={selectedTemplateId}
              onChange={(e) => handleTemplateSelect(e.target.value)}
            >
              <option value="">Select a template...</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {templates.length === 0 && (
              <p style={{ marginTop: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                No templates available. <Link to="/templates/new">Create one first</Link>.
              </p>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Expected Start Date *</label>
            <input
              type="date"
              className="form-input"
              value={pkg.expectedStartDate}
              onChange={(e) => handleExpectedStartDateChange(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              placeholder="Optional description for this package"
              value={pkg.description || ''}
              onChange={(e) => setPackage({ ...pkg, description: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Link to="/" className="btn btn-secondary">
              Cancel
            </Link>
            <button onClick={handleSave} className="btn btn-primary" disabled={!pkg.name.trim() || !selectedTemplateId}>
              Create Package
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!pkg) return null;

  const countdownColor = getCountdownColor(pkg.expectedStartDate);
  const completion = getCompletionPercentage();
  const tasksByCategory = pkg.categories.map(category => ({
    category,
    tasks: pkg.tasks.filter(t => t.categoryId === category.id),
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/" style={{ color: '#667eea', textDecoration: 'none', marginBottom: '0.5rem', display: 'block' }}>
            ← Back to Packages
          </Link>
          <h1 className="page-title">{pkg.name}</h1>
        </div>
        <button onClick={handleSave} className="btn btn-primary">
          Save Changes
        </button>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <div
              className="countdown"
              style={{
                backgroundColor: countdownColor + '20',
                color: countdownColor,
                marginBottom: '0.5rem',
              }}
            >
              {getCountdownText(pkg.expectedStartDate)}
            </div>
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                Expected Start Date
              </label>
              <input
                type="date"
                className="form-input"
                value={pkg.expectedStartDate}
                onChange={(e) => handleExpectedStartDateChange(e.target.value)}
                style={{ fontSize: '0.875rem', padding: '0.5rem' }}
              />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#667eea', marginBottom: '0.5rem' }}>
              {completion}%
            </div>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {pkg.tasks.filter(t => t.completed).length} of {pkg.tasks.length} tasks completed
            </p>
            <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
              <div className="progress-fill" style={{ width: `${completion}%` }} />
            </div>
          </div>
        </div>
        {pkg.description && (
          <p style={{ color: '#6b7280', paddingTop: '1rem', borderTop: '2px solid #f3f4f6' }}>
            {pkg.description}
          </p>
        )}
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Tasks</h2>

      {tasksByCategory.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <h2 className="empty-state-title">No Tasks Yet</h2>
          <p className="empty-state-text">
            This package doesn't have any tasks. Make sure you selected a template with tasks.
          </p>
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
                <span style={{ marginLeft: 'auto', fontSize: '0.875rem', color: '#6b7280' }}>
                  {tasks.filter(t => t.completed).length} / {tasks.length} completed
                </span>
              </div>
              <div className="task-list">
                {tasks.map(task => {
                  const isOverdue = isTaskDueDateAfterStartDate(task);
                  return (
                    <div
                      key={task.id}
                      className={`task-item ${task.completed ? 'completed' : ''}`}
                      style={{
                        borderLeft: isOverdue ? '4px solid #ef4444' : undefined,
                        backgroundColor: isOverdue ? '#fee2e220' : undefined,
                      }}
                    >
                      <input
                        type="checkbox"
                        className="task-checkbox"
                        checked={task.completed}
                        onChange={() => handleTaskToggle(task.id)}
                      />
                      <div className="task-content" style={{ flex: 1 }}>
                        <div className="task-name">{task.name}</div>
                        {task.description && (
                          <div className="task-description">{task.description}</div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>
                                Due Date
                              </label>
                              <input
                                type="date"
                                value={task.dueDate || pkg.expectedStartDate}
                                onChange={(e) => handleUpdateTaskDueDate(task.id, e.target.value)}
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '0.25rem 0.5rem',
                                  border: isOverdue ? '1px solid #ef4444' : '1px solid #e5e7eb',
                                  borderRadius: '4px',
                                  backgroundColor: isOverdue ? '#fee2e2' : 'white',
                                }}
                              />
                              {isOverdue && (
                                <span style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.125rem' }}>
                                  After expected start date
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>
                                Lead/Review Time (days)
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={task.leadReviewTime || ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                                  handleUpdateTaskLeadReviewTime(task.id, value);
                                }}
                                placeholder="0"
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '0.25rem 0.5rem',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '4px',
                                  width: '100px',
                                }}
                              />
                              {task.leadReviewTime && task.leadReviewTime > 0 && (
                                <span style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.125rem' }}>
                                  Due {task.leadReviewTime} day{task.leadReviewTime !== 1 ? 's' : ''} before start
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {task.completed && task.completedDate && (
                          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
                            Completed: {formatDate(task.completedDate)}
                          </div>
                        )}
                      </div>
                      <div
                        className="task-category"
                        style={{
                          backgroundColor: category.color + '20',
                          color: category.color,
                        }}
                      >
                        {category.name}
                      </div>
                    </div>
                  );
                })}
                {addingTaskToCategory === category.id ? (
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
                ) : (
                  <button
                    onClick={() => setAddingTaskToCategory(category.id)}
                    className="btn btn-outline btn-sm"
                    style={{ marginTop: '0.75rem', alignSelf: 'flex-start' }}
                  >
                    + Add Task to {category.name}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

