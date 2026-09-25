/**
 * .what = the two glyphs a tree branch needs: its elbow, and the stem beneath it
 * .why = one concept, and it was derived in two places under two names — `formatTreeBucket`
 *        called them `labelMarker` and `cont`; the self-review roster called them `elbow`
 *        and `stem`. identical logic, identical output, no shared owner.
 *
 * .note = `elbow` and `stem` are the canonical words. a tee (`├─`) keeps a peer bar beneath it
 *         because a peer follows; an elbow (`└─`) is the last child, so its stem is blank.
 *
 * ⚠️ .note = this owns ONE call site today. it owned TWO until the self-review roster was
 *            deleted with the fork it advertised, so the duplication that justified the
 *            extraction no longer exists — and the owner is kept anyway, deliberately.
 *            ⇒ the repo holds the same derivation in 19 further prod files;
 *              `contract/cli/goal.ts` alone carries a dozen. those are NOT wired here on
 *              purpose: they sit in subsystems this round never opened, so to convert them
 *              would be the smuggled refactor `rule.always.fix-forward-under-scouts-honor`
 *              forbids. the owner exists so the count stops to grow, never as a claim that
 *              it has shrunk — and that reason is untouched by the roster's deletion.
 *            ⇒ the sweep is caught as a dream:
 *              `.dream/v2026_09_18.fix.tree-branch-markers-are-derived-in-nineteen-more-files.md`
 */
export const asTreeBranchMarkers = (input: {
  isLast: boolean;
}): { elbow: string; stem: string } => ({
  elbow: input.isLast ? '└─' : '├─',
  stem: input.isLast ? '   ' : '│  ',
});
