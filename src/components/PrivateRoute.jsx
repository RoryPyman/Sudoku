import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Wraps a protected route. Redirects to /login while preserving the
 * intended destination so the user lands there after signing in.
 */
export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // wait for silent refresh before deciding
  if (!user)   return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
