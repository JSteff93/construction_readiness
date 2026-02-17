import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import CreateProfilePage from '../pages/CreateProfilePage';

/** Route for /profile/create - only show when logged in and no profile. */
export default function ProfileSetupRoute() {
  const { user, loading, authRequired } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  if (!authRequired) {
    return <Navigate to="/" replace />;
  }

  if (loading || profileLoading) {
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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Already has profile → go to app
  if (profile) {
    return <Navigate to="/" replace />;
  }

  return <CreateProfilePage />;
}
