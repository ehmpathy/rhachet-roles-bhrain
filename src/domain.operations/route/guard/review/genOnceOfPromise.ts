/**
 * .what = wraps an async read so it runs at most once per success, however many callers ask
 * .why = a guard pass shares one answer across lanes that pour concurrently — the
 *        `$targets` list costs a git read of the whole branch and is identical for
 *        every lane — so the first caller starts the read and each later caller
 *        awaits that same read, in flight or settled
 *
 * .note = LAZY: the read does not start until the first call, so a pass whose
 *         lanes never ask pays naught
 *
 * .note = the memo holds the PROMISE, never the value. a value memo would let two
 *         lanes that arrive before the first read settles each start their own
 *
 * .note = a REJECTED read is dropped from the memo once it settles, the same policy
 *         `genReviewBrainSupply` holds: callers already in flight share the rejection,
 *         and the next caller starts a fresh read. a transient fault is then retried,
 *         never cached for the rest of the pass
 *
 * .note = deliberate mutation: `memo.set` / `memo.delete` are the memoize cell. the
 *         map is born per call and never handed out
 */
export const genOnceOfPromise = <T>(input: {
  read: () => Promise<T>;
}): (() => Promise<T>) => {
  const memo = new Map<'value', Promise<T>>();
  return () => {
    const found = memo.get('value');
    if (found) return found;
    const started = input.read();
    memo.set('value', started);

    // forget a rejected read, so the next caller retries it
    started.catch(() => {
      if (memo.get('value') === started) memo.delete('value');
    });
    return started;
  };
};
