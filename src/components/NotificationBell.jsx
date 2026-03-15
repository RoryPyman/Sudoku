import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate }       from 'react-router-dom';
import { useAuth }           from '../context/AuthContext.jsx';
import { notificationsApi }  from '../api/notifications.js';
import { challengesApi }     from '../api/challenges.js';
import { fmtTime }           from '../lib/formatTime.js';
import { cn }                from '../lib/cn.js';

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function daysUntil(dateStr) {
  if (!dateStr) return '';
  const diff = new Date(dateStr) - Date.now();
  if (diff <= 0) return 'expired';
  const days = Math.ceil(diff / 86400000);
  return `${days}d`;
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function NotifText({ notif, onAccept, onDecline }) {
  const { type, payload } = notif;
  const from = payload?.fromUsername ? `@${payload.fromUsername}` : 'Someone';
  const diff = payload?.difficulty ?? '';
  const cid  = payload?.challengeId;

  switch (type) {
    case 'score_share':
      return (
        <p className="text-[.82rem] text-text-primary leading-snug">
          <span className="font-medium">@{payload.fromUsername}</span>
          {' '}finished today's puzzle in{' '}
          <span className="font-mono text-accent">{fmtTime(payload.timeSeconds)}</span>
          {payload.hintsUsed > 0 && ' (with hints)'}
          {' '}— can you beat it?
        </p>
      );

    case 'challenge_received':
      return (
        <div>
          <p className="text-[.82rem] text-text-primary leading-snug mb-2">
            <span className="font-medium">{from}</span>{' '}
            challenged you to a <span className="capitalize font-medium">{diff}</span> puzzle
            {payload?.expiresAt && ` — ${daysUntil(payload.expiresAt)} left`}
          </p>
          {cid && (
            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
              <button
                className="ctrl-btn ctrl-btn-accent text-[.7rem] py-[3px] px-2"
                onClick={() => onAccept(cid)}
              >
                Accept
              </button>
              <button
                className="ctrl-btn text-[.7rem] py-[3px] px-2"
                onClick={() => onDecline(cid)}
              >
                Decline
              </button>
            </div>
          )}
        </div>
      );

    case 'challenge_accepted':
      return (
        <p className="text-[.82rem] text-text-primary leading-snug">
          <span className="font-medium">{from}</span>{' '}
          accepted your <span className="capitalize">{diff}</span> challenge!
        </p>
      );

    case 'challenge_declined':
      return (
        <p className="text-[.82rem] text-text-primary leading-snug">
          <span className="font-medium">{from}</span>{' '}
          declined your challenge
        </p>
      );

    case 'challenge_completed':
      return (
        <p className="text-[.82rem] text-text-primary leading-snug">
          Challenge vs <span className="font-medium">{from}</span> is complete — see the result
        </p>
      );

    case 'challenge_expired':
      return (
        <p className="text-[.82rem] text-text-primary leading-snug">
          Your <span className="capitalize">{diff}</span> challenge with{' '}
          <span className="font-medium">{from}</span> expired
        </p>
      );

    case 'challenge_nudge':
      return (
        <p className="text-[.82rem] text-text-primary leading-snug">
          <span className="font-medium">{from}</span>{' '}
          has finished their <span className="capitalize">{diff}</span> puzzle and is waiting for you — your turn!
        </p>
      );

    default:
      return (
        <p className="text-[.82rem] text-text-primary leading-snug">
          New notification
        </p>
      );
  }
}

function navDestination(notif) {
  const { type, payload } = notif;
  const cid = payload?.challengeId;

  switch (type) {
    case 'score_share':
      return payload?.date ? `/daily?date=${payload.date}` : null;
    case 'challenge_received':
    case 'challenge_accepted':
    case 'challenge_completed':
    case 'challenge_nudge':
      return cid ? `/challenges/${cid}` : null;
    default:
      return null;
  }
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

  const markSeen = useCallback(async (notif) => {
    if (!notif.seenAt) {
      try {
        await notificationsApi.markSeen(notif._id);
        setCount(c => Math.max(0, c - 1));
        setItems(prev => prev.map(n => n._id === notif._id ? { ...n, seenAt: new Date().toISOString() } : n));
      } catch { /* ignore */ }
    }
  }, []);

  const handleItemClick = useCallback(async (notif) => {
    await markSeen(notif);
    setOpen(false);
    const dest = navDestination(notif);
    if (dest) navigate(dest);
  }, [markSeen, navigate]);

  const handleAccept = useCallback(async (challengeId) => {
    try {
      await challengesApi.accept(challengeId);
      setOpen(false);
      navigate(`/challenges/${challengeId}`);
    } catch (err) {
      alert(err?.response?.data?.message ?? 'Failed to accept challenge');
    }
  }, [navigate]);

  const handleDismiss = useCallback(async (e, notif) => {
    e.stopPropagation();
    try {
      await notificationsApi.dismiss(notif._id);
      setItems(prev => prev.filter(n => n._id !== notif._id));
      if (!notif.seenAt) setCount(c => Math.max(0, c - 1));
    } catch { /* ignore */ }
  }, []);

  const handleDecline = useCallback(async (challengeId) => {
    try {
      await challengesApi.decline(challengeId);
      setItems(prev => prev.map(n =>
        n.payload?.challengeId?.toString() === challengeId.toString()
          ? { ...n, seenAt: n.seenAt ?? new Date().toISOString() }
          : n,
      ));
    } catch (err) {
      alert(err?.response?.data?.message ?? 'Failed to decline challenge');
    }
  }, []);

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
                    'relative px-4 py-3 cursor-pointer hover:bg-bg-hover transition-colors border-b border-border-cell last:border-0 group',
                    !notif.seenAt && 'bg-accent/[.04]',
                  )}
                  onClick={() => handleItemClick(notif)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && handleItemClick(notif)}
                >
                  <button
                    className="absolute top-2 right-2 text-text-dim hover:text-text-primary transition-colors opacity-0 group-hover:opacity-100 p-[2px]"
                    onClick={e => handleDismiss(e, notif)}
                    aria-label="Dismiss notification"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="1" y1="1" x2="9" y2="9" /><line x1="9" y1="1" x2="1" y2="9" />
                    </svg>
                  </button>
                  <NotifText
                    notif={notif}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                  />
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
