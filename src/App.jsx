import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/TaskList';
import TaskForm from './pages/TaskForm';
import TaskView from './pages/TaskView';
import ReviewTask from './pages/ReviewTask';
import EmployeeList from './pages/EmployeeList';
import EmployeeForm from './pages/EmployeeForm';
import StatusChange from './pages/StatusChange';
import Login from './pages/Login';
import Masters from './pages/Masters';
import TeamManagement from './pages/TeamManagement';
import ProjectWaterfall from './pages/ProjectWaterfall';
import ProtectedRoute from './components/ProtectedRoute';

import { useStore } from './store/useStore';

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
            <Route path="tasks/review/:id" element={<ReviewTask />} />
            <Route path="tasks/waterfall/:id" element={<ProjectWaterfall />} />
            <Route path="status-change" element={<StatusChange />} />
            <Route path="employees" element={<EmployeeList />} />
            <Route path="employees/new" element={<EmployeeForm />} />
            <Route path="employees/edit/:id" element={<EmployeeForm />} />
            <Route path="teams" element={<TeamManagement />} />
            <Route path="masters" element={<Masters />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
