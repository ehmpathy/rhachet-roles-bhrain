/**
 * .what = the most a cached status line may age before a repaint recomputes it: 30s
 * .why = a backstop for a render input the fingerprint does not name — it bounds staleness,
 *        it is never the freshness path (the fingerprint is). 30s keeps a hit the norm at ~3
 *        repaints a second (≤ 1 recompute per ~90 repaints), and heals a missed input inside
 *        one glance-gap
 */
export const ROUTE_STATUS_LINE_CACHE_MAX_AGE_MS = 30_000;
