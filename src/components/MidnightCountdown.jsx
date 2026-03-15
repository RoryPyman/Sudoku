import { useState, useEffect } from 'react';

export default function MidnightCountdown() {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    function calc() {
      const now = new Date();
      const midnight = new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1,
      ));
      const diff = Math.max(0, midnight - now);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);

  return <span className="font-mono text-[.78rem] text-text-muted">Next in {remaining}</span>;
}
