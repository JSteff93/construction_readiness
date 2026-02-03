import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package } from '../types';
import { loadData, deletePackage } from '../utils/storage';
import { getCountdownText, getCountdownColor, formatDate } from '../utils/dateUtils';

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [expandedPackageId, setExpandedPackageId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await loadData();
      setPackages(data.packages);
    };
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      try {
        await deletePackage(id);
        setPackages(packages.filter(p => p.id !== id));
      } catch (error) {
        alert('Error deleting package: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  const getCompletionPercentage = (pkg: Package) => {
    if (pkg.tasks.length === 0) return 0;
    const completed = pkg.tasks.filter(t => t.completed).length;
    return Math.round((completed / pkg.tasks.length) * 100);
  };

  const handleRowClick = (pkgId: string) => {
    setExpandedPackageId(expandedPackageId === pkgId ? null : pkgId);
  };

  const getTasksByCategory = (pkg: Package) => {
    return pkg.categories.map(category => ({
      category,
      tasks: pkg.tasks.filter(t => t.categoryId === category.id),
    }));
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Construction Packages</h1>
        <Link to="/packages/new" className="btn btn-primary">
          + Create Package
        </Link>
      </div>

      {packages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h2 className="empty-state-title">No Packages Yet</h2>
          <p className="empty-state-text">
            Create your first package from a template to start tracking construction readiness.
          </p>
          <Link to="/packages/new" className="btn btn-primary">
            Create Your First Package
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: '#374151', width: '32px' }}>
                    {/* Expand icon column */}
                  </th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: '#374151' }}>
                    Package
                  </th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: '#374151' }}>
                    Progress
                  </th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: '#374151' }}>
                    Expected Start
                  </th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: '#374151' }}>
                    Days Remaining
                  </th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: '#374151', width: '120px' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {packages.map(pkg => {
                  const completion = getCompletionPercentage(pkg);
                  const countdownColor = getCountdownColor(pkg.expectedStartDate);
                  const isExpanded = expandedPackageId === pkg.id;
                  const tasksByCategory = getTasksByCategory(pkg);
                  
                  return (
                    <>
                      <tr
                        key={pkg.id}
                        onClick={() => handleRowClick(pkg.id)}
                        style={{
                          cursor: 'pointer',
                          borderBottom: '1px solid #e5e7eb',
                          backgroundColor: isExpanded ? '#f9fafb' : 'white',
                        }}
                        onMouseEnter={(e) => {
                          if (!isExpanded) e.currentTarget.style.backgroundColor = '#f3f4f6';
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpanded) e.currentTarget.style.backgroundColor = 'white';
                        }}
                      >
                        <td style={{ padding: '0.5rem 0.75rem', verticalAlign: 'middle' }}>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', verticalAlign: 'middle' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', lineHeight: '1.4' }}>
                              {pkg.name}
                            </div>
                            {pkg.description && (
                              <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.125rem', lineHeight: '1.3' }}>
                                {pkg.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#667eea', minWidth: '40px' }}>
                              {completion}%
                            </div>
                            <div className="progress-bar" style={{ width: '80px', height: '6px', flex: '0 0 auto' }}>
                              <div
                                className="progress-fill"
                                style={{ width: `${completion}%` }}
                              />
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                              {pkg.tasks.filter(t => t.completed).length}/{pkg.tasks.length}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', verticalAlign: 'middle' }}>
                          <div style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                            {formatDate(pkg.expectedStartDate)}
                          </div>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', verticalAlign: 'middle' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '10px',
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              backgroundColor: countdownColor + '20',
                              color: countdownColor,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {getCountdownText(pkg.expectedStartDate)}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', verticalAlign: 'middle' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '0.375rem' }}>
                            <Link
                              to={`/packages/${pkg.id}`}
                              className="btn btn-primary btn-sm"
                              style={{ flex: 1, padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                            >
                              View
                            </Link>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(pkg.id);
                              }}
                              className="btn btn-danger btn-sm"
                              style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${pkg.id}-expanded`}>
                          <td colSpan={6} style={{ padding: 0, backgroundColor: '#f9fafb' }}>
                            <div style={{ padding: '1rem' }}>
                              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                                Tasks ({pkg.tasks.length})
                              </h3>
                              {tasksByCategory.length === 0 ? (
                                <p style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '0.75rem' }}>
                                  No tasks in this package.
                                </p>
                              ) : (
                                <div>
                                  {tasksByCategory.map(({ category, tasks }) => (
                                    <div key={category.id} style={{ marginBottom: '1rem' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                                        <div
                                          style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '3px',
                                            backgroundColor: category.color,
                                          }}
                                        />
                                        <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>
                                          {category.name}
                                        </h4>
                                        <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                                          ({tasks.filter(t => t.completed).length}/{tasks.length})
                                        </span>
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        {tasks.map(task => {
                                          const taskDueDate = task.dueDate || pkg.expectedStartDate;
                                          return (
                                            <div
                                              key={task.id}
                                              style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.375rem 0.5rem',
                                                backgroundColor: task.completed ? '#f3f4f6' : 'white',
                                                borderRadius: '4px',
                                                border: '1px solid #e5e7eb',
                                                opacity: task.completed ? 0.7 : 1,
                                              }}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={task.completed}
                                                disabled
                                                style={{
                                                  width: '14px',
                                                  height: '14px',
                                                  cursor: 'default',
                                                  margin: 0,
                                                }}
                                              />
                                              <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 500, lineHeight: '1.3' }}>
                                                  {task.name}
                                                </div>
                                                {task.description && (
                                                  <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '0.125rem', lineHeight: '1.2' }}>
                                                    {task.description}
                                                  </div>
                                                )}
                                              </div>
                                              <div style={{ fontSize: '0.65rem', color: '#6b7280', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                                                Due: {formatDate(taskDueDate)}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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

