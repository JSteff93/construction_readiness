import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Task, TaskStatus, TASK_STATUSES, DEFAULT_TASK_STATUS } from '../types';
import { loadData, savePackage } from '../utils/storage';
import LoadingBulldozer from '../components/LoadingBulldozer';
import { formatDateShort } from '../utils/dateUtils';
import { fetchProfiles, listProfiles } from '../utils/profileService';
import type { Profile } from '../utils/profileService';
import TaskUserAvatarPicker from '../components/TaskUserAvatarPicker';
import { useProject } from '../contexts/ProjectContext';

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
type ViewMode = 'list' | 'board';

export default function TasksPage() {
  const { currentProjectId, setProjects } = useProject();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>([]);
  const [tasks, setTasks] = useState<TaskWithPackage[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortColumn, setSortColumn] = useState<SortColumn | null>('dueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterCompleted, setFilterCompleted] = useState<boolean>(true);
  const [filterPackages, setFilterPackages] = useState<Set<string>>(new Set());
  const [filterCategories, setFilterCategories] = useState<Set<string>>(new Set());
  const [filterStatuses, setFilterStatuses] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [openStatusKey, setOpenStatusKey] = useState<string | null>(null);
  const [draggedTaskKey, setDraggedTaskKey] = useState<string | null>(null);
  const [boardDrawerTask, setBoardDrawerTask] = useState<TaskWithPackage | null>(null);
  const [boardDrawerOpen, setBoardDrawerOpen] = useState(false);
  const [editingDueDateKey, setEditingDueDateKey] = useState<string | null>(null);
  const [openFilterColumn, setOpenFilterColumn] = useState<'package' | 'category' | 'status' | null>(null);
  const [profilesMap, setProfilesMap] = useState<Map<string, Profile>>(new Map());
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const boardJustDraggedRef = useRef(false);

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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBoardDrawerTask(null);
    };
    if (boardDrawerTask) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [boardDrawerTask]);

  useEffect(() => {
    if (boardDrawerTask) {
      setBoardDrawerOpen(false);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setBoardDrawerOpen(true));
      });
      return () => cancelAnimationFrame(id);
    } else {
      setBoardDrawerOpen(false);
    }
  }, [boardDrawerTask]);

  const loadTasks = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await loadData();
      setProjects(data.projects || []);
      const projectPackages = currentProjectId
        ? data.packages.filter((p: Package) => p.projectId === currentProjectId)
        : data.packages;
      setPackages(projectPackages);

      const allTasks: TaskWithPackage[] = [];
      projectPackages.forEach((pkg: Package) => {
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

      const userIds = new Set<string>();
      allTasks.forEach(t => {
        if (t.taskOwner) userIds.add(t.taskOwner);
        if (t.taskAssignee) userIds.add(t.taskAssignee);
      });
      const map = await fetchProfiles([...userIds]);
      setProfilesMap(map);
      const list = await listProfiles();
      setAllProfiles(list);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentProjectId) {
      navigate('/projects', { replace: true });
      return;
    }
    loadTasks();
  }, [currentProjectId, navigate]);

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

  const handleTaskOwnerAssigneeChange = async (
    task: TaskWithPackage,
    field: 'taskOwner' | 'taskAssignee',
    value: string
  ) => {
    const pkg = packages.find(p => p.id === task.packageId);
    if (!pkg) return;

    const updatedTasks = pkg.tasks.map(t =>
      t.id === task.id ? { ...t, [field]: value || undefined } : t
    );

    const updatedPackage = { ...pkg, tasks: updatedTasks };
    setPackages(prev => prev.map(p => (p.id === pkg.id ? updatedPackage : p)));
    setTasks(prev =>
      prev.map(t =>
        t.packageId === pkg.id && t.id === task.id ? { ...t, [field]: value || undefined } : t
      )
    );
    try {
      await savePackage(updatedPackage);
    } catch (error) {
      alert('Error updating task: ' + (error instanceof Error ? error.message : 'Unknown error'));
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

  const handleDragStart = (e: React.DragEvent, task: TaskWithPackage) => {
    boardJustDraggedRef.current = true;
    e.dataTransfer.setData('application/json', JSON.stringify({ packageId: task.packageId, taskId: task.id }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskKey(`${task.packageId}-${task.id}`);
  };

  const handleDragEnd = () => {
    setDraggedTaskKey(null);
    setTimeout(() => {
      boardJustDraggedRef.current = false;
    }, 300);
  };

  const handleColumnDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleColumnDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    boardJustDraggedRef.current = false;
    setDraggedTaskKey(null); // Reset so card doesn't stay dimmed if dragend doesn't fire
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    const { packageId, taskId } = JSON.parse(raw);
    const task = tasks.find(t => t.packageId === packageId && t.id === taskId);
    if (task && getTaskStatus(task) !== targetStatus) {
      handleTaskStatusChange(task, targetStatus);
    }
  };

  const tasksByStatus = TASK_STATUSES.reduce<Record<TaskStatus, TaskWithPackage[]>>(
    (acc, status) => {
      acc[status] = sortedTasks
        .filter(t => getTaskStatus(t) === status)
        .sort((a, b) => {
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : new Date(a.packageExpectedStartDate).getTime();
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : new Date(b.packageExpectedStartDate).getTime();
          return dateA - dateB;
        });
      return acc;
    },
    { Pending: [], 'In Progress': [], Waiting: [], Complete: [], Delegated: [] }
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="page-title">All Tasks</h1>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              backgroundColor: viewMode === 'list' ? '#166534' : '#f0fdf4',
              color: viewMode === 'list' ? 'white' : '#14532d',
              cursor: 'pointer',
            }}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setViewMode('board')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              backgroundColor: viewMode === 'board' ? '#166534' : '#f0fdf4',
              color: viewMode === 'board' ? 'white' : '#14532d',
              cursor: 'pointer',
            }}
          >
            Board
          </button>
        </div>
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

      {viewMode === 'board' ? (
        <>
          {boardDrawerTask && (() => {
            const task = tasks.find(t => t.packageId === boardDrawerTask.packageId && t.id === boardDrawerTask.id) ?? boardDrawerTask;
            return (
            <>
              <div
                role="button"
                tabIndex={0}
                aria-label="Close drawer"
                style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.35)',
                  zIndex: 40,
                  transition: 'opacity 0.2s ease-out',
                }}
                onClick={() => setBoardDrawerTask(null)}
              />
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: 'min(380px, 90vw)',
                  backgroundColor: 'white',
                  boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
                  zIndex: 41,
                  overflowY: 'auto',
                  padding: '1.25rem',
                  transform: boardDrawerOpen ? 'translateX(0)' : 'translateX(-100%)',
                  transition: 'transform 0.25s ease-out',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#14532d', margin: 0 }}>
                    Task details
                  </h2>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setBoardDrawerTask(null)}
                    style={{
                      padding: '0.35rem',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '1.25rem',
                      lineHeight: 1,
                      color: '#6b7280',
                    }}
                  >
                    ×
                  </button>
                </div>
                <Link
                  to={`/packages/${task.packageId}`}
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    color: '#166534',
                    fontWeight: 500,
                    marginBottom: '0.75rem',
                    textDecoration: 'none',
                  }}
                >
                  ← {task.packageName}
                </Link>
                <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem', color: '#14532d' }}>
                  {task.name}
                </div>
                {task.description && (
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem', lineHeight: 1.4 }}>
                    {task.description}
                  </p>
                )}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    backgroundColor: task.categoryColor + '20',
                    color: task.categoryColor,
                    marginBottom: '1rem',
                  }}
                >
                  {task.categoryName}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#14532d', marginBottom: '0.35rem' }}>
                    Due date
                  </label>
                  <input
                    type="date"
                    value={getTaskDueDate(task)}
                    onChange={(e) => handleTaskDueDateChange(task, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.875rem',
                      border: '2px solid #bbf7d0',
                      borderRadius: '6px',
                    }}
                  />
                  {(isTaskOverdue(task) || isTaskDueAfterStart(task)) && !task.completed && (
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 500, display: 'block', marginTop: '0.25rem' }}>
                      {isTaskOverdue(task) ? 'Overdue' : 'After start date'}
                    </span>
                  )}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#14532d', marginBottom: '0.35rem' }}>
                    Status
                  </label>
                  <div
                    ref={openStatusKey === `drawer-${task.packageId}-${task.id}` ? statusDropdownRef : undefined}
                    style={{ position: 'relative', display: 'inline-block', width: '100%' }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenStatusKey(openStatusKey === `drawer-${task.packageId}-${task.id}` ? null : `drawer-${task.packageId}-${task.id}`)}
                      style={{
                        width: '100%',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        border: `2px solid ${STATUS_COLORS[getTaskStatus(task)].border}`,
                        backgroundColor: STATUS_COLORS[getTaskStatus(task)].bg,
                        color: STATUS_COLORS[getTaskStatus(task)].text,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {getTaskStatus(task)} {openStatusKey === `drawer-${task.packageId}-${task.id}` ? '▲' : '▼'}
                    </button>
                    {openStatusKey === `drawer-${task.packageId}-${task.id}` && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '4px',
                          zIndex: 10,
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
                            onClick={() => {
                              handleTaskStatusChange(task, s);
                              setOpenStatusKey(null);
                            }}
                            style={{
                              display: 'block',
                              width: '100%',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              padding: '0.5rem 0.75rem',
                              border: 'none',
                              borderBottom: s !== TASK_STATUSES[TASK_STATUSES.length - 1] ? '1px solid #e5e7eb' : undefined,
                              backgroundColor: s === getTaskStatus(task) ? STATUS_COLORS[s].bg : 'white',
                              color: STATUS_COLORS[s].text,
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#14532d', marginBottom: '0.35rem' }}>
                    Task Owner
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TaskUserAvatarPicker
                      userId={task.taskOwner}
                      profile={task.taskOwner ? profilesMap.get(task.taskOwner) : undefined}
                      allProfiles={allProfiles}
                      onChange={(id) => handleTaskOwnerAssigneeChange(task, 'taskOwner', id)}
                      fieldLabel="Owner"
                      size={28}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#14532d', marginBottom: '0.35rem' }}>
                    Task Assignee
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TaskUserAvatarPicker
                      userId={task.taskAssignee}
                      profile={task.taskAssignee ? profilesMap.get(task.taskAssignee) : undefined}
                      allProfiles={allProfiles}
                      onChange={(id) => handleTaskOwnerAssigneeChange(task, 'taskAssignee', id)}
                      fieldLabel="Assignee"
                      size={28}
                    />
                  </div>
                </div>
                {task.leadReviewTime != null && task.leadReviewTime > 0 && (
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                    Lead/Review time: {task.leadReviewTime} day{task.leadReviewTime !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </>
            );
          })()}
        <div style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', paddingBottom: '0.4rem' }}>
          {TASK_STATUSES.map(status => (
            <div
              key={status}
              style={{
                flex: '0 0 224px',
                minWidth: 224,
                backgroundColor: '#f0fdf4',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 'calc(100vh - 224px)',
              }}
            >
              <div
                style={{
                  padding: '0.6rem 0.8rem',
                  borderBottom: `2px solid ${STATUS_COLORS[status].border}`,
                  backgroundColor: STATUS_COLORS[status].bg,
                  borderRadius: '6px 6px 0 0',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  color: STATUS_COLORS[status].text,
                }}
              >
                {status} ({tasksByStatus[status].length})
              </div>
              <div
                style={{ flex: 1, overflowY: 'auto', padding: '0.4rem', minHeight: 64 }}
                onDragOver={handleColumnDragOver}
                onDrop={(e) => handleColumnDrop(e, status)}
              >
                {tasksByStatus[status].map(task => {
                  const dueDate = getTaskDueDate(task);
                  const statusKey = `${task.packageId}-${task.id}`;
                  return (
                    <div
                      key={statusKey}
                      role="button"
                      tabIndex={0}
                      className="card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      onClick={() => {
                        if (!boardJustDraggedRef.current) setBoardDrawerTask(task);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (!boardJustDraggedRef.current) setBoardDrawerTask(task);
                        }
                      }}
                      style={{
                        marginBottom: '0.4rem',
                        padding: '0.6rem',
                        backgroundColor: task.completed ? '#dcfce7' : 'white',
                        opacity: draggedTaskKey === statusKey ? 0.5 : (task.completed ? 0.7 : 1),
                        border: '1px solid #e5e7eb',
                        cursor: 'grab',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.56rem',
                          color: '#166534',
                          fontWeight: 500,
                          display: 'block',
                          marginBottom: '0.2rem',
                        }}
                      >
                        {task.packageName}
                      </span>
                      <div style={{ fontWeight: 600, fontSize: '0.72rem', marginBottom: '0.28rem' }}>
                        {task.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            padding: '0.12rem 0.4rem',
                            borderRadius: '6px',
                            fontSize: '0.56rem',
                            fontWeight: 500,
                            backgroundColor: task.categoryColor + '20',
                            color: task.categoryColor,
                          }}
                        >
                          {task.categoryName}
                        </span>
                        <span style={{ fontSize: '0.6rem', color: '#6b7280' }}>
                          {formatDateShort(dueDate)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        </>
      ) : (
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
                <tr style={{ backgroundColor: '#dcfce7', borderBottom: '2px solid #166534' }}>
                  <th
                    style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: '#14532d',
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
                          backgroundColor: filterPackages.size > 0 ? '#dcfce7' : '#f0fdf4',
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
                                backgroundColor: filterPackages.has(pkg.id) ? '#dcfce7' : 'transparent',
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
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: '#14532d' }}>
                    Task Name
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: '#14532d', width: '13%' }}>
                    Task Description
                  </th>
                  <th
                    style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: '#14532d',
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
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: '#14532d' }}>
                    Lead Time
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: '#14532d' }}>
                    Task Owner
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: '#14532d' }}>
                    Task Assignee
                  </th>
                  <th
                    style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: '#14532d',
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
                          backgroundColor: filterCategories.size > 0 ? '#dcfce7' : '#f0fdf4',
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
                                backgroundColor: filterCategories.has(cat) ? '#dcfce7' : 'transparent',
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
                      color: '#14532d',
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
                          backgroundColor: filterStatuses.size > 0 ? '#dcfce7' : '#f0fdf4',
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
                                backgroundColor: filterStatuses.has(s) ? '#dcfce7' : 'transparent',
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
                    colSpan={9}
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
                  const status = getTaskStatus(task);
                  const statusKey = `${task.packageId}-${task.id}`;

                  return (
                    <tr
                      key={statusKey}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: task.completed ? '#dcfce7' : 'white',
                        opacity: task.completed ? 0.7 : 1,
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <Link
                          to={`/packages/${task.packageId}`}
                          style={{
                            color: '#166534',
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
                                border: '1px solid #166534',
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
                      <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        <TaskUserAvatarPicker
                          userId={task.taskOwner}
                          profile={task.taskOwner ? profilesMap.get(task.taskOwner) : undefined}
                          allProfiles={allProfiles}
                          onChange={(id) => handleTaskOwnerAssigneeChange(task, 'taskOwner', id)}
                          fieldLabel="Owner"
                          size={28}
                        />
                      </td>
                      <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        <TaskUserAvatarPicker
                          userId={task.taskAssignee}
                          profile={task.taskAssignee ? profilesMap.get(task.taskAssignee) : undefined}
                          allProfiles={allProfiles}
                          onChange={(id) => handleTaskOwnerAssigneeChange(task, 'taskAssignee', id)}
                          fieldLabel="Assignee"
                          size={28}
                        />
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
      )}
    </div>
  );
}

