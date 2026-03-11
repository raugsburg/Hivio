import { Routes, Route } from 'react-router-dom';
import RootLayout, { ProtectedRoute } from './layouts/RootLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfileSetup from './pages/ProfileSetup';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import AddApplication from './pages/AddApplication';
import ApplicationDetail from './pages/ApplicationDetail';
import Resumes from './pages/Resumes';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
        <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
        <Route path="applications/new" element={<ProtectedRoute><AddApplication /></ProtectedRoute>} />
        <Route path="applications/:id" element={<ProtectedRoute><ApplicationDetail /></ProtectedRoute>} />
        <Route path="resumes" element={<ProtectedRoute><Resumes /></ProtectedRoute>} />
        <Route path="analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
