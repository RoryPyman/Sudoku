import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const PASSWORD_HINTS = [
  'At least 8 characters',
  'One uppercase letter',
  'One number',
  'One special character',
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [details,  setDetails]  = useState([]);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDetails([]);
    setLoading(true);
    try {
      await register(username, email, password);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      setError(data?.message || 'Registration failed');
      setDetails(data?.details || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-2.75rem)] flex items-center justify-center bg-bg px-4 py-8">
      <div className="w-full max-w-sm bg-bg-surface border border-border-cell rounded-xl p-8 shadow-[0_8px_32px_rgba(0,0,0,.5)]">
        <h2 className="font-title text-[1.8rem] font-bold text-accent mb-6 text-center">
          Create Account
        </h2>

        {error && (
          <div className="bg-cell-conflict-bg/20 border border-cell-conflict text-cell-conflict rounded-lg px-3 py-2 mb-4 text-sm">
            {error}
            {details.length > 0 && (
              <ul className="mt-1 list-disc list-inside space-y-[2px]">
                {details.map((d, i) => <li key={i}>{d.message}</li>)}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-[.75rem] text-text-muted">Username</span>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              autoComplete="username"
              className="bg-bg-surface2 border border-border-cell rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors duration-[120ms]"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[.75rem] text-text-muted">Email</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="bg-bg-surface2 border border-border-cell rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors duration-[120ms]"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[.75rem] text-text-muted">Password</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="bg-bg-surface2 border border-border-cell rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors duration-[120ms]"
            />
            <ul className="mt-1 space-y-[2px]">
              {PASSWORD_HINTS.map(h => (
                <li key={h} className="text-[.68rem] text-text-dim flex items-center gap-1">
                  <span className="text-text-dim">·</span> {h}
                </li>
              ))}
            </ul>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="ctrl-btn ctrl-btn-accent justify-center mt-1 py-2 text-[.85rem]"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-[.75rem] text-text-muted mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
