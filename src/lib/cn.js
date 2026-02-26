/**
 * Tiny class-name helper — filters falsy values and joins with spaces.
 * Equivalent to the popular `clsx` package for our needs.
 *
 * @param {...(string|boolean|null|undefined)} classes
 * @returns {string}
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
