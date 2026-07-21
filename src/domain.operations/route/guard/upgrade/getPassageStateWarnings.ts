import { getOnePassageReport } from '@src/domain.operations/route/passage/getOnePassageReport';

import type { GuardUpgradeWarning } from './GuardUpgradeWarning';

/**
 * .what = structured advisories for an upgrade whose stone already carries passage state
 * .why = an upgrade re-syncs a guard's RULES but never re-opens a prior passage (N6).
 *   so a driver is flagged when the stone they upgrade is already passed (the pass
 *   predates the new rules and is not re-validated) or approved-but-not-passed (its
 *   awaited pass will be judged against the new rules, i015). the heavier in-flight-meter
 *   (i014) reconciliation stays deferred — it needs deeper reads into the peer-meter store.
 *
 * .note = io — reads passage state from disk; yields structured warnings, the renderer
 *   owns the prose. only meaningful for an actual upgrade (a guard whose rules change);
 *   callers pass this for the 'upgrade' decision only, so a skipped/kept guard adds no noise.
 */
export const getPassageStateWarnings = async (input: {
  stone: string;
  route: string;
}): Promise<GuardUpgradeWarning[]> => {
  // N6 — the pass predates the upgraded rules; the upgrade does not re-validate it
  const passed = await getOnePassageReport({
    stone: input.stone,
    status: 'passed',
    route: input.route,
  });
  if (passed) return [{ type: 'already-passed', stone: input.stone }];

  // i015 — approved-but-not-passed; the awaited pass will be judged against new rules
  const approved = await getOnePassageReport({
    stone: input.stone,
    status: 'approved',
    route: input.route,
  });
  if (approved) return [{ type: 'approved-not-passed', stone: input.stone }];

  return [];
};
