/**
 * Format seconds as mm:ss. Returns '--:--' for falsy values (except 0).
 */
export function fmtTime(seconds) {
  if (!seconds && seconds !== 0) return '--:--';
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
