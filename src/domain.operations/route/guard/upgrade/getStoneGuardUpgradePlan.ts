import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';

import type { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';

import { isENOENT } from '../isENOENT';
import { parseStoneGuard } from '../parseStoneGuard';
import type { GuardUpgradeResult } from './GuardUpgradeResult';
import { getAllGuardUpgradeWarnings } from './getAllGuardUpgradeWarnings';
import { getGuardDiff } from './getGuardDiff';
import { getGuardProvenance } from './getGuardProvenance';
import { getGuardUpgradeDecision } from './getGuardUpgradeDecision';
import { getGuardWithCopyTimeVars } from './getGuardWithCopyTimeVars';
import { getUnknownGuardVars } from './getUnknownGuardVars';
import { isPathWithinRoot } from './isPathWithinRoot';

/**
 * .what = parses guard content, yielding the parsed guard or null when it is not a guard
 * .why = D6 needs to VALIDATE the fetched source before it diffs/applies like a legit
 *   upgrade — and the budget-clobber check needs the SAME parsed guard. returning the
 *   parsed value (not a boolean) lets one parse serve both, so the content is parsed once.
 *   a BadRequestError is parseStoneGuard's loud "this is not a valid guard" signal (slug
 *   clash, bad @path ref, bad timeout) ⟹ null; any other error propagates (no failhide).
 */
const getGuardParsedOrNull = async (input: {
  content: string;
  path: string;
}): Promise<RouteStoneGuard | null> => {
  try {
    return await parseStoneGuard({ content: input.content, path: input.path });
  } catch (error) {
    if (error instanceof BadRequestError) return null;
    throw error;
  }
};

/**
 * .what = decides ONE guard's upgrade outcome — reads, never writes (i7.r11.1)
 * .why = the decide phase must be pure of writes so plan never mutates and the route
 *   orchestrator can gate the whole set before any write. all decode-friction lives in
 *   named transformers; this reads as narrative.
 *
 * .note = throws ONLY for a path-traversal `provenance.uri` (a security escape, both
 *   modes, before any read). every other outcome is a returned decision value.
 */
export const getStoneGuardUpgradePlan = async (input: {
  guardPath: string;
  route: string;
  repoRoot: string;
}): Promise<GuardUpgradeResult> => {
  const guardName = path.basename(input.guardPath);

  // read the CURRENT guard (raw, for lineage + diff)
  const current = await fs.readFile(input.guardPath, 'utf-8');

  // read lineage via the minimal line-scan (NOT the full parser)
  const provenance = getGuardProvenance({ content: current });
  if (!provenance)
    return {
      guardName,
      guardPath: input.guardPath,
      decision: { decision: 'skipped' },
      from: null,
      next: null,
      diff: [],
      warnings: [],
    };

  // derive the template abs path and guard against traversal BEFORE any read
  const joined = path.resolve(input.repoRoot, provenance.uri);
  if (!isPathWithinRoot({ pathResolved: joined, repoRoot: input.repoRoot }))
    throw new BadRequestError(
      `provenance.uri escapes the repo root: ${provenance.uri} (guard ${guardName})`,
      { uri: provenance.uri, guardName },
    );

  // harden against a symlink that escapes the repo; ENOENT ⟹ absent source
  let templatePath: string | null;
  try {
    templatePath = await fs.realpath(joined);
  } catch (error) {
    if (!isENOENT(error)) throw error; // EACCES/other → server-side, propagate (exit 1)
    templatePath = null; // ENOENT ⟹ absent source
  }
  if (templatePath === null)
    return {
      guardName,
      guardPath: input.guardPath,
      decision: { decision: 'absent-source' },
      from: provenance.uri,
      next: null,
      diff: [],
      warnings: [],
    };
  if (
    !isPathWithinRoot({ pathResolved: templatePath, repoRoot: input.repoRoot })
  )
    throw new BadRequestError(
      `provenance.uri symlink escapes the repo root: ${provenance.uri} (guard ${guardName})`,
      { uri: provenance.uri, templatePath, guardName },
    );

  // read the source template (ENOENT here = a race delete ⟹ absent; else propagate)
  let sourceRaw: string;
  try {
    sourceRaw = await fs.readFile(templatePath, 'utf-8');
  } catch (error) {
    if (isENOENT(error))
      return {
        guardName,
        guardPath: input.guardPath,
        decision: { decision: 'absent-source' },
        from: provenance.uri,
        next: null,
        diff: [],
        warnings: [],
      };
    throw error; // server-side read error → propagate (exit 1)
  }

  // replay the sole copy-time var, then validate + scan + diff
  const routeRelDir = path.relative(
    input.repoRoot,
    path.resolve(input.repoRoot, input.route),
  );
  const next = getGuardWithCopyTimeVars({ content: sourceRaw, routeRelDir });

  // parse the fetched source ONCE — serves both the D6 validity check and the budget
  // clobber compare (so `next` is never parsed twice)
  const nextGuard = await getGuardParsedOrNull({
    content: next,
    path: templatePath,
  });
  const unknownVars = getUnknownGuardVars({ content: next });
  const diff = getGuardDiff({ current, next });

  const decision = getGuardUpgradeDecision({
    provenance,
    source: { found: true, next, valid: nextGuard !== null },
    unknownVars,
    current,
  });

  // advisory notes fire only for an actual upgrade (rules change): passage state (N6/i015)
  // + reverted-budget-grant (B4). the aggregator composes both from the already-parsed
  // guards, so a skipped/kept/blocked guard adds no note and no content is re-parsed.
  const currentGuard =
    decision.decision === 'upgrade'
      ? await getGuardParsedOrNull({
          content: current,
          path: input.guardPath,
        })
      : null;
  const warnings =
    decision.decision === 'upgrade'
      ? await getAllGuardUpgradeWarnings({
          guardName,
          route: input.route,
          currentGuard,
          nextGuard,
        })
      : [];

  return {
    guardName,
    guardPath: input.guardPath,
    decision,
    from: provenance.uri,
    next: decision.decision === 'upgrade' ? next : null,
    diff,
    warnings,
  };
};
