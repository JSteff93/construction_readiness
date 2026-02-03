import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Task } from '../types';
import { loadData, savePackage } from '../utils/storage';
import { formatDate, getCountdownColor } from '../utils/dateUtils';

interface TaskWithPackage extends Task {
  packageId: string;
  packageName: string;
  packageExpectedStartDate: string;
  categoryName: string;
  categoryColor: string;
}

type SortOption = 'package' | 'dueDate' | 'package-desc' | 'dueDate-desc';

export default function TasksPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [tasks, setTasks] = useState<TaskWithPackage[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');
  const [filterCompleted, setFilterCompleted] = useState<boolean>(true);
  const [filterPackage, setFilterPackage] = useState<string>('all');

  const loadTasks = async () => {
    const data = await loadData();
    setPackages(data.packages);
    
    // Extract all tasks with package information
    const allTasks: TaskWithPackage[] = [];
    data.packages.forEach(pkg => {
      pkg.tasks.forEach(task => {
        // Find category information
        const category = pkg.categories.find(c => c.id === task.categoryId);
        allTasks.push({
          ...task,
          packageId: pkg.id,
          packageName: pkg.name,
          packageExpectedStartDate: pkg.expectedStartDate,
          categoryName: category?.name || 'Uncategorized',
          categoryColor: category?.color || '#6b7280',
        });
      });
    });
    
    setTasks(allTasks);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleToggleTaskStatus = async (task: TaskWithPackage) => {
    const pkg = packages.find(p => p.id === task.packageId);
    if (!pkg) return;
    
    const updatedTasks = pkg.tasks.map(t =>
      t.id === task.id
        ? {
            ...t,
            completed: !t.completed,
            completedDate: !t.completed ? new Date().toISOString() : undefined,
          }
        : t
    );
    
    const updatedPackage = {
      ...pkg,
      tasks: updatedTasks,
    };
    
    try {
      await savePackage(updatedPackage);
      await loadTasks(); // Reload tasks to reflect changes
    } catch (error) {
      alert('Error updating task: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const getSortedTasks = () => {
    let sorted = [...tasks];
    
    // Filter by package if selected
    if (filterPackage !== 'all') {
      sorted = sorted.filter(t => t.packageId === filterPackage);
    }
    
    // Filter completed tasks if needed
    if (!filterCompleted) {
      sorted = sorted.filter(t => !t.completed);
    }
    
    // Sort based on selected option
    switch (sortBy) {
      case 'package':
        sorted.sort((a, b) => a.packageName.localeCompare(b.packageName));
        break;
      case 'package-desc':
        sorted.sort((a, b) => b.packageName.localeCompare(a.packageName));
        break;
      case 'dueDate':
        sorted.sort((a, b) => {
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : new Date(a.packageExpectedStartDate).getTime();
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : new Date(b.packageExpectedStartDate).getTime();
          return dateA - dateB;
        });
        break;
      case 'dueDate-desc':
        sorted.sort((a, b) => {
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : new Date(a.packageExpectedStartDate).getTime();
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : new Date(b.packageExpectedStartDate).getTime();
          return dateB - dateA;
        });
        break;
    }
    
    return sorted;
  };

  const getTaskDueDate = (task: TaskWithPackage): string => {
    return task.dueDate || task.packageExpectedStartDate;
  };

  const isTaskOverdue = (task: TaskWithPackage): boolean => {
    if (task.completed) return false;
    const dueDate = getTaskDueDate(task);
    return new Date(dueDate) < new Date();
  };

  const isTaskDueAfterStart = (task: TaskWithPackage): boolean => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) > new Date(task.packageExpectedStartDate);
  };

  const sortedTasks = getSortedTasks();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">All Tasks</h1>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label className="form-label" style={{ fontSize: '0.875rem', marginBottom: 0 }}>
              Filter by Package
            </label>
            <select
              className="form-select"
              value={filterPackage}
              onChange={(e) => setFilterPackage(e.target.value)}
              style={{ width: '200px' }}
            >
              <option value="all">All Packages</option>
              {packages.map(pkg => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label className="form-label" style={{ fontSize: '0.875rem', marginBottom: 0 }}>
              Sort By
            </label>
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              style={{ width: '200px' }}
            >
              <option value="dueDate">Due Date (Ascending)</option>
              <option value="dueDate-desc">Due Date (Descending)</option>
              <option value="package">Package (A-Z)</option>
              <option value="package-desc">Package (Z-A)</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <input
              type="checkbox"
              id="filterCompleted"
              checked={filterCompleted}
              onChange={(e) => setFilterCompleted(e.target.checked)}
            />
            <label htmlFor="filterCompleted" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
              Show completed tasks
            </label>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: '#6b7280', marginTop: '1.5rem' }}>
            {sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''} total
          </div>
        </div>
      </div>

      {sortedTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h2 className="empty-state-title">No Tasks Found</h2>
          <p className="empty-state-text">
            {filterCompleted 
              ? 'No tasks match your current filters.'
              : 'All tasks are completed or no tasks exist yet.'}
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>
                    Package
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>
                    Task Name
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>
                    Category
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>
                    Description
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>
                    Due Date
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTasks.map((task) => {
                  const dueDate = getTaskDueDate(task);
                  const isOverdue = isTaskOverdue(task);
                  const isAfterStart = isTaskDueAfterStart(task);
                  const countdownColor = getCountdownColor(dueDate);
                  
                  return (
                    <tr
                      key={`${task.packageId}-${task.id}`}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: task.completed ? '#f9fafb' : 'white',
                        opacity: task.completed ? 0.7 : 1,
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <Link
                          to={`/packages/${task.packageId}`}
                          style={{
                            color: '#667eea',
                            textDecoration: 'none',
                            fontWeight: 500,
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
                          {task.packageName}
                        </Link>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 500 }}>
                        {task.name}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            backgroundColor: task.categoryColor + '20',
                            color: task.categoryColor,
                          }}
                        >
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: task.categoryColor,
                            }}
                          />
                          {task.categoryName}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        {task.description || '-'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.875rem' }}>
                            {formatDate(dueDate)}
                          </span>
                          {isOverdue && !task.completed && (
                            <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>
                              Overdue
                            </span>
                          )}
                          {isAfterStart && !task.completed && (
                            <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>
                              After start date
                            </span>
                          )}
                          {task.leadReviewTime && task.leadReviewTime > 0 && (
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              {task.leadReviewTime} day{task.leadReviewTime !== 1 ? 's' : ''} lead time
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleToggleTaskStatus(task)}
                            style={{
                              width: '20px',
                              height: '20px',
                              cursor: 'pointer',
                            }}
                          />
                          {task.completed ? (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                backgroundColor: '#d1fae5',
                                color: '#065f46',
                              }}
                            >
                              ✓ Completed
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                backgroundColor: countdownColor + '20',
                                color: countdownColor,
                              }}
                            >
                              Pending
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

