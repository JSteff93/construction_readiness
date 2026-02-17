import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Project } from '../types';

type ProjectContextValue = {
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
  currentProject: Project | null;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
};

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

const PROJECT_STORAGE_KEY = 'readinext-current-project-id';

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [currentProjectId, setCurrentProjectIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(PROJECT_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [projects, setProjects] = useState<Project[]>([]);

  const setCurrentProjectId = useCallback((id: string | null) => {
    setCurrentProjectIdState(id);
    try {
      if (id) localStorage.setItem(PROJECT_STORAGE_KEY, id);
      else localStorage.removeItem(PROJECT_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const currentProject = currentProjectId
    ? projects.find(p => p.id === currentProjectId) ?? null
    : null;

  return (
    <ProjectContext.Provider
      value={{
        currentProjectId,
        setCurrentProjectId,
        currentProject,
        projects,
        setProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (ctx === undefined) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
