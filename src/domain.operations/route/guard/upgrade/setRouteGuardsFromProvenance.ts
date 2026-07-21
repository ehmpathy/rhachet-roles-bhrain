import * as fs from 'fs/promises';
import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';

import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

import { getGuardFilesByStone } from '../getGuardFilesByStone';
import { isENOENT } from '../isENOENT';
import type { GuardUpgradeResult } from './GuardUpgradeResult';
import { getGuardStoneNames } from './getGuardStoneNames';
import { getStoneGuardUpgradePlan } from './getStoneGuardUpgradePlan';

/**
 * .what = the decisions that BLOCK an apply (a guard that cannot be upgraded)
 * .why = the B3 gate fails the whole set loud if any targeted guard holds one of
 *   these, so the route is never left half-upgraded on a known-bad guard.
 */
const BLOCKING_DECISIONS = ['absent-source', 'invalid-source', 'unknown-var'];

/**
 * .what = upgrades a route's guards from their provenance templates — the SOLE writer
 * .why = decides EVERY targeted guard first (phase 1, pure of writes), gates the whole
 *   set (B3), then writes only on apply (phase 2). this "decide-all-then-write" order is
 *   what keeps a multi-guard apply atomic on the decision layer: one blocked guard fails
 *   the set before any byte is written.
 *
 * .note = plan mode NEVER writes and NEVER fails on a per-guard decision — every outcome
 *   (incl. absent/invalid/unknown) is previewable. only apply gates on a blocking set.
 */
export const setRouteGuardsFromProvenance = async (input: {
  route: string;
  stone: string | null;
  mode: 'plan' | 'apply';
  repoRoot: string;
}): Promise<GuardUpgradeResult[]> => {
  // enumerate every guard in the route, then narrow to the --stone target (if any)
  const routeAbs = path.resolve(input.repoRoot, input.route);

  // edge.10 — fail loud if the route dir is absent. a typo'd --route must NOT
  // silently enumerate zero guards and report a false success (globby returns []
  // for a missing cwd rather than a throw).
  const routeStat = await fs.stat(routeAbs).catch((error: unknown) => {
    if (isENOENT(error)) return null; // absent dir ⟹ the loud throw below
    throw error; // other stat error ⟹ server-side, propagate (no failhide)
  });
  if (!routeStat || !routeStat.isDirectory())
    throw new BadRequestError(
      `route not found: ${input.route}. did you mistype --route?`,
      { route: input.route, routeAbs },
    );

  // enumerate with cwd pinned to repoRoot (rule.forbid.cwd-outside-gitroot) and a
  // bounded, non-recursive glob scoped to the route dir — enumFilesFromGlob returns
  // ABSOLUTE paths, so the results are byte-identical to a route-cwd enumeration
  const routeRel = path.relative(input.repoRoot, routeAbs);
  const guardFiles = await enumFilesFromGlob({
    glob: `${routeRel}/*.guard`,
    cwd: input.repoRoot,
  });
  const targeted = input.stone
    ? getGuardFilesByStone({ guardFiles, stone: input.stone })
    : guardFiles;

  // edge.2 — a --stone that matches no guard fails loud, naming the available stones
  if (input.stone && targeted.length === 0)
    throw new BadRequestError(
      `no guard matched --stone ${input.stone}. available stones: ${getGuardStoneNames(
        { guardPaths: guardFiles },
      ).join(', ')}`,
      { stone: input.stone, route: input.route },
    );

  // phase 1 — decide every targeted guard (never writes)
  const results = await Promise.all(
    targeted.map((guardPath) =>
      getStoneGuardUpgradePlan({
        guardPath,
        route: input.route,
        repoRoot: input.repoRoot,
      }),
    ),
  );

  // plan mode is a pure preview — return the decisions, write no bytes
  if (input.mode === 'plan') return results;

  // B3 gate — under apply, a single blocking decision fails the whole set (no write)
  const blocked = results.filter((r) =>
    BLOCKING_DECISIONS.includes(r.decision.decision),
  );
  if (blocked.length > 0)
    throw new BadRequestError(
      `cannot upgrade: ${blocked.length} ${
        blocked.length === 1 ? 'guard' : 'guards'
      } blocked — ${blocked
        .map((r) => `${r.guardName} (${r.decision.decision})`)
        .join(', ')}`,
      { blocked: blocked.map((r) => r.guardName) },
    );

  // phase 2 — write the upgrades (apply only). the B3 gate above already proved
  // every targeted guard is upgrade-able, so the only fallible step left is the
  // disk write itself. UnexpectedCodePathError.wrap enriches (never hides) a
  // mid-apply throw; its message reports the guards written so far via a
  // functional slice.
  const upgrades = results.filter((r) => r.decision.decision === 'upgrade');
  for (const [index, result] of upgrades.entries()) {
    const writtenSoFar = upgrades.slice(0, index).map((r) => r.guardName);
    await UnexpectedCodePathError.wrap(
      async () => fs.writeFile(result.guardPath, result.next!, 'utf-8'),
      {
        message: `failed to write guard ${result.guardName} mid-apply; guards written so far: ${
          writtenSoFar.join(', ') || '(none)'
        }`,
        metadata: { guardName: result.guardName, writtenSoFar },
      },
    )();
  }

  return results;
};
