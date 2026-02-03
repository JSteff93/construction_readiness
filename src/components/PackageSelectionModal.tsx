import { Package } from '../types';

interface PackageSelectionModalProps {
  isOpen: boolean;
  packages: Package[];
  selectedPackageIds: Set<string>;
  onTogglePackage: (packageId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  newTasksCount: number;
}

export default function PackageSelectionModal({
  isOpen,
  packages,
  selectedPackageIds,
  onTogglePackage,
  onSelectAll,
  onDeselectAll,
  onConfirm,
  onCancel,
  newTasksCount,
}: PackageSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        className="card"
        style={{
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          margin: '1rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
          Add New Tasks to Packages
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          {newTasksCount} new task{newTasksCount !== 1 ? 's' : ''} {newTasksCount !== 1 ? 'have' : 'has'} been added to the template.
          Select which packages should receive these new tasks:
        </p>

        {packages.length === 0 ? (
          <p style={{ color: '#6b7280', fontStyle: 'italic', padding: '1rem', textAlign: 'center' }}>
            No packages are using this template.
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button onClick={onSelectAll} className="btn btn-outline btn-sm">
                Select All
              </button>
              <button onClick={onDeselectAll} className="btn btn-outline btn-sm">
                Deselect All
              </button>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem' }}>
              {packages.map(pkg => (
                <label
                  key={pkg.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    marginBottom: '0.5rem',
                    cursor: 'pointer',
                    backgroundColor: selectedPackageIds.has(pkg.id) ? '#f0f9ff' : 'white',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedPackageIds.has(pkg.id)) {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedPackageIds.has(pkg.id)) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedPackageIds.has(pkg.id)}
                    onChange={() => onTogglePackage(pkg.id)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {pkg.name}
                    </div>
                    {pkg.description && (
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        {pkg.description}
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      {pkg.tasks.length} task{pkg.tasks.length !== 1 ? 's' : ''} • Expected start: {new Date(pkg.expectedStartDate).toLocaleDateString()}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '2px solid #f3f4f6', paddingTop: '1rem' }}>
          <button onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-primary"
            disabled={selectedPackageIds.size === 0}
          >
            Add Tasks to {selectedPackageIds.size} Package{selectedPackageIds.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
