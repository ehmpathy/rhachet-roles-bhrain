/**
 * .what = a structured plan-mode advisory a driver should see before apply
 * .why = the domain layer decides WHICH flag to raise as a typed value; the renderer
 *   (formatGuardUpgradeTree) owns the prose. this keeps copy in one place
 *   (rule.require.single-source-of-truth-for-render) and lets tests assert on state,
 *   not on the exact sentence.
 */
export type GuardUpgradeWarning =
  /**
   * N6 — the stone already passed under the prior guard; the upgrade re-syncs its rules
   * but does not re-validate the prior passage
   */
  | { type: 'already-passed'; stone: string }
  /**
   * i015 — the stone is approved but not yet passed; its awaited pass will be judged
   * against the new rules
   */
  | { type: 'approved-not-passed'; stone: string }
  /**
   * B4 — the upgrade would revert a human-granted peer-review budget on a reviewer slug
   */
  | { type: 'budget-clobber'; slug: string; before: number; after: number };
