import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../types';
import { loadData, saveProject, deleteProject } from '../utils/storage';
import { useProject } from '../contexts/ProjectContext';
import LoadingBulldozer from '../components/LoadingBulldozer';
import { generateId } from '../utils/idGenerator';

export default function ProjectsPage() {
  const { projects, setProjects, currentProjectId, setCurrentProjectId } = useProject();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await loadData();
        setProjects(data.projects || []);
        if (!currentProjectId && data.projects?.length) {
          setCurrentProjectId(data.projects[0].id);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [setProjects, setCurrentProjectId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      setError('Project name is required');
      return;
    }
    setError('');
    const project: Project = {
      id: generateId(),
      name,
      description: newDescription.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    try {
      await saveProject(project);
      setProjects([...projects, project]);
      setCurrentProjectId(project.id);
      setNewName('');
      setNewDescription('');
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this project? Packages and templates in it will be unassigned or removed.')) return;
    try {
      await deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
      if (currentProjectId === id) {
        const rest = projects.filter(p => p.id !== id);
        setCurrentProjectId(rest[0]?.id ?? null);
      }
    } catch (err) {
      alert('Error deleting project: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <LoadingBulldozer />
        <span className="page-loading-text">Loading projects…</span>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="btn btn-primary"
        >
          + Create Project
        </button>
      </div>

      {creating && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#14532d' }}>New project</h2>
          <form onSubmit={handleCreate}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Name *</label>
              <input
                type="text"
                className="form-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. LGCFR"
                autoFocus
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Description (optional)</label>
              <input
                type="text"
                className="form-input"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>
            {error && (
              <div style={{ marginBottom: '1rem', color: '#dc2626', fontSize: '0.875rem' }}>{error}</div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">Create</button>
              <button type="button" onClick={() => { setCreating(false); setError(''); }} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {projects.length === 0 && !creating ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <h2 className="empty-state-title">No projects yet</h2>
          <p className="empty-state-text">Create a project to organize your packages, templates, and tasks.</p>
          <button onClick={() => setCreating(true)} className="btn btn-primary">
            Create your first project
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0fdf4', borderBottom: '2px solid #166534' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: '#14532d' }}>
                    Project
                  </th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: '#14532d' }}>
                    Description
                  </th>
                  <th style={{ padding: '0.75rem 1rem', width: '100px' }} />
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    style={{
                      borderBottom: '1px solid #e5e7eb',
                      backgroundColor: currentProjectId === project.id ? '#dcfce7' : 'white',
                    }}
                  >
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{project.name}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                      {project.description || '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setCurrentProjectId(project.id)}
                          className="btn btn-primary btn-sm"
                          style={{ opacity: currentProjectId === project.id ? 1 : 0.85 }}
                        >
                          {currentProjectId === project.id ? 'Current' : 'Switch to'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(project.id)}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
