import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import TemplatesPage from './pages/TemplatesPage';
import PackagesPage from './pages/PackagesPage';
import TemplateDetailPage from './pages/TemplateDetailPage';
import PackageDetailPage from './pages/PackageDetailPage';
import TasksPage from './pages/TasksPage';
import './App.css';

function Navigation() {
  const location = useLocation();
  
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
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<PackagesPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/templates/:id" element={<TemplateDetailPage />} />
            <Route path="/packages/:id" element={<PackageDetailPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;



