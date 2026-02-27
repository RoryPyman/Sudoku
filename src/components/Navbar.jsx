import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { friendsApi } from '../api/friends.js';
import { cn } from '../lib/cn.js';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    if (!user) { setRequestCount(0); return; }
    friendsApi.requests()
      .then(({ received }) => setRequestCount(received.length))
      .catch(() => {});
    const interval = setInterval(() => {
      friendsApi.requests()
        .then(({ received }) => setRequestCount(received.length))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const linkClass = ({ isActive }) => cn(
    'text-[.82rem] font-medium tracking-[.04em] transition-colors duration-[120ms]',
    isActive ? 'text-accent' : 'text-text-muted hover:text-text-primary',
  );

  return (
    <nav className="w-full border-b border-border-cell bg-bg-surface/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-[900px] mx-auto px-4 h-11 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link
          to="/"
          className="font-title text-[1.15rem] font-bold text-accent tracking-[.04em] hover:opacity-80 transition-opacity"
        >
          Sudoku
        </Link>

        {/* Nav links */}
        {user && (
          <div className="flex items-center gap-5">
            <NavLink to="/history" className={linkClass}>History</NavLink>
            <NavLink to="/stats"   className={linkClass}>Stats</NavLink>
            <NavLink to="/friends" className={(props) => cn(linkClass(props), 'relative')}>
              Friends
              {requestCount > 0 && (
                <span className="absolute -top-1 -right-3 bg-accent text-bg text-[.55rem] font-bold rounded-full w-[14px] h-[14px] flex items-center justify-center">
                  {requestCount}
                </span>
              )}
            </NavLink>
          </div>
        )}

        {/* Auth controls */}
        <div className="flex items-center gap-2 ml-auto">
          {user ? (
            <>
              <span className="text-[.78rem] text-text-muted hidden sm:block">
                {user.firstName}
              </span>
              <button
                className="ctrl-btn text-[.78rem] py-[.3rem] px-[.7rem]"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="ctrl-btn text-[.78rem] py-[.3rem] px-[.7rem]">Sign In</Link>
              <Link to="/register" className="ctrl-btn ctrl-btn-accent text-[.78rem] py-[.3rem] px-[.7rem]">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
