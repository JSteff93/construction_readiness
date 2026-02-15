import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import TemplatesPage from './pages/TemplatesPage';
import PackagesPage from './pages/PackagesPage';
import TemplateDetailPage from './pages/TemplateDetailPage';
import PackageDetailPage from './pages/PackageDetailPage';
import TasksPage from './pages/TasksPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

function Navigation() {
  const location = useLocation();
  const { user, authRequired, signOut } = useAuth();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <h1 className="nav-title">🏗️ ReadiNext</h1>
        <div className="nav-links">
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
          {authRequired && user && (
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)' }}>
                {user.email || user.user_metadata?.email || 'Signed in'}
              </span>
              <button
                type="button"
                onClick={() => signOut()}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  border: '1px solid rgba(255,255,255,0.5)',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                Sign out
              </button>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;



