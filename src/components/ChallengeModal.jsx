import { useState } from 'react';
import { challengesApi } from '../api/challenges.js';
import { cn } from '../lib/cn.js';

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const DIFF_LABELS  = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const DIFF_COLORS  = {
  easy:   'text-green-400 border-green-400/30',
  medium: 'text-yellow-400 border-yellow-400/30',
  hard:   'text-red-400 border-red-400/30',
};

export default function ChallengeModal({ toUser, onClose, onSent }) {
  const [difficulty, setDifficulty] = useState('medium');
  const [sending, setSending]       = useState(false);
  const [error, setError]           = useState(null);

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      await challengesApi.send(toUser.userId, difficulty);
      onSent?.(`@${toUser.username} has been challenged!`);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to send challenge');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[4px] animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Send challenge"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-surface border border-accent-dim rounded-xl px-7 py-6 max-w-[360px] w-[92%] shadow-[0_0_0_1px_rgba(201,169,110,.15),0_24px_60px_rgba(0,0,0,.6)] animate-scale-in">
        <h2 className="font-title text-[1.3rem] font-bold text-accent mb-1">Challenge</h2>
        <p className="text-text-muted text-[.83rem] mb-5">
          Send <span className="text-text-primary font-medium">{toUser.firstName}</span> a puzzle challenge?
        </p>

        <div className="flex gap-2 mb-5">
          {DIFFICULTIES.map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={cn(
                'flex-1 py-[.45rem] rounded-lg border text-[.78rem] font-medium transition-colors',
                difficulty === d
                  ? cn('bg-accent/10', DIFF_COLORS[d])
                  : 'text-text-muted border-border-cell hover:border-accent/30',
              )}
            >
              {DIFF_LABELS[d]}
            </button>
          ))}
        </div>

        {error && <p className="text-yellow-400/80 text-[.76rem] mb-3">{error}</p>}

        <div className="flex gap-2">
          <button className="ctrl-btn flex-1 justify-center" onClick={onClose}>Cancel</button>
          <button
            className="ctrl-btn ctrl-btn-accent flex-1 justify-center"
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? 'Sending…' : 'Send Challenge'}
          </button>
        </div>
      </div>
    </div>
  );
}
