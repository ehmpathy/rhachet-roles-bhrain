import type { GuardUpgradeWarning } from './GuardUpgradeWarning';
import type { GuardDiffLine } from './getGuardDiff';
import type { GuardUpgradeDecision } from './getGuardUpgradeDecision';

/**
 * .what = the per-guard outcome of an upgrade decide-pass
 * .why = a shared value shape produced by getStoneGuardUpgradePlan and consumed by
 *   setRouteGuardsFromProvenance (the writer) + formatGuardUpgradeTree (the renderer).
 *   it is a plain value shape, not a domain object (no identity/lifecycle).
 */
export interface GuardUpgradeResult {
  /**
   * the guard file's basename (e.g. `5.1.execution.guard`)
   */
  guardName: string;

  /**
   * the guard file's absolute path (the write target under apply)
   */
  guardPath: string;

  /**
   * the decision — the discriminated union that drives render + the apply gate
   */
  decision: GuardUpgradeDecision;

  /**
   * the provenance uri the guard was compared against, for `kept` + `upgrade`
   * (so a no-op names the template it matched); null when there is no provenance
   */
  from: string | null;

  /**
   * the var-replayed source content to write on apply, present only for `upgrade`
   */
  next: string | null;

  /**
   * the per-line diff (current vs next), present for `upgrade`; empty otherwise
   */
  diff: GuardDiffLine[];

  /**
   * plan-mode structured advisories (budget-clobber or passage-state) that a driver
   * should see before apply; an empty array when there is no flag to raise. the renderer
   * (formatGuardUpgradeTree) maps each to its prose (single-source-of-truth-for-render)
   */
  warnings: GuardUpgradeWarning[];
}
