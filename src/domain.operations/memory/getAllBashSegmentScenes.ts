import { asBashCwdAfterSegment } from './asBashCwdAfterSegment';
import { asBashWordBare } from './asBashWordBare';
import { getAllBashCommandSegments } from './getAllBashCommandSegments';
import { getAllBashWordsLead } from './getAllBashWordsLead';
import { getOneClaudePathAssigned } from './getOneClaudePathAssigned';
import { getOneMemoryPathFromCommand } from './getOneMemoryPathFromCommand';
import { isNativeMemoryPath } from './isNativeMemoryPath';

/**
 * .what = one simple command, and what it inherits from the whole command
 *   - segment = the simple command text
 *   - memoryAnchored = a memory path this command may reach though it names none:
 *     one named anywhere in the whole command, a `.claude/` path a var is set to
 *     (the shell may build a memory path from it), or a cwd inside memory
 *   - cwds = every cwd the shell may hold when this command runs; null = unknown
 */
export type BashSegmentScene = {
  segment: string;
  memoryAnchored: string | null;
  cwds: Array<string | null>;
};

/**
 * .what = the most possible cwds the fold tracks before it calls the cwd unknown
 * .why = each relative `cd` can double the set, so an unbounded set is exponential
 *        in the `cd` count; past the cap the cwd reads as unknown, which fails safe
 *        (a relative redirect beside memory blocks as unplaced)
 */
const BASH_CWDS_TRACKED_MAX = 16;

/**
 * .what = whether a simple command moves a cwd past its lead word
 * .why = `bash -c 'cd M; echo x > a.md'` moves a cwd inside a command string the
 *        fold cannot follow; that cwd is unknown, so a relative redirect beside
 *        memory blocks rather than passes
 * .note = the lead word is the fold's own; asBashCwdAfterSegment reads it. both
 *         read the lead through getAllBashWordsLead, so they agree on where it is
 */
const isBashCwdMovedPastLead = (input: { segment: string }): boolean =>
  getAllBashWordsLead(input)
    .slice(1)
    .some((word) => ['cd', 'pushd', 'popd'].includes(asBashWordBare({ word })));

/**
 * .what = the next set of possible cwds, after one simple command
 * .why = a `cd` may run or not (`||`, `&`, a subshell, an `if`), so the set only
 *        grows: each cwd the shell may hold is kept, never replaced
 * .note = past BASH_CWDS_TRACKED_MAX the set collapses to unknown (null), and keeps
 *         one cwd inside memory if any was held, so memory still carries forward
 */
const asBashCwdsAfterSegment = (input: {
  segment: string;
  cwds: Array<string | null>;
}): Array<string | null> => {
  const cwdsNext = [
    ...new Set([
      ...input.cwds,
      ...input.cwds.map((cwd) =>
        asBashCwdAfterSegment({ segment: input.segment, cwd }),
      ),
    ]),
  ];
  if (cwdsNext.length <= BASH_CWDS_TRACKED_MAX) return cwdsNext;
  const cwdInMemory = cwdsNext.find(
    (cwd): cwd is string => !!cwd && isNativeMemoryPath({ path: cwd }),
  );
  return cwdInMemory ? [null, cwdInMemory] : [null];
};

/**
 * .what = the memory path a simple command may reach through the whole command
 * .why = a loop header, a `read`, a pipe into `xargs`, or a `D=M` carries memory into
 *        a command that names none (`for f in M/*; do cp a "$f"; done`); a cwd inside
 *        memory carries it too. both fail safe: a memory path anywhere counts
 */
const asMemoryAnchored = (input: {
  memoryInCommand: string | null;
  cwds: Array<string | null>;
}): string | null =>
  input.memoryInCommand ??
  input.cwds.find(
    (cwd): cwd is string => !!cwd && isNativeMemoryPath({ path: cwd }),
  ) ??
  null;

/**
 * .what = what each simple command inherits from the whole command
 * .why = the guard grades each simple command, but memory and the cwd travel
 *        between them; this fold carries both, as an over-approximation, so a
 *        gap in the text blocks rather than passes
 */
export const getAllBashSegmentScenes = (input: {
  command: string;
  cwd: string | null;
}): BashSegmentScene[] => {
  const memoryInCommand =
    getOneMemoryPathFromCommand({ command: input.command }) ??
    getOneClaudePathAssigned({ command: input.command });

  // .note = deliberate mutation: one pass, one push per segment. the guard runs
  //         inside a hook with a 5s budget, and a copy per segment was quadratic
  const scenes: BashSegmentScene[] = [];
  let cwds: Array<string | null> = [input.cwd];
  for (const segment of getAllBashCommandSegments({ command: input.command })) {
    // a cwd moved inside this command's own text is unknown from here on, and
    // already within it (`bash -c 'cd M; echo x > a.md'`)
    const cwdsHere = isBashCwdMovedPastLead({ segment })
      ? [...new Set([...cwds, null])]
      : cwds;
    scenes.push({
      segment,
      cwds: cwdsHere,
      memoryAnchored: asMemoryAnchored({ memoryInCommand, cwds: cwdsHere }),
    });
    cwds = asBashCwdsAfterSegment({ segment, cwds: cwdsHere });
  }
  return scenes;
};
