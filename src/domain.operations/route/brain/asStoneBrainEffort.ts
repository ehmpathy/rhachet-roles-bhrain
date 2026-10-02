import type { StoneBrainOutcome } from './setStoneBrain';

/**
 * .what = the `/effort` level that prices this stone, or null where none does
 * .why = the peer of `asStoneBrainSlug`, for the same reason it exists: the drive's
 *        `where do we go?` bucket needs ONE string per row, never an outcome union, so
 *        the narrow is stated once here rather than re-switched at every surface
 *
 * .note = `inherited` yields its level as it yields its slug: the live session carries
 *         both forward, so the drive names both (`F30`, ruled parity)
 * .note = `undispatched` yields its level for the same reason it yields its slug: the
 *         fact a reader needs is what the guard ASKED for, so they can fix the guard.
 *         the halt beside it already says the switch did not land
 */
export const asStoneBrainEffort = (input: {
  outcome: StoneBrainOutcome;
}): string | null =>
  input.outcome.outcome === 'none' ? null : input.outcome.effort;
