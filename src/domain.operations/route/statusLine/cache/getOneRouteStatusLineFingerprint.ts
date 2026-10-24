import * as fs from 'fs';
import * as path from 'path';

import { asRouteBindFlagName } from '@src/domain.operations/route/bind/asRouteBindFlagName';
import { asStonePromiseSlug } from '@src/domain.operations/route/guard/review/self/getStonePromisePaths';
import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';

import { asRouteStatusLineRouteDir } from './asRouteStatusLineRouteDir';

/**
 * .what = the fingerprint of every input the status line render reads
 * .why = a repaint whose fingerprint matches the cached one has naught new to show, so it
 *        prints the cached line and does no fresh work
 *
 * .note = the fingerprint is the branch, plus the mtime + size of:
 *         - `$route/` itself — stones and artifacts appear and vanish here
 *         - the render's own files in `$route/.route/`, kept by name: `passage.jsonl`,
 *           `reviewPeerMeters.jsonl`, each `*.guard.promise.*.md`, and the bind flag
 *
 * 🔴 .note = an ALLOWLIST, never every file in `.route/`: hooks write files there the render
 *            never reads (`.drive.blockers.latest.json`, `.bouncer.cache.json`, the
 *            `*.triggered.*` stamps). a fingerprint over those would miss on nearly every
 *            repaint of a seat at work. a render input added later must join this list
 *
 * .note = the bind flag name and the promise name come from their owners
 *         (`asRouteBindFlagName`, `asStonePromiseSlug`), so the writer and this read share one
 *         template each
 * .note = an unbound seat (route null) fingerprints on the branch alone; `route.bind.set`
 *         drops the cache, and the max age bounds any other change
 */
export const getOneRouteStatusLineFingerprint = (input: {
  cwd: string;
  branch: string;
  route: string | null;
}): string => {
  // an unbound seat: the branch alone
  if (input.route === null)
    return asFingerprint({ branch: input.branch, stats: [] });

  // a bound seat: the route dir, then each render input in its state dir
  const routeDir = asRouteStatusLineRouteDir({
    cwd: input.cwd,
    route: input.route,
  });
  const stateDir = asRouteStateDir({ routeDir });
  const namesOfInputs = asRenderInputNames({
    names: getAllDirEntryNames({ dirPath: stateDir }),
    branch: input.branch,
  });
  const stats = getAllNamedStats({
    paths: [
      { name: '$route', filePath: routeDir },
      ...asNamedPathsInDir({ dirPath: stateDir, names: namesOfInputs }),
    ],
  });
  return asFingerprint({ branch: input.branch, stats });
};

/**
 * .what = one file's stat, under the name its fingerprint row carries; null stat = absent
 */
interface NamedStat {
  name: string;
  stat: { mtimeMs: number; size: number } | null;
}

/**
 * .what = the fingerprint text: `branch=<branch>`, then one row per stat, newline-joined
 * .why = mtime catches a rewrite; size catches an append on a coarse-mtime filesystem
 */
const asFingerprint = (input: { branch: string; stats: NamedStat[] }): string =>
  [`branch=${input.branch}`, ...input.stats.map(asStatRow)].join('\n');

/**
 * .what = one fingerprint row: `<name>:<mtimeMs>:<size>`, or `<name>:absent`
 */
const asStatRow = (input: NamedStat): string =>
  input.stat
    ? `${input.name}:${input.stat.mtimeMs}:${input.stat.size}`
    : `${input.name}:absent`;

/**
 * .what = the route's state dir, `$route/.route`
 */
const asRouteStateDir = (input: { routeDir: string }): string =>
  path.join(input.routeDir, '.route');

/**
 * .what = of a state dir's entry names, the ones the render reads, sorted
 * .why = the allowlist that keeps hook writes out; sorted so the rows hold a stable order
 */
const asRenderInputNames = (input: {
  names: string[];
  branch: string;
}): string[] => {
  const nameOfBindFlag = asRouteBindFlagName({ branch: input.branch });
  return input.names
    .filter((name) => isRenderInputName({ name, nameOfBindFlag }))
    .sort();
};

/**
 * .what = the ledgers the render reads from the route's state dir
 */
const NAMES_OF_RENDER_LEDGERS = ['passage.jsonl', 'reviewPeerMeters.jsonl'];

/**
 * .what = whether a state dir entry is one the render reads
 * .why = the allowlist, named: the two ledgers, this branch's bind flag, and each promise
 */
const isRenderInputName = (input: {
  name: string;
  nameOfBindFlag: string;
}): boolean =>
  NAMES_OF_RENDER_LEDGERS.includes(input.name) ||
  input.name === input.nameOfBindFlag ||
  asStonePromiseSlug({ filename: input.name }) !== null;

/**
 * .what = a file to stat, and the name its fingerprint row carries
 */
interface NamedPath {
  name: string;
  filePath: string;
}

/**
 * .what = each entry name in a dir, paired with its full path
 */
const asNamedPathsInDir = (input: {
  dirPath: string;
  names: string[];
}): NamedPath[] =>
  input.names.map((name) => ({
    name,
    filePath: path.join(input.dirPath, name),
  }));

/**
 * .what = the stat of each named path, in order
 * .why = one stat per render input, each under its own name
 */
const getAllNamedStats = (input: { paths: NamedPath[] }): NamedStat[] =>
  input.paths.map(getOneNamedStat);

/**
 * .what = one file's stat under a name, or a null stat when the file is absent
 *
 * .note = only absence reads as null; any other fs fault rethrows, so the line faults loud
 *         rather than caches a render over a file nobody could read (rule.forbid.failhide)
 */
const getOneNamedStat = (input: NamedPath): NamedStat => {
  try {
    const stat = fs.statSync(input.filePath);
    return {
      name: input.name,
      stat: { mtimeMs: stat.mtimeMs, size: stat.size },
    };
  } catch (error) {
    if (isErrorOfAbsence({ error })) return { name: input.name, stat: null };
    throw error;
  }
};

/**
 * .what = the entry names of a dir, or [] when the dir is absent
 * .why = a route not yet driven has no state dir, which is a fact, never a fault
 */
const getAllDirEntryNames = (input: { dirPath: string }): string[] => {
  try {
    return fs.readdirSync(input.dirPath);
  } catch (error) {
    if (isErrorOfAbsence({ error })) return [];
    throw error;
  }
};
