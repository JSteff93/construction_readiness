import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, authRequired } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();

  if (loading || (authRequired && user && profileLoading)) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          color: '#6b7280',
        }}
      >
        Loading...
      </div>
    );
  }

  // When auth is not required (localStorage mode), allow access
  if (!authRequired) {
    return <>{children}</>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // First-time login: no profile yet → redirect to create profile
  if (!profile) {
    return <Navigate to="/profile/create" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
