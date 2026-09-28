/**
 * .what = the one byte a bumpRouteReminderCrashBreaker append writes per crash-on-arrival.
 * .why = the crash-breaker count IS the byte length of its append-only marker file
 *        (getRouteReminderCrashBreaker reads it via stat.size), so the "one crash = one byte"
 *        invariant must hold in ONE place both the writer (bump) and the reader (get) trust. this
 *        MUST stay a single byte: if it ever grew to N bytes the reader would over-count each crash
 *        N-fold. the value itself is arbitrary (any single byte counts the same); 'x' is chosen only
 *        so a human who `cat`s the file sees a legible run of markers (xxxx = 4 crashes).
 */
export const CRASH_MARKER_BYTE = 'x';
