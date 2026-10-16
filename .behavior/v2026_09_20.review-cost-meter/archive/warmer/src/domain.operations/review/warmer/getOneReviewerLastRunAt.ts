import * as path from 'path';

import { asLogDirMintedAt } from '../asLogDirMintedAt';
import { asReviewLogsDir } from '../asReviewLogsDir';
import { asReviewRunIdentity } from '../asReviewRunIdentity';
import { getAllEntriesInDir } from '../getAllEntriesInDir';
import type { ReviewRunArgsRecordRead } from '../ReviewRunArgsRecord';
import { getAllLogDirNamesSince } from './getAllLogDirNamesSince';
import { getOneReviewRunArgs } from './getOneReviewRunArgs';

/**
 * .what = whether a parsed args record belongs to one reviewer's run
 * .why = fallback is the EMPTY path, never a fabricated one. an args file can parse
 *        with no `output` key (an old reviewer version, a hand-edited artifact), and
 *        `asReviewRunIdentity` answers null for a path with no lane — the honest "not
 *        this reviewer's run". a fabricated lane would make every output-less run the
 *        LATEST run of whichever lane asked, so the warmer would defer forever on a
 *        touch that never happened (rule.forbid.unexpected-defaults). `[case3]` clamps it.
 */
const isRunOfReviewer = (input: {
  args: ReviewRunArgsRecordRead | null;
  reviewer: string;
}): boolean =>
  input.args !== null &&
  asReviewRunIdentity({ output: input.args.args?.output ?? '' })?.slug ===
    input.reviewer;

/**
 * .what = the log dir names, among those given, that one reviewer ran
 * .why = the orchestrator reads `namesNewer → namesOfReviewer → latest` rather than
 *        simulate a closure that reads each run's args off disk
 */
const getAllRunNamesOfReviewer = (input: {
  names: string[];
  logsDir: string;
  reviewer: string;
}): string[] =>
  input.names.filter((name) =>
    isRunOfReviewer({
      args: getOneReviewRunArgs({ dir: path.join(input.logsDir, name) }),
      reviewer: input.reviewer,
    }),
  );

/**
 * .what = the latest of a set of instants, or null for an empty set
 */
const asLatestDate = (input: { dates: Date[] }): Date | null =>
  input.dates.length
    ? new Date(Math.max(...input.dates.map((date) => date.getTime())))
    : null;

/**
 * .what = when a NOMINAL review last ran for one reviewer, or null where none has
 * .why = the warmer's schedule is a chain of TOUCHES, and a real review is one — an
 *        ordinary completion fills the cache on the read path exactly as a poke
 *        does, so a poke sent moments after one buys naught and bills in full.
 *
 *        ⇒ lets `getOneWarmerWakeVerdict` defer instead of spend. the likeliest
 *        redundancy: a driver re-drives the guard while active, exactly when the
 *        warmer is also awake.
 *
 * .note = scan is BOUNDED by `since` (`getAllLogDirNamesSince`) — reads args of only
 *         dirs minted after the last touch, at most a handful. unbounded would
 *         re-read every run on every wake.
 *
 * .note = reviewer is recovered from `input.args.json`'s output path — the log dir
 *         name carries only a timestamp, a pid, and a uuid, and cannot answer "whose
 *         run was this".
 *
 * .note = ASYNC only so the log-root read can reuse `getAllEntriesInDir`, rather than
 *         a sync twin of it (`rule.always.reuse-pavement-before-improvise`).
 */
export const getOneReviewerLastRunAt = async (input: {
  cwd: string;
  reviewer: string;
  /** only consider runs minted after this instant */
  since: Date;
}): Promise<Date | null> => {
  const logsDir = asReviewLogsDir({ cwd: input.cwd });

  // ONE read, never `existsSync` then `readdirSync` — that pair is check-then-act
  // against a LIVE log root a concurrent lane writes into, inside a DETACHED
  // warmer (`stdio: 'ignore'`), so a throw takes the whole loop down with no row
  // written (`rule.forbid.behavior-hazards`). `getAllEntriesInDir` answers null
  // for an absent root, rethrows a DENIAL untouched, wraps every other errno
  // with the path
  const entries = await getAllEntriesInDir({ at: logsDir });
  if (entries === null) return null;

  // the runs minted since the last touch
  const namesNewer = getAllLogDirNamesSince({
    names: entries.map((entry) => entry.name),
    since: input.since,
  });

  // of those, the ones this reviewer ran
  const namesOfReviewer = getAllRunNamesOfReviewer({
    names: namesNewer,
    logsDir,
    reviewer: input.reviewer,
  });

  // the latest of them
  return asLatestDate({
    dates: namesOfReviewer.map((name) => asLogDirMintedAt({ name })),
  });
};
