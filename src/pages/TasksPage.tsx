import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Package, Task, TaskStatus, TASK_STATUSES, DEFAULT_TASK_STATUS } from '../types';
import { loadData, savePackage } from '../utils/storage';
import LoadingBulldozer from '../components/LoadingBulldozer';
import { formatDateShort, getCountdownColor } from '../utils/dateUtils';

const STATUS_COLORS: Record<TaskStatus, { bg: string; border: string; text: string }> = {
  Pending: { bg: '#f1f5f9', border: '#94a3b8', text: '#475569' },
  'In Progress': { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8' },
  Waiting: { bg: '#fef3c7', border: '#f59e0b', text: '#b45309' },
  Complete: { bg: '#d1fae5', border: '#10b981', text: '#047857' },
  Delegated: { bg: '#ede9fe', border: '#8b5cf6', text: '#5b21b6' },
};

interface TaskWithPackage extends Task {
  packageId: string;
  packageName: string;
  packageExpectedStartDate: string;
  categoryName: string;
  categoryColor: string;
}

type SortColumn = 'package' | 'dueDate' | 'category' | 'status';
type SortDirection = 'asc' | 'desc';

export default function TasksPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [tasks, setTasks] = useState<TaskWithPackage[]>([]);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>('dueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterCompleted, setFilterCompleted] = useState<boolean>(true);
  const [filterPackages, setFilterPackages] = useState<Set<string>>(new Set());
  const [filterCategories, setFilterCategories] = useState<Set<string>>(new Set());
  const [filterStatuses, setFilterStatuses] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [openStatusKey, setOpenStatusKey] = useState<string | null>(null);
  const [editingDueDateKey, setEditingDueDateKey] = useState<string | null>(null);
  const [openFilterColumn, setOpenFilterColumn] = useState<'package' | 'category' | 'status' | null>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(target)) {
        setOpenStatusKey(null);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(target)) {
        setOpenFilterColumn(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleFocus = () => loadTasks(false);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadTasks = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await loadData();
      setPackages(data.packages);

      const allTasks: TaskWithPackage[] = [];
      data.packages.forEach(pkg => {
        pkg.tasks.forEach(task => {
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
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const getTaskStatus = (task: { status?: TaskStatus }) =>
    task.status && TASK_STATUSES.includes(task.status) ? task.status : DEFAULT_TASK_STATUS;

  const handleTaskStatusChange = async (task: TaskWithPackage, newStatus: TaskStatus) => {
    const pkg = packages.find(p => p.id === task.packageId);
    if (!pkg) return;

    const isComplete = newStatus === 'Complete';
    const updatedTasks = pkg.tasks.map(t =>
      t.id === task.id
        ? {
            ...t,
            status: newStatus,
            completed: isComplete,
            completedDate: isComplete ? new Date().toISOString() : undefined,
          }
        : t
    );

    const updatedPackage = { ...pkg, tasks: updatedTasks };
    setPackages(prev => prev.map(p => (p.id === pkg.id ? updatedPackage : p)));
    setTasks(prev =>
      prev.map(t =>
        t.packageId === pkg.id && t.id === task.id
          ? { ...t, status: newStatus, completed: isComplete, completedDate: isComplete ? new Date().toISOString() : undefined }
          : t
      )
    );
    setOpenStatusKey(null);
    try {
      await savePackage(updatedPackage);
    } catch (error) {
      alert('Error updating status: ' + (error instanceof Error ? error.message : 'Unknown error'));
      await loadTasks(false);
    }
  };

  const handleTaskDueDateChange = async (task: TaskWithPackage, newDueDate: string) => {
    const pkg = packages.find(p => p.id === task.packageId);
    if (!pkg) return;

    const updatedTasks = pkg.tasks.map(t =>
      t.id === task.id
        ? { ...t, dueDate: newDueDate, leadReviewTime: undefined }
        : t
    );

    const updatedPackage = { ...pkg, tasks: updatedTasks };
    setPackages(prev => prev.map(p => (p.id === pkg.id ? updatedPackage : p)));
    setTasks(prev =>
      prev.map(t =>
        t.packageId === pkg.id && t.id === task.id
          ? { ...t, dueDate: newDueDate, leadReviewTime: undefined }
          : t
      )
    );
    setEditingDueDateKey(null);
    try {
      await savePackage(updatedPackage);
    } catch (error) {
      alert('Error updating due date: ' + (error instanceof Error ? error.message : 'Unknown error'));
      await loadTasks(false);
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const uniqueCategories = [...new Set(tasks.map(t => t.categoryName))].sort();

  const toggleFilterPackage = (id: string) => {
    setFilterPackages(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleFilterCategory = (name: string) => {
    setFilterCategories(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };
  const toggleFilterStatus = (status: string) => {
    setFilterStatuses(prev => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const getSortedTasks = () => {
    let sorted = [...tasks];

    if (filterPackages.size > 0) {
      sorted = sorted.filter(t => filterPackages.has(t.packageId));
    }
    if (filterCategories.size > 0) {
      sorted = sorted.filter(t => filterCategories.has(t.categoryName));
    }
    if (filterStatuses.size > 0) {
      sorted = sorted.filter(t => filterStatuses.has(getTaskStatus(t)));
    }
    if (!filterCompleted) {
      sorted = sorted.filter(t => !t.completed);
    }

    // Sort based on column header
    if (sortColumn) {
      const mult = sortDirection === 'asc' ? 1 : -1;
      switch (sortColumn) {
        case 'package':
          sorted.sort((a, b) => mult * a.packageName.localeCompare(b.packageName));
          break;
        case 'dueDate':
          sorted.sort((a, b) => {
            const dateA = a.dueDate ? new Date(a.dueDate).getTime() : new Date(a.packageExpectedStartDate).getTime();
            const dateB = b.dueDate ? new Date(b.dueDate).getTime() : new Date(b.packageExpectedStartDate).getTime();
            return mult * (dateA - dateB);
          });
          break;
        case 'category':
          sorted.sort((a, b) => mult * a.categoryName.localeCompare(b.categoryName));
          break;
        case 'status':
          sorted.sort((a, b) => {
            const statusA = getTaskStatus(a);
            const statusB = getTaskStatus(b);
            return mult * statusA.localeCompare(statusB);
          });
          break;
      }
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

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">All Tasks</h1>
        </div>
        <div className="page-loading">
          <LoadingBulldozer />
          <span className="page-loading-text">Loading tasks…</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">All Tasks</h1>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th
                    style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: '#374151',
                      whiteSpace: 'nowrap',
                      verticalAlign: 'middle',
                    }}
                  >
                    <span
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('package')}
                      title="Click to sort by Package"
                    >
                      Package {sortColumn === 'package' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </span>
                    <span
                      ref={openFilterColumn === 'package' ? filterDropdownRef : undefined}
                      style={{ position: 'relative', display: 'inline-block', marginLeft: '0.35rem' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenFilterColumn(openFilterColumn === 'package' ? null : 'package');
                        }}
                        title="Filter by Package"
                        style={{
                          padding: '0.15rem 0.35rem',
                          fontSize: '0.7rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          backgroundColor: filterPackages.size > 0 ? '#e0e7ff' : '#f9fafb',
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        ⋮{filterPackages.size > 0 ? ` (${filterPackages.size})` : ''}
                      </button>
                      {openFilterColumn === 'package' && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: '2px',
                            zIndex: 20,
                            minWidth: '180px',
                            maxHeight: '280px',
                            overflowY: 'auto',
                            borderRadius: '6px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            padding: '0.25rem 0',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setFilterPackages(new Set())}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '0.35rem 0.75rem',
                              border: 'none',
                              background: filterPackages.size === 0 ? '#f3f4f6' : 'transparent',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              textAlign: 'left',
                              fontWeight: 500,
                            }}
                          >
                            All Packages
                          </button>
                          {packages.map(pkg => (
                            <label
                              key={pkg.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.35rem 0.75rem',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                backgroundColor: filterPackages.has(pkg.id) ? '#e0e7ff' : 'transparent',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={filterPackages.has(pkg.id)}
                                onChange={() => toggleFilterPackage(pkg.id)}
                                style={{ margin: 0, cursor: 'pointer' }}
                              />
                              {pkg.name}
                            </label>
                          ))}
                        </div>
                      )}
                    </span>
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>
                    Task Name
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: '#374151', width: '13%' }}>
                    Description
                  </th>
                  <th
                    style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: '#374151',
                      width: '11%',
                      cursor: 'pointer',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                    }}
                    onClick={() => handleSort('dueDate')}
                    title="Click to sort by Due Date"
                  >
                    Due Date {sortColumn === 'dueDate' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>
                    Lead time
                  </th>
                  <th
                    style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: '#374151',
                      whiteSpace: 'nowrap',
                      verticalAlign: 'middle',
                    }}
                  >
                    <span
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('category')}
                      title="Click to sort by Category"
                    >
                      Category {sortColumn === 'category' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </span>
                    <span
                      ref={openFilterColumn === 'category' ? filterDropdownRef : undefined}
                      style={{ position: 'relative', display: 'inline-block', marginLeft: '0.35rem' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenFilterColumn(openFilterColumn === 'category' ? null : 'category');
                        }}
                        title="Filter by Category"
                        style={{
                          padding: '0.15rem 0.35rem',
                          fontSize: '0.7rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          backgroundColor: filterCategories.size > 0 ? '#e0e7ff' : '#f9fafb',
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        ⋮{filterCategories.size > 0 ? ` (${filterCategories.size})` : ''}
                      </button>
                      {openFilterColumn === 'category' && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: '2px',
                            zIndex: 20,
                            minWidth: '180px',
                            maxHeight: '280px',
                            overflowY: 'auto',
                            borderRadius: '6px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            padding: '0.25rem 0',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setFilterCategories(new Set())}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '0.35rem 0.75rem',
                              border: 'none',
                              background: filterCategories.size === 0 ? '#f3f4f6' : 'transparent',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              textAlign: 'left',
                              fontWeight: 500,
                            }}
                          >
                            All Categories
                          </button>
                          {uniqueCategories.map(cat => (
                            <label
                              key={cat}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.35rem 0.75rem',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                backgroundColor: filterCategories.has(cat) ? '#e0e7ff' : 'transparent',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={filterCategories.has(cat)}
                                onChange={() => toggleFilterCategory(cat)}
                                style={{ margin: 0, cursor: 'pointer' }}
                              />
                              {cat}
                            </label>
                          ))}
                        </div>
                      )}
                    </span>
                  </th>
                  <th
                    style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: '#374151',
                      whiteSpace: 'nowrap',
                      verticalAlign: 'middle',
                    }}
                  >
                    <span
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('status')}
                      title="Click to sort by Status"
                    >
                      Status {sortColumn === 'status' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </span>
                    <span
                      ref={openFilterColumn === 'status' ? filterDropdownRef : undefined}
                      style={{ position: 'relative', display: 'inline-block', marginLeft: '0.35rem' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenFilterColumn(openFilterColumn === 'status' ? null : 'status');
                        }}
                        title="Filter by Status"
                        style={{
                          padding: '0.15rem 0.35rem',
                          fontSize: '0.7rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          backgroundColor: filterStatuses.size > 0 ? '#e0e7ff' : '#f9fafb',
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        ⋮{filterStatuses.size > 0 ? ` (${filterStatuses.size})` : ''}
                      </button>
                      {openFilterColumn === 'status' && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: '2px',
                            zIndex: 20,
                            minWidth: '180px',
                            borderRadius: '6px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            padding: '0.25rem 0',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setFilterStatuses(new Set())}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '0.35rem 0.75rem',
                              border: 'none',
                              background: filterStatuses.size === 0 ? '#f3f4f6' : 'transparent',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              textAlign: 'left',
                              fontWeight: 500,
                            }}
                          >
                            All Statuses
                          </button>
                          {TASK_STATUSES.map(s => (
                            <label
                              key={s}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.35rem 0.75rem',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                backgroundColor: filterStatuses.has(s) ? '#e0e7ff' : 'transparent',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={filterStatuses.has(s)}
                                onChange={() => toggleFilterStatus(s)}
                                style={{ margin: 0, cursor: 'pointer' }}
                              />
                              {s}
                            </label>
                          ))}
                        </div>
                      )}
                    </span>
                  </th>
                </tr>
            </thead>
            <tbody>
              {sortedTasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: '2rem',
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: '0.875rem',
                      borderBottom: '1px solid #e5e7eb',
                    }}
                  >
                    {filterCompleted
                      ? 'No tasks match your current filters.'
                      : 'All tasks are completed or no tasks exist yet.'}
                  </td>
                </tr>
              ) : (
                sortedTasks.map((task) => {
                  const dueDate = getTaskDueDate(task);
                  const isOverdue = isTaskOverdue(task);
                  const isAfterStart = isTaskDueAfterStart(task);
                  const countdownColor = getCountdownColor(dueDate);
                  const status = getTaskStatus(task);
                  const statusKey = `${task.packageId}-${task.id}`;

                  return (
                    <tr
                      key={statusKey}
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
                      <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem', width: '13%' }}>
                        {task.description || '-'}
                      </td>
                      <td style={{ padding: '1rem', width: '11%' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {editingDueDateKey === statusKey ? (
                            <input
                              type="date"
                              value={dueDate}
                              onChange={(e) => handleTaskDueDateChange(task, e.target.value)}
                              onBlur={(e) => {
                                const v = e.target.value;
                                if (v && v !== dueDate) handleTaskDueDateChange(task, v);
                                else setEditingDueDateKey(null);
                              }}
                              autoFocus
                              style={{
                                fontSize: '0.875rem',
                                padding: '0.25rem 0.5rem',
                                border: '1px solid #667eea',
                                borderRadius: '4px',
                                maxWidth: '140px',
                              }}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditingDueDateKey(statusKey)}
                              style={{
                                fontSize: '0.875rem',
                                padding: 0,
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                textAlign: 'left',
                                textDecoration: 'underline',
                                textDecorationStyle: 'dotted',
                                color: 'inherit',
                              }}
                              title="Click to change due date"
                            >
                              {formatDateShort(dueDate)}
                            </button>
                          )}
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
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        {task.leadReviewTime != null && task.leadReviewTime > 0
                          ? `${task.leadReviewTime} day${task.leadReviewTime !== 1 ? 's' : ''}`
                          : '-'}
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
                      <td style={{ padding: '1rem' }}>
                        <div
                          ref={openStatusKey === statusKey ? statusDropdownRef : undefined}
                          style={{ position: 'relative', display: 'inline-block' }}
                        >
                          <button
                            type="button"
                            onClick={() => setOpenStatusKey(openStatusKey === statusKey ? null : statusKey)}
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              border: `2px solid ${STATUS_COLORS[status].border}`,
                              backgroundColor: STATUS_COLORS[status].bg,
                              color: STATUS_COLORS[status].text,
                              cursor: 'pointer',
                              minWidth: '115px',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.35rem',
                            }}
                          >
                            {status}
                            <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>
                              {openStatusKey === statusKey ? '▲' : '▼'}
                            </span>
                          </button>
                          {openStatusKey === statusKey && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                marginTop: '2px',
                                zIndex: 10,
                                minWidth: '100%',
                                borderRadius: '6px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                overflow: 'hidden',
                              }}
                            >
                              {TASK_STATUSES.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => handleTaskStatusChange(task, s)}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    padding: '0.35rem 0.65rem',
                                    border: 'none',
                                    borderBottom: s !== TASK_STATUSES[TASK_STATUSES.length - 1] ? '1px solid #e5e7eb' : undefined,
                                    backgroundColor: s === status ? STATUS_COLORS[s].bg : 'white',
                                    color: STATUS_COLORS[s].text,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'background-color 0.15s',
                                  }}
                                  onMouseEnter={(e) => {
                                    if (s !== status) e.currentTarget.style.backgroundColor = STATUS_COLORS[s].bg + '80';
                                  }}
                                  onMouseLeave={(e) => {
                                    if (s !== status) e.currentTarget.style.backgroundColor = 'white';
                                  }}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

