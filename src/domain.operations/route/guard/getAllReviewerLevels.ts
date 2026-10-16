import { BadRequestError } from 'helpful-errors';
import * as path from 'path';

// a declared exposure of review/ — see src/domain.operations/review/.readme.md
import { asErrorHeadline } from '@src/domain.operations/review/asErrorHeadline';
import { getAllPeerLevelsFromGuard } from '@src/domain.operations/route/guard/getAllPeerLevelsFromGuard';
import { isErrorOfDenial } from '@src/utils/fs/isErrorOfDenial';
import { getAllResultsInBoundedPool } from '@src/utils/getAllResultsInBoundedPool';

/**
 * .what = the two fields of a run this join reads, and no more
 * .why = the route context takes a DECISION's inputs, never the review meter's
 *        whole run object — so a reshape of that object cannot break a route file.
 *        a `ReviewRunMeter` satisfies it structurally, so the caller passes runs as-is
 *
 * .note = named, not inlined, because four signatures in this file read it — the
 *         export and the three transforms below it (asGuardPath,
 *         getAllGuardPathsOfRuns, asLevelByRunDir); four inline copies would drift
 */
type RunOfReviewerLevel = {
  dir: string;
  identity: { route: string | null; stone: string; slug: string } | null;
};

/**
 * .what = why a guard that is on disk could not be read, and the act that clears it —
 *         or null for a defect
 * .why = the allowlist of guard faults the level join absorbs: a malformed guard
 *        (the parser's BadRequestError) and a barred one (EACCES/EPERM). null for
 *        aught else, so the caller rethrows it (rule.forbid.failhide)
 *
 * .note = each cause carries its own fix: a reader told only "malformed" or "read denied"
 *         must guess the next act, and the two acts differ — one edits the file, the other
 *         grants access to it (rule.forbid.friction-hazards; r014 nitpick.2, i016)
 * .note = the parser's class label is cut (`asErrorHeadline`): the caller already opens
 *         the row under `✋ ConstraintError:`, so a second class name in the reason would
 *         show one failure under two labels, the second an internal one
 */
const asGuardUnread = (input: {
  error: unknown;
}): { reason: string; fix: string } | null => {
  if (input.error instanceof BadRequestError)
    return {
      reason: `malformed — ${asErrorHeadline({ error: input.error })}`,
      fix: 'repair the guard file as the reason names, then re-run',
    };
  if (isErrorOfDenial({ error: input.error }))
    return {
      reason: 'read denied — this process may not read the file',
      fix: 'grant read on the file (e.g. chmod u+r), or run as a user who may read it, then re-run',
    };
  return null;
};

/**
 * .what = the guard file a run's identity points at — `<tree>/<route>/<stone>.guard`
 * .why = the only place a reviewer's level is declared. a run's log dir carries a
 *        clock, a pid, and a uuid; its output path carries the stone and the
 *        slug. the level lives in neither, so it must be joined from the guard.
 *
 * .note = `tree` is required because a route is relative
 *         (`.behavior/v2026_09_18.feat-demo`), so `path.resolve` rather than
 *         `path.join` — a bare join would resolve against the process cwd, which
 *         is the tree only by coincidence. `--at <dir>` prices a tree the
 *         process did not start in, and a join would report a level from the
 *         wrong repo. `resolve` also honors an absolute route as-is.
 */
const asGuardPath = (input: {
  run: RunOfReviewerLevel;
  tree: string;
}): string | null => {
  const { identity } = input.run;
  if (!identity?.route) return null;
  return path.resolve(input.tree, identity.route, `${identity.stone}.guard`);
};

/**
 * .what = the level of each run's reviewer, keyed by run dir — absent where unknown
 * .why = the guard declares `level: 1` / `level: 3` per lane, and the meter never
 *        read it, so "what did L1 cost" needed a hand-join of the guard yaml
 *        against the reviewer rows.
 *
 * .note = an absent key means unknown, and must never default to 1:
 *
 *         - a guard that declares a lane and omits `level:` — the lane IS at
 *           level 1. `parseStoneGuard` defaults it, matching what the pour
 *           engine actually does, and it lands in this map as `1`.
 *         - a guard that cannot be read at all — no route, no file, or a slug
 *           not in it — the level is an absence, and no key is written.
 *         - a guard that is there and malformed or barred — no key either, and
 *           the guard is named in `guardsUnread`, so the caller can say which
 *           file to repair while every other run still prices.
 *
 *         the same absent-vs-zero law as `getOneAccountedCost` (spend),
 *         `getOneAttributionGrade` (composition), `getOneCacheGrade` (cache).
 *
 * .note = the level is read as the guard stands now, never as it stood when the
 *         run happened. a guard is mutable, and a lane promoted from L1 to L3
 *         re-files its historical runs under L3 — the log corpus records no
 *         level, so a joined-now figure is the honest best available, and is
 *         stated in `--help` rather than guessed at silently.
 *
 * .note = this join lives in the route context, beside the guard it reads. it
 *         takes the four run fields it reads as an inline shape, so no review
 *         type crosses into route (rule.forbid.scope-leaks) — the same law under
 *         which `getAllPeerLevelsFromGuard` hands back a decision, never a parse
 *         tree. the guard read is a same-repo op, so it is
 *         imported, never injected (rule.forbid.inject-same-repo-domain-ops)
 */
export const getAllReviewerLevels = async (input: {
  runs: RunOfReviewerLevel[];
  /**
   * the tree root every run's relative route resolves against — the same `cwd`
   * `getAllReviewRunMeters` was given, which is what `--at` sets.
   *
   * required rather than defaulted to `process.cwd()`: a default would be right
   * whenever the caller stands in the tree, and silently wrong the moment
   * `--at` points elsewhere — reading a real guard from the wrong repo and
   * reporting its levels as this tree's.
   */
  tree: string;
}): Promise<{
  levels: Map<string, number>;
  /**
   * each guard on the read path that is THERE and could not be read — malformed
   * or barred — named with why, once per guard. its runs carry no level key, as
   * an absent guard's do; the difference is that an absence is a fact and an
   * unread guard is a defect a human must see, so the caller names it, and the
   * `fix` that clears it
   */
  guardsUnread: Array<{ path: string; reason: string; fix: string }>;
}> => {
  // one read per guard, never per run — a stone with 11 lanes over 6 rounds
  // points 66 runs at one file, and a per-run read would open it 66 times
  const pathsOfGuard = getAllGuardPathsOfRuns({
    runs: input.runs,
    tree: input.tree,
  });
  const reads = await getAllGuardLevelReads({ paths: pathsOfGuard });

  // join each run to its guard's level, then name every guard that could not be read
  return {
    levels: asLevelByRunDir({ runs: input.runs, tree: input.tree, reads }),
    guardsUnread: getAllGuardsUnread({ reads }),
  };
};

/**
 * .what = the distinct guard files a set of runs points at
 * .why = the read plan of the join: one entry per guard, so each guard opens once.
 *        a run with no slug or no route points at no guard, and is skipped
 */
const getAllGuardPathsOfRuns = (input: {
  runs: RunOfReviewerLevel[];
  tree: string;
}): string[] => {
  const pathsOfRunsWithSlug = input.runs
    .filter((run) => run.identity?.slug)
    .map((run) => asGuardPath({ run, tree: input.tree }))
    .filter((guardPath): guardPath is string => guardPath !== null);
  return [...new Set(pathsOfRunsWithSlug)];
};

/**
 * .what = each guard that is there and could not be read, with why
 * .why = an absent guard is a fact (no entry); an unread one is a defect a human
 *        must see, so only reads that carry a reason are named
 */
const getAllGuardsUnread = (input: {
  reads: Array<{
    path: string;
    unread: { reason: string; fix: string } | null;
  }>;
}): Array<{ path: string; reason: string; fix: string }> =>
  input.reads.flatMap((read) =>
    read.unread === null ? [] : [{ path: read.path, ...read.unread }],
  );

/**
 * .what = one guard's per-slug levels, or why it could not be read
 * .why = an absent guard is a fact the meter reports on purpose — the corpus it
 *        prices spans archived routes, deleted guards, and other machines' trees,
 *        so an absent guard costs this axis its rows for that stone alone.
 *
 *        a guard that is there and cannot be read — malformed (BadRequestError from
 *        the parser) or barred (EACCES/EPERM) — is isolated to its own runs and
 *        NAMED via `unread`. one hand-edited guard must not deny the price of every
 *        other run in the tree, and must not pass silently as an absence either
 *        (rule.forbid.failhide). every other fault rethrows
 */
const getOneGuardLevelRead = async (input: {
  path: string;
}): Promise<{
  path: string;
  levels: Map<string, number>;
  unread: { reason: string; fix: string } | null;
}> =>
  getAllPeerLevelsFromGuard({ path: input.path }).then(
    // a null read is an absent guard — a fact, so no key and no unread entry
    (levels) => ({
      path: input.path,
      levels: levels ?? new Map(),
      unread: null,
    }),
    (error: unknown) => {
      const unread = asGuardUnread({ error });
      if (unread === null) throw error;
      return { path: input.path, levels: new Map(), unread };
    },
  );

/**
 * .what = how many guard reads may be in flight at one time
 * .why = the distinct guards grow with every stone a tree ever reviewed, and each read
 *        parses a guard and expands its `@path` refs. the bound keeps the open reads at a
 *        fixed count however large the corpus grows, as `getAllReviewRunMeters` does
 */
const BOUND_OF_CONCURRENT_GUARD_READS = 8;

/**
 * .what = the level read of every guard, one read per path, in bounded waves
 * .why = the orchestrator names the act; the fan-out and its bound stay here
 */
const getAllGuardLevelReads = async (input: {
  paths: string[];
}): Promise<Awaited<ReturnType<typeof getOneGuardLevelRead>>[]> =>
  getAllResultsInBoundedPool({
    items: input.paths,
    bound: BOUND_OF_CONCURRENT_GUARD_READS,
    map: (guardPath) => getOneGuardLevelRead({ path: guardPath }),
  });

/**
 * .what = each run's level, keyed by run dir — absent where its guard or slug is unknown
 * .why = the output is smaller than the input (a run with no guard or no slug has no
 *        key) and keyed by dir rather than position, so it is named rather than a
 *        simulated loop in the orchestrator
 */
const asLevelByRunDir = (input: {
  runs: RunOfReviewerLevel[];
  tree: string;
  reads: Array<{ path: string; levels: Map<string, number> }>;
}): Map<string, number> => {
  const levelsByGuard = new Map(
    input.reads.map((read) => [read.path, read.levels]),
  );
  return new Map(
    input.runs.flatMap((run): Array<[string, number]> => {
      const guardPath = asGuardPath({ run, tree: input.tree });
      const slug = run.identity?.slug;
      if (!guardPath || !slug) return [];
      const level = levelsByGuard.get(guardPath)?.get(slug);
      // `=== undefined`, never a falsy check — `level: 0` is refused at parse
      // (`asGuardPositiveInt`), so it cannot arrive here; but a falsy test would
      // silently re-grade it as unknown the day that refusal is relaxed
      return level === undefined ? [] : [[run.dir, level]];
    }),
  );
};
