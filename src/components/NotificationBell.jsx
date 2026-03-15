import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate }       from 'react-router-dom';
import { useAuth }           from '../context/AuthContext.jsx';
import { notificationsApi }  from '../api/notifications.js';
import { cn }                from '../lib/cn.js';

function fmtTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen]   = useState(false);
  const [items, setItems] = useState([]);
  const { user }          = useAuth();
  const navigate          = useNavigate();
  const wrapperRef        = useRef(null);

  // Poll unseen count every 30s
  useEffect(() => {
    if (!user) { setCount(0); return; }
    const poll = () => notificationsApi.getUnseenCount().then(d => setCount(d.count ?? 0)).catch(() => {});
    poll();
    const id = setInterval(poll, 30000);
    return () => clearInterval(id);
  }, [user]);

  // Load items when dropdown opens
  useEffect(() => {
    if (!open) return;
    notificationsApi.getAll().then(d => setItems(d.notifications ?? [])).catch(() => {});
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleItemClick = useCallback(async (notif) => {
    if (!notif.seenAt) {
      try {
        await notificationsApi.markSeen(notif._id);
        setCount(c => Math.max(0, c - 1));
        setItems(prev => prev.map(n => n._id === notif._id ? { ...n, seenAt: new Date().toISOString() } : n));
      } catch { /* ignore */ }
    }
    setOpen(false);
    navigate(`/daily?date=${notif.payload.date}`);
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        className="relative p-1 text-text-muted hover:text-text-primary transition-colors"
        onClick={() => setOpen(o => !o)}
        aria-label={`Notifications${count > 0 ? ` (${count} unseen)` : ''}`}
      >
        <BellIcon />
        {count > 0 && (
          <span className="absolute -top-[2px] -right-[2px] bg-accent text-bg text-[.55rem] font-bold rounded-full w-[14px] h-[14px] flex items-center justify-center leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-[320px] bg-bg-surface border border-border-cell rounded-xl shadow-[0_8px_32px_rgba(0,0,0,.5)] z-50 animate-fade-in overflow-hidden">
          <div className="px-4 py-2 border-b border-border-cell">
            <span className="text-[.72rem] text-text-muted uppercase tracking-wider">Notifications</span>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-text-muted text-[.82rem] text-center py-6">No notifications yet</p>
            ) : (
              items.map(notif => (
                <div
                  key={notif._id}
                  className={cn(
                    'px-4 py-3 cursor-pointer hover:bg-bg-hover transition-colors border-b border-border-cell last:border-0',
                    !notif.seenAt && 'bg-accent/[.04]',
                  )}
                  onClick={() => handleItemClick(notif)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && handleItemClick(notif)}
                >
                  <p className="text-[.82rem] text-text-primary leading-snug">
                    <span className="font-medium">@{notif.payload.fromUsername}</span>
                    {' '}finished today's puzzle in{' '}
                    <span className="font-mono text-accent">{fmtTime(notif.payload.timeSeconds)}</span>
                    {notif.payload.hintsUsed > 0 && ' (with hints)'}
                    {' '}— can you beat it?
                  </p>
                  <p className="text-[.68rem] text-text-muted mt-[3px]">{relativeTime(notif.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
