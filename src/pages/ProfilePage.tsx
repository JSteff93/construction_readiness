import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { updateProfile as updateProfileApi, DEFAULT_AVATAR_COLOR, AVATAR_COLOR_PRESETS } from '../utils/profileService';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { profile, loading, refetch } = useProfile();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [avatarColor, setAvatarColor] = useState(DEFAULT_AVATAR_COLOR);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setRole(profile.role);
      setCompany(profile.company ?? '');
      setAvatarColor(profile.avatarColor || DEFAULT_AVATAR_COLOR);
    }
  }, [profile]);

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
    setSuccess('');
    setSubmitting(true);

    try {
      await updateProfileApi(user.id, {
        firstName: f,
        lastName: l,
        role: r,
        company: company.trim() || undefined,
        avatarColor: avatarColor || DEFAULT_AVATAR_COLOR,
      });
      await refetch();
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          maxWidth: '420px',
          margin: '0 auto',
        }}
      >
        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
          You don&apos;t have a profile yet.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/profile/create" className="btn btn-primary">
            Create profile
          </Link>
          <button type="button" onClick={() => signOut()} className="btn btn-outline">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '560px',
        margin: '0 auto',
        padding: '2rem 0',
      }}
    >
      <h1
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: '#14532d',
          marginBottom: '0.5rem',
        }}
      >
        Your profile
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        View and update your profile information
      </p>

      <div
        className="card"
        style={{
          padding: '2rem',
          border: '1px solid #e5e7eb',
        }}
      >
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

          {user?.email && (
            <p
              style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                marginBottom: '1rem',
              }}
            >
              Signed in as <strong>{user.email}</strong>
            </p>
          )}

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

          {success && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                borderRadius: '6px',
                backgroundColor: '#dcfce7',
                color: '#166534',
                fontSize: '0.875rem',
              }}
            >
              {success}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save changes'}
          </button>

          <button
            type="button"
            onClick={() => signOut()}
            className="btn btn-outline"
            style={{ marginLeft: '1rem' }}
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
