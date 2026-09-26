/**
 * .what = folds a cloneAddr into a filesystem-safe session token for a per-session handle name
 * .why = a clone address (e.g. `@feat/auth`, `role/3`) carries `/`, `@`, `:` — chars that would
 *        spawn subdirs or break a flat filename. one place folds any address to a flat token so
 *        every per-session handle (the pid file, the daemon log) names the SAME session by the
 *        SAME token — they can never drift, because they share this one escape.
 *
 * .note = the fold is INJECTIVE — two distinct addresses can NEVER map to the same token. a naive
 *         `replace(/[^safe]+/g, '-')` is LOSSY: `@feat/auth` and `@feat-auth` both fold to
 *         `-feat-auth`, so two genuinely different sessions would share one handle — one session's
 *         register would return the other's daemon, and a deregister would kill the wrong session's
 *         daemon, a silent break of the per-session isolation the token exists to guarantee (vision
 *         Q10). instead each unsafe BYTE is escaped to `~XX` (hex). the safe set `[A-Za-z0-9._-]`
 *         passes through so the common case stays human-readable (`driver-1` → `driver-1`), and `~`
 *         is itself outside the safe set so a literal `~` escapes to `~7e` — the escape is
 *         therefore reversible, hence collision-free.
 */
export const asRouteReminderSessionToken = (input: {
  cloneAddr: string;
}): string =>
  Array.from(Buffer.from(input.cloneAddr, 'utf-8'))
    .map((byte) => {
      const char = String.fromCharCode(byte);
      return /[A-Za-z0-9._-]/.test(char)
        ? char
        : `~${byte.toString(16).padStart(2, '0')}`;
    })
    .join('');
