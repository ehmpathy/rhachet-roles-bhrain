import { findsertRouteGitignore } from '@src/domain.operations/route/gitignore/findsertRouteGitignore';
import { stepRouteStatusLine } from '@src/domain.operations/route/stepRouteStatusLine';
import { setOneFileAtomic } from '@src/infra/fs/setOneFileAtomic';

import { asRouteStatusLineRouteDir } from '../cache/asRouteStatusLineRouteDir';
import { getOneBranchFromHeadFileOrNull } from '../cache/getOneBranchFromHeadFileOrNull';
import { getOneRouteStatusLineFingerprint } from '../cache/getOneRouteStatusLineFingerprint';
import { ATTEMPTS_OF_SETTLE } from './ATTEMPTS_OF_SETTLE';
import { asRouteStatusLineFileContent } from './asRouteStatusLineFileContent';
import { asRouteStatusLineFilePath } from './asRouteStatusLineFilePath';
import { asRouteStatusLineRouteRelative } from './asRouteStatusLineRouteRelative';
import { getOneRepoRootFromCwdOrNull } from './getOneRepoRootFromCwdOrNull';
import { setRouteStatusLinePointerWhereBound } from './setRouteStatusLinePointerWhereBound';

/**
 * .what = renders a route's status line and writes it beside the route, then names the route
 *         in this branch's pointer
 * .why = the status line is a display of route state, and route state changes only when a
 *        writer writes it. so each writer renders once, here, and every repaint of every seat
 *        reads the file with no node process (`route.status.line.sh`)
 *
 * .note = the line is the extant render (`stepRouteStatusLine`), so it is byte-equal to what
 *         the node entry prints
 * .note = two writers of one route can race: if the older render renames last, the file holds
 *         an older line with the newest mtime, which the reader's stale test cannot see. so
 *         after its rename, a writer re-reads the render inputs it rendered from, and renders
 *         again if any moved. the last writer to finish then holds the newest state (fulcrum F7)
 * .note = the branch comes from the HEAD file alone, no `git` spawn: a detached HEAD names no
 *         pointer, and the reader prints the blank line there too
 * .note = it takes no cwd: the render reads its route against `process.cwd()`, while the file
 *         and the pointer anchor at the repo root above it, where the harness runs the reader.
 *         a writer run from a subdir thus names the same pointer a root writer does
 * .note = a render whose phase derivation faulted degrades the line to the plain stone; its
 *         degrade row goes to stderr once, from the render that stands, so the cause is seen
 *         where the move ran, never hidden behind a quieter line
 * .note = `context.renderRoute` is the render, injected so a test can move an input mid-render
 *         and prove the F7 re-render; every caller takes the default
 */
export const setRouteStatusLineFile = async (
  input: {
    route: string;
    pointerAuthority: 'lookup' | 'flag';
  },
  context: { renderRoute: typeof stepRouteStatusLine } = {
    renderRoute: stepRouteStatusLine,
  },
): Promise<{ filePath: string; line: string }> => {
  // ignore the status file in git before it lands: a route's first writer may not be a passage
  await findsertRouteGitignore({ route: input.route });

  // anchor the file and the pointer at the repo root, where the reader runs; the route is
  // named relative to the process cwd, so fix its dir absolute before the anchor moves
  const cwdOfProcess = process.cwd();
  const cwd =
    getOneRepoRootFromCwdOrNull({ cwd: cwdOfProcess }) ?? cwdOfProcess;
  const routeDir = asRouteStatusLineRouteDir({
    cwd: cwdOfProcess,
    route: input.route,
  });
  const branch = getOneBranchFromHeadFileOrNull({ cwd });

  // render and write the status file, again while the inputs moved under the render
  const written = await setStatusFileUntilSettled(
    {
      cwd,
      branch,
      route: input.route,
      routeDir,
      attemptsLeft: ATTEMPTS_OF_SETTLE,
    },
    context,
  );

  // name this route in the branch pointer, where the route holds this branch's flag
  await setRouteStatusLinePointerWhereBound({
    cwd,
    branch,
    route: routeDir,
    pointerAuthority: input.pointerAuthority,
  });

  // a phase that could not be derived degraded the line; say why once, as the node entry does
  if (written.degradeRow) console.error(written.degradeRow);
  return { filePath: written.filePath, line: written.line };
};

/**
 * .what = renders the route and writes its status file, again while its render inputs moved
 * .why = the race cure (fulcrum F7): the file must never hold a render older than the inputs
 *        it was taken from, with an mtime newer than them
 */
const setStatusFileUntilSettled = async (
  input: {
    cwd: string;
    branch: string | null;
    route: string;
    routeDir: string;
    attemptsLeft: number;
  },
  context: { renderRoute: typeof stepRouteStatusLine },
): Promise<{ filePath: string; line: string; degradeRow: string | null }> => {
  // stamp the render inputs, render, then write the file whole
  const stampBefore = getOneInputStamp(input);
  const rendered = await context.renderRoute({ route: input.route });
  const filePath = asRouteStatusLineFilePath({
    cwd: input.cwd,
    route: input.routeDir,
  });
  await setOneFileAtomic({
    path: filePath,
    content: asRouteStatusLineFileContent({
      route: asRouteStatusLineRouteRelative({
        cwd: input.cwd,
        route: input.routeDir,
      }),
      stone: rendered.stone,
      phase: rendered.phase,
      line: rendered.line,
    }),
    mtime: null,
  });

  // the inputs held still, or the bound is spent: this render stands
  const isSettled = getOneInputStamp(input) === stampBefore;
  if (isSettled || input.attemptsLeft <= 1)
    return { filePath, line: rendered.line, degradeRow: rendered.degradeRow };

  // the inputs moved under the render: render again
  return setStatusFileUntilSettled(
    { ...input, attemptsLeft: input.attemptsLeft - 1 },
    context,
  );
};

/**
 * .what = a stamp of every render input the line reads, for the settle check
 * .why = reuses the cache's fingerprint, the one allowlist of render inputs, so the two
 *        cannot disagree on what the render reads
 *
 * .note = this list is wider than the reader's stale test: it holds the route dir's own mtime,
 *         which the reader leaves out on purpose (fulcrum F6), since a yield edit must not mark
 *         the line stale. so a file written into the route dir mid-render costs one extra
 *         render here, bounded by ATTEMPTS_OF_SETTLE, and never a wrong line
 */
const getOneInputStamp = (input: {
  cwd: string;
  branch: string | null;
  routeDir: string;
}): string =>
  getOneRouteStatusLineFingerprint({
    cwd: input.cwd,
    branch: input.branch ?? '',
    route: input.routeDir,
  });
