import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { useStore } from './store/useStore';

// Lazy-loaded pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TaskList = lazy(() => import('./pages/TaskList'));
const TaskForm = lazy(() => import('./pages/TaskForm'));
const TaskView = lazy(() => import('./pages/TaskView'));
const EmployeeList = lazy(() => import('./pages/EmployeeList'));
const EmployeeForm = lazy(() => import('./pages/EmployeeForm'));
const StatusChange = lazy(() => import('./pages/StatusChange'));
const Login = lazy(() => import('./pages/Login'));
const Masters = lazy(() => import('./pages/Masters'));
const TeamManagement = lazy(() => import('./pages/TeamManagement'));
const ProjectWaterfall = lazy(() => import('./pages/ProjectWaterfall'));
const Privileges = lazy(() => import('./pages/Privileges'));
const WorkflowTemplates = lazy(() => import('./pages/WorkflowTemplates'));
const ProjectsList = lazy(() => import('./pages/ProjectsList'));
const ProjectCreate = lazy(() => import('./pages/ProjectCreate'));
const ProjectTimelineDetails = lazy(() => import('./pages/ProjectTimelineDetails'));

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: 40, height: 40, border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}



function App() {
  const isDarkMode = useStore((state) => state.isDarkMode);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="tasks" element={<TaskList />} />
              <Route path="tasks/new" element={<TaskForm />} />
              <Route path="tasks/edit/:id" element={<TaskForm />} />
              <Route path="tasks/view/:id" element={<TaskView />} />
              <Route path="tasks/waterfall/:id" element={<ProjectWaterfall />} />
              <Route path="status-change" element={<StatusChange />} />
              <Route path="employees" element={<EmployeeList />} />
              <Route path="employees/new" element={<EmployeeForm />} />
              <Route path="employees/edit/:id" element={<EmployeeForm />} />
              <Route path="teams" element={<TeamManagement />} />
              <Route path="masters" element={<Masters />} />
              <Route path="privileges" element={<Privileges />} />
              <Route path="workflows" element={<WorkflowTemplates />} />
              <Route path="projects" element={<ProjectsList />} />
              <Route path="projects/new" element={<ProjectCreate />} />
              <Route path="projects/:id" element={<ProjectTimelineDetails />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
