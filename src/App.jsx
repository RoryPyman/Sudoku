import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar      from './components/Navbar.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import GamePage     from './pages/GamePage.jsx';
import LoginPage    from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import HistoryPage  from './pages/HistoryPage.jsx';
import StatsPage    from './pages/StatsPage.jsx';
import FriendsPage  from './pages/FriendsPage.jsx';
import ProfilePage  from './pages/ProfilePage.jsx';

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <span className="text-text-muted text-sm">Loading…</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-bg">

      {/* Animated dot-grid background */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none animate-bg-drift bg-[image:linear-gradient(rgba(201,169,110,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(201,169,110,.03)_1px,transparent_1px)] bg-[size:40px_40px]"
        aria-hidden="true"
      />

      <Navbar />

      <Routes>
        <Route path="/"         element={<GamePage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/history"  element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
        <Route path="/stats"    element={<PrivateRoute><StatsPage /></PrivateRoute>} />
        <Route path="/friends"          element={<PrivateRoute><FriendsPage /></PrivateRoute>} />
        <Route path="/profile/:username" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="*"                 element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
