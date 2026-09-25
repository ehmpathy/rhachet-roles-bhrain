import * as path from 'path';

/**
 * .what = computes the .since, .uptil, and .attempts marker paths for a self-review trigger
 * .why = single source of truth for the trigger's key, so no call site can derive it differently
 *
 * .note = the key is (stone, slug) — hashless, exactly as the promise it gates is
 *         (getStonePromises: "all promises are hashless — firm checkpoints that don't invalidate").
 *         a repair to the artifact under review therefore mints no new report, resets no clock,
 *         and clears no attempt count.
 * .note = the trigger is invalidated by the rewind (delStoneGuardArtifacts), never by a hash.
 *         invalidation is a lifecycle event, not a cache key.
 *
 * 🔴 .note = THREE markers, and the third exists to keep a DIAGNOSTIC out of a GATE OPERAND.
 *            the tally lived inside `.since` until 2026-09-20, which forced every tally write to
 *            rewrite the one file whose MTIME the gate reads — `askedAt` for the haste cue, and
 *            the baseline the freshness bar diffs an articulation against. that shape carried two
 *            hazards, and a `fs.utimes` restore could only narrow the first:
 *            - a TRANSIENT wrong mtime, between the write and the restore. a concurrent lane whose
 *              `fs.stat` lands in that window reads the ask as dated NOW ⇒ a 40-minute-thorough
 *              driver meets `challenge:rushed`, or a fresh articulation reads as stale
 *            - a PERMANENT loss, swallowed. if the write lands and the `utimes` faults, the ask's
 *              date is rewritten forever and the fault returns as a benign `null`
 *            ⇒ separate FILES remove both by construction. the diagnostic can no longer touch the
 *              operand, so there is no window to narrow and no restore to fault.
 *            found by TWO independent lanes at i013, which converged on the same repair.
 *
 * 🟡 .note = `.attempts` needs no glob of its own. `asSelfReviewTriggeredGlob` reaches
 *            `…triggered.*`, so the rewind archives all three markers with no edit — which is
 *            what the shared `asBaseFilename` template buys.
 */
const asBaseFilename = (input: { stone: string; slug: string }): string =>
  `${input.stone}.guard.selfreview.${input.slug}.triggered`;

export const getSelfReviewTriggeredPaths = (input: {
  stone: string;
  slug: string;
  route: string;
}): {
  sincePath: string;
  uptilPath: string;
  attemptsPath: string;
  baseFilename: string;
} => {
  const baseFilename = asBaseFilename({
    stone: input.stone,
    slug: input.slug,
  });
  const routeDir = path.join(input.route, '.route');
  return {
    baseFilename,
    sincePath: path.join(routeDir, `${baseFilename}.since`),
    uptilPath: path.join(routeDir, `${baseFilename}.uptil`),
    attemptsPath: path.join(routeDir, `${baseFilename}.attempts`),
  };
};

/**
 * .what = the glob that reaches every marker of one stone — both kinds, every slug
 * .why = 🔴 the docblock above claims to be the single source "so no call site can derive it
 *        differently", and a call site derived it differently anyway: the rewind's archive
 *        globbed a hand-typed literal. that is the SAME failure mode this round's headline
 *        incident was — the extant cleanup globbed `…triggered.*.md`, matched zero of the
 *        `.since`/`.uptil` markers, and left 13 live markers on one route.
 *
 * 🔴 .note = a CLAIM of one source does not make one. the only mechanism that does is an
 *            export the other call site is forced through, which is what this is. the
 *            template now lives in `asBaseFilename`, and both readers share it.
 * .note = it returns a route-RELATIVE glob, because `enumRouteFiles` takes one.
 */
export const asSelfReviewTriggeredGlob = (input: { stone: string }): string =>
  `.route/${asBaseFilename({ stone: input.stone, slug: '*' })}.*`;
