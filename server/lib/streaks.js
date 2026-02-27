/**
 * Given an ascending-sorted array of 'YYYY-MM-DD' strings,
 * return { current, best } consecutive-day streaks.
 */
export function calculateStreaks(sortedDays) {
  if (!sortedDays.length) return { current: 0, best: 0 };

  let best = 1;
  let run  = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const diff = Math.round(
      (new Date(sortedDays[i]) - new Date(sortedDays[i - 1])) / 86400000,
    );
    if (diff === 1) { run++; if (run > best) best = run; }
    else run = 1;
  }

  // Is the streak still active today or yesterday?
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const last      = sortedDays.at(-1);

  let current = 0;
  if (last === today || last === yesterday) {
    current = 1;
    for (let i = sortedDays.length - 2; i >= 0; i--) {
      const diff = Math.round(
        (new Date(sortedDays[i + 1]) - new Date(sortedDays[i])) / 86400000,
      );
      if (diff === 1) current++;
      else break;
    }
  }

  return { current, best };
}
