import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';

import { parseStoneGuard } from './parseStoneGuard';
import { asPeerReviewLevelBySlug } from './review/peer/asPeerReviewLevelBySlug';

/**
 * .what = the level each peer reviewer pours at, for ONE guard — or null where the
 *         guard is genuinely absent
 *
 * .why = 🔴 the route context owns the guard grammar, so the route context answers
 *        *"what level does this lane pour at?"*. before this, the review meter
 *        imported `parseStoneGuard` and read `parsed.reviews.peer[].level` itself —
 *        a reach across the boundary into another context's internal data model
 *        (rule.forbid.scope-leaks, rule.require.bounded-contexts).
 *
 *        ⇒ what crosses the boundary now is a DECISION — a `Map<slug, level>` —
 *        never a parse tree. the review meter can no longer be broken by a change
 *        to the guard's shape, and the level default lives only in the parser.
 *
 * .note = 🔴 `null` means the guard was NOT THERE, and no more than that. an
 *         EACCES, a stale handle, a malformed yaml, a duplicate slug — each is a
 *         DEFECT and each rethrows. the caller renders an absent level as
 *         `unknown`, so a swallowed read fault would arrive as a confident "this
 *         lane has no declared level" over a file nobody could read
 *         (rule.forbid.failhide).
 *
 *         a caller that joins many guards may isolate a malformed or barred one to
 *         its own runs, provided it NAMES the guard — `getAllReviewerLevels` does.
 *
 *         ⇒ the allowlist is `isErrorOfAbsence`, which is the one this repo shares
 *         — never a second copy of the codes, and never a bare `.catch(() => null)`,
 *         which is precisely what this operation was extracted to retire.
 *
 * .note = 🟡 the level is the guard's CURRENT config, never a record of the run. a
 *         run's log carries no level, so a lane promoted l1 → l3 re-files every past
 *         run under l3. a caller that joins this onto a log corpus renders a
 *         current-config annotation, and two reads either side of a guard edit can
 *         differ over identical logs
 */
export const getAllPeerLevelsFromGuard = async (input: {
  path: string;
}): Promise<Map<string, number> | null> => {
  const parsed = await parseStoneGuard({ path: input.path }).catch(
    (error: unknown) => {
      // the guard is not on disk — an archived route, a deleted stone, another
      // machine's tree. an ABSENCE, and the one benign case here
      if (isErrorOfAbsence({ error })) return null;
      throw error;
    },
  );
  if (parsed === null) return null;

  // keyed by the SANITIZED slug: the review meter looks a level up by the slug it
  // parsed off a log filename, and a config slug may hold a separator the filename
  // swapped out. the one transformer that owns that sanitize is reused, never re-derived
  return asPeerReviewLevelBySlug({ peerReviews: parsed.reviews.peer ?? [] });
};
