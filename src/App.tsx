import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import TemplatesPage from './pages/TemplatesPage';
import PackagesPage from './pages/PackagesPage';
import TemplateDetailPage from './pages/TemplateDetailPage';
import PackageDetailPage from './pages/PackageDetailPage';
import TasksPage from './pages/TasksPage';
import ProjectsPage from './pages/ProjectsPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import ProfileSetupRoute from './components/ProfileSetupRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProfileProvider, useProfile } from './contexts/ProfileContext';
import { ProjectProvider, useProject } from './contexts/ProjectContext';
import { DEFAULT_AVATAR_COLOR } from './utils/profileService';
import './App.css';

function getInitials(profile: { firstName: string; lastName: string } | null, email: string | undefined): string {
  if (profile?.firstName && profile?.lastName) {
    return (profile.firstName[0] + profile.lastName[0]).toUpperCase();
  }
  const raw = email || '';
  const local = raw.split('@')[0] || '';
  if (local.length >= 2) return local.slice(0, 2).toUpperCase();
  return local ? local[0].toUpperCase() : '?';
}

function Navigation() {
  const location = useLocation();
  const { user, authRequired } = useAuth();
  const { profile } = useProfile();
  const { currentProject } = useProject();
  const initials = getInitials(profile, user?.email || user?.user_metadata?.email);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <h1 className="nav-title">🏗️ ReadiNext</h1>
        <div className="nav-links">
          <Link 
            to="/projects" 
            className={location.pathname === '/projects' ? 'nav-link active' : 'nav-link'}
          >
            Projects
          </Link>
          {currentProject && (
            <>
              <Link 
                to="/" 
                className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
              >
                Packages
              </Link>
              <Link 
                to="/tasks" 
                className={location.pathname === '/tasks' ? 'nav-link active' : 'nav-link'}
              >
                Tasks
              </Link>
              <Link 
                to="/templates" 
                className={location.pathname === '/templates' ? 'nav-link active' : 'nav-link'}
              >
                Templates
              </Link>
            </>
          )}
          {authRequired && user && (
            <Link
              to="/profile"
              className="nav-avatar"
              title="View profile"
              aria-label="View profile"
              style={{
                marginLeft: 'auto',
                backgroundColor: profile?.avatarColor || DEFAULT_AVATAR_COLOR,
              }}
            >
              {initials}
            </Link>
          )}
          {currentProject && (
            <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', opacity: 0.9 }}>
              ({currentProject.name})
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  return (
    <div className="app">
      <Navigation />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile/create" element={<ProfileSetupRoute />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <PackagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <TasksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/templates"
            element={
              <ProtectedRoute>
                <TemplatesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/templates/:id"
            element={
              <ProtectedRoute>
                <TemplateDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/packages/:id"
            element={
              <ProtectedRoute>
                <PackageDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider>
          <ProjectProvider>
            <AppContent />
          </ProjectProvider>
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;



