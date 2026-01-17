import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Guests from './pages/Guests';
import Broadcasts from './pages/Broadcasts';
import Activity from './pages/Activity';
import Events from './pages/Events';
import Venues from './pages/Venues';
import FAQs from './pages/FAQs';
import Contacts from './pages/Contacts';
import DressCode from './pages/DressCode';
import './App.css';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/dress-code" element={<DressCode />} />
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="activity" element={<Activity />} />
        <Route path="guests" element={<Guests />} />
        <Route path="broadcasts" element={<Broadcasts />} />
        <Route path="events" element={<Events />} />
        <Route path="venues" element={<Venues />} />
        <Route path="faqs" element={<FAQs />} />
        <Route path="contacts" element={<Contacts />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
