import * as path from 'path';

/**
 * .what = maps guard file paths to their stone names (basename minus the `.guard` ext)
 * .why = the no-match error (edge.2) lists the AVAILABLE stones so a driver can correct
 *   a mistyped `--stone`. a named producer keeps that hint honest (not an ad-hoc inline).
 *
 * 🔴 .it sits at `guard/` rather than `guard/upgrade/`, and the move was earned rather than
 *    speculative (`rule.prefer.most-common-denominator`). the budget gate's multi-match refusal
 *    names the stones one `--stone` prefix matched — the SAME hint, for the same reason, one
 *    command over. two callers under two clusters ⇒ lift to their common ancestor.
 *
 * ⚠️ .and the ad-hoc inline this forbids is still at TWO sites — `getGuardFilesByStone.ts:19`,
 *    and a guardName-shaped variant at `getAllGuardUpgradeWarnings.ts:22`. they are left until
 *    disturbed rather than swept: neither sits in this change's diff, and a sweep that reaches
 *    them fails CLEAN (`rule.always.fix-forward-under-scouts-honor`).
 */
export const getGuardStoneNames = (input: { guardPaths: string[] }): string[] =>
  input.guardPaths.map((guardPath) =>
    path.basename(guardPath).replace(/\.guard$/, ''),
  );
