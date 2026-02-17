import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createProfile, DEFAULT_AVATAR_COLOR, AVATAR_COLOR_PRESETS } from '../utils/profileService';
import { useProfile } from '../contexts/ProfileContext';

export default function CreateProfilePage() {
  const { user } = useAuth();
  const { refetch } = useProfile();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [avatarColor, setAvatarColor] = useState(DEFAULT_AVATAR_COLOR);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const f = firstName.trim();
    const l = lastName.trim();
    const r = role.trim();

    if (!f) {
      setError('First name is required');
      return;
    }
    if (!l) {
      setError('Last name is required');
      return;
    }
    if (!r) {
      setError('Role is required');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await createProfile({
        userId: user.id,
        firstName: f,
        lastName: l,
        role: r,
        company: company.trim() || undefined,
        avatarColor: avatarColor || DEFAULT_AVATAR_COLOR,
      });
      await refetch();
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          maxWidth: '420px',
          width: '100%',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
        }}
      >
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#14532d', marginBottom: '0.5rem' }}>
          Create your profile
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Please complete your profile to continue
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">
              First name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">
              Last name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">
              Role <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Project Manager, Superintendent"
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Company (optional)</label>
            <input
              type="text"
              className="form-input"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Enter company name"
              disabled={submitting}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Profile circle color</label>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              Used in the top bar and on tasks you own or are assigned to
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {AVATAR_COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: c,
                    border: avatarColor === c ? '3px solid #14532d' : '2px solid #e5e7eb',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  title={c}
                />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="color"
                value={avatarColor}
                onChange={(e) => setAvatarColor(e.target.value)}
                disabled={submitting}
                style={{ width: 36, height: 36, padding: 2, cursor: 'pointer', borderRadius: 6 }}
              />
              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Custom</span>
            </div>
          </div>

          {error && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                borderRadius: '6px',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%' }}
          >
            {submitting ? 'Creating...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
