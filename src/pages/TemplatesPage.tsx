import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Template } from '../types';
import { loadData, deleteTemplate, saveTemplate } from '../utils/storage';
import LoadingBulldozer from '../components/LoadingBulldozer';
import { formatDate } from '../utils/dateUtils';
import { downloadTemplateAsExcel, downloadBlankTemplate, parseExcelToTemplate } from '../utils/excelUtils';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await loadData();
        setTemplates(data.templates);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this template? This will also delete all packages using this template.')) {
      try {
        await deleteTemplate(id);
        setTemplates(templates.filter(t => t.id !== id));
      } catch (error) {
        alert('Error deleting template: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  const handleDownloadTemplate = (template: Template) => {
    downloadTemplateAsExcel(template);
  };

  const handleDownloadBlank = () => {
    downloadBlankTemplate();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setIsUploading(true);
    try {
      const template = await parseExcelToTemplate(file);
      
      // Check if template name already exists
      const existingTemplate = templates.find(t => t.name === template.name);
      if (existingTemplate) {
        const useNewName = window.confirm(
          `A template named "${template.name}" already exists. Would you like to create it with a different name?`
        );
        if (useNewName) {
          const newName = prompt('Enter a new name for this template:', `${template.name} (Copy)`);
          if (newName && newName.trim()) {
            template.name = newName.trim();
          } else {
            setIsUploading(false);
            return;
          }
        } else {
          setIsUploading(false);
          return;
        }
      }

      await saveTemplate(template);
      setTemplates([...templates, template]);
      alert(`Template "${template.name}" imported successfully!`);
    } catch (error) {
      alert(`Error importing template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Templates</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleDownloadBlank}
            className="btn btn-secondary"
            title="Download a blank Excel template to fill out"
          >
            📥 Download Blank Template
          </button>
          <button
            onClick={handleUploadClick}
            className="btn btn-secondary"
            disabled={isUploading}
            title="Upload an Excel file to create a template"
          >
            {isUploading ? '⏳ Uploading...' : '📤 Upload Excel Template'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <Link to="/templates/new" className="btn btn-primary">
            + Create Template
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="page-loading">
          <LoadingBulldozer />
          <span className="page-loading-text">Loading templates…</span>
        </div>
      ) : templates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h2 className="empty-state-title">No Templates Yet</h2>
          <p className="empty-state-text">
            Create your first template to define tasks and categories for construction packages.
            You can also download a blank Excel template, fill it out, and upload it here.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleDownloadBlank}
              className="btn btn-secondary"
            >
              📥 Download Blank Excel Template
            </button>
            <button
              onClick={handleUploadClick}
              className="btn btn-secondary"
              disabled={isUploading}
            >
              {isUploading ? '⏳ Uploading...' : '📤 Upload Excel Template'}
            </button>
            <Link to="/templates/new" className="btn btn-primary">
              Create Template Manually
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-3">
          {templates.map(template => (
            <div key={template.id} className="card">
              <div className="card-header">
                <h3 className="card-title">{template.name}</h3>
              </div>
              {template.description && (
                <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                  {template.description}
                </p>
              )}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <span className="badge badge-info">
                    {template.categories.length} Categor{template.categories.length !== 1 ? 'ies' : 'y'}
                  </span>
                  <span className="badge badge-info">
                    {template.tasks.length} Task{template.tasks.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Created: {formatDate(template.createdAt)}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link
                    to={`/templates/${template.id}`}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                  >
                    View & Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="btn btn-danger btn-sm"
                  >
                    Delete
                  </button>
                </div>
                <button
                  onClick={() => handleDownloadTemplate(template)}
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%' }}
                  title="Download this template as an Excel file"
                >
                  📥 Download as Excel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}





