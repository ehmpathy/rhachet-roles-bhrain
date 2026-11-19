/**
 * .what = evaluate whether a tool invocation writes to claude native memory
 * .why = native memory is machine-local and invisible in git — not durable, not
 *        reusable. this verdict feeds a hook that halts such writes and redirects
 *        the bot to durable capture in .agent/repo=.this/role=any/{briefs,skills}.
 */
import * as path from 'path';

import { getAllBashRedirectTargets } from './getAllBashRedirectTargets';
import {
  type BashSegmentScene,
  getAllBashSegmentScenes,
} from './getAllBashSegmentScenes';
import { getAllBashTeeOperands } from './getAllBashTeeOperands';
import { getOneBashCopyDestination } from './getOneBashCopyDestination';
import { getOneBashCopyVerb } from './getOneBashCopyVerb';
import { getOneMemoryPathFromCommand } from './getOneMemoryPathFromCommand';
import { isBashPathAnchored } from './isBashPathAnchored';
import { isNativeMemoryPath } from './isNativeMemoryPath';
import { MEMORY_GUARD_TOOLS } from './MEMORY_GUARD_TOOLS';

/**
 * .what = how a blocked call touches native memory
 * .why = the nudge names the act it graded
 *   - write = the call writes a memory path (Write, Edit, `>`, tee, teesafe, a cp
 *     or mv whose destination is memory)
 *   - copy = a cp or mv whose destination is not memory: a copy out, graded blunt
 *   - unplaced = a redirect to a place the guard cannot know (`$D/a.md`, or a
 *     relative path with no cwd known), beside memory or a var set under
 *     `.claude/`; it may land in memory
 */
export type MemoryGuardAct = 'write' | 'copy' | 'unplaced';
type MemoryTouch = { path: string; act: MemoryGuardAct };

/**
 * .what = every absolute place a relative redirect target may land, when known
 * .why = with each possible cwd known, `cat M > out.txt` lands at a known set of
 *        places, so it is graded exactly; an unknown cwd, a `$var`, or a backtick
 *        leaves the place unknown (null)
 */
const getAllBashPathPlacements = (input: {
  target: string;
  cwds: Array<string | null>;
}): string[] | null => {
  const cwdsKnown = input.cwds.filter((cwd): cwd is string => cwd !== null);
  if (cwdsKnown.length < input.cwds.length || /[$`]/.test(input.target))
    return null;
  return cwdsKnown.map((cwd) => path.join(cwd, input.target));
};

/**
 * .what = grade one redirect target against native memory
 * .why = a redirect writes where it lands; a place the guard cannot know, beside
 *        a memory path, may be memory, so it blocks
 */
const getMemoryTouchOfBashRedirect = (input: {
  target: string;
  memoryNamed: string | null;
  cwds: Array<string | null>;
}): MemoryTouch | null => {
  // a target that names memory is a write
  if (isNativeMemoryPath({ path: input.target }))
    return { path: input.target, act: 'write' };

  // an absolute or home path outside memory lands outside it
  if (isBashPathAnchored({ path: input.target })) return null;

  // a relative target with every cwd known lands at known places; grade each
  const placements = getAllBashPathPlacements({
    target: input.target,
    cwds: input.cwds,
  });
  if (placements) {
    const placedInMemory = placements.find((placed) =>
      isNativeMemoryPath({ path: placed }),
    );
    return placedInMemory ? { path: placedInMemory, act: 'write' } : null;
  }

  // a `$var` or an unplaced relative target, beside memory, may land in it
  return input.memoryNamed
    ? { path: input.memoryNamed, act: 'unplaced' }
    : null;
};

/**
 * .what = the act a cp or mv performs on the memory path beside it
 * .why = a cp or mv whose destination is memory writes it; any other may copy
 *        out, so it is graded blunt (tee is graded by its operands instead)
 */
const asMemoryGuardActOfCopy = (input: { segment: string }): MemoryGuardAct =>
  isNativeMemoryPath({ path: getOneBashCopyDestination(input) })
    ? 'write'
    : 'copy';

/**
 * .what = grade a tee by the files it writes: its operands
 * .why = tee writes stdin to its operands and to naught else, so `cat M | tee
 *        .agent/…/b.md` lands outside memory; each operand is graded as a redirect
 *        target is. where the text cannot name them (getAllBashTeeOperands gives
 *        null), the tee is graded blunt: a write of the memory beside it
 */
const getMemoryTouchOfBashTee = (input: {
  segment: string;
  memoryNamed: string;
  cwds: Array<string | null>;
}): MemoryTouch | null => {
  const operands = getAllBashTeeOperands({ segment: input.segment });
  if (!operands) return { path: input.memoryNamed, act: 'write' };
  return (
    operands
      .map((target) =>
        getMemoryTouchOfBashRedirect({
          target,
          memoryNamed: input.memoryNamed,
          cwds: input.cwds,
        }),
      )
      .find((touch) => touch !== null) ?? null
  );
};

/**
 * .what = grade one simple command against native memory
 * .why = a redirect is graded by where it lands; a copy verb by the memory path
 *        beside it, named in this command or carried in by the whole command
 */
const getMemoryTouchOfBashSegment = (
  input: BashSegmentScene,
): MemoryTouch | null => {
  // the memory path this command reaches: its own, or one the whole command carries
  const memoryNamed =
    getOneMemoryPathFromCommand({ command: input.segment }) ??
    input.memoryAnchored;

  // a redirect is graded by where it lands
  const touchRedirect =
    getAllBashRedirectTargets({ command: input.segment })
      .map((target) =>
        getMemoryTouchOfBashRedirect({ target, memoryNamed, cwds: input.cwds }),
      )
      .find((touch) => touch !== null) ?? null;
  if (touchRedirect) return touchRedirect;

  // a copy verb beside a memory path writes or copies it
  const verb = getOneBashCopyVerb({ segment: input.segment });
  if (!verb || !memoryNamed) return null;
  if (verb === 'tee' || verb === 'teesafe')
    return getMemoryTouchOfBashTee({
      segment: input.segment,
      memoryNamed,
      cwds: input.cwds,
    });
  return {
    path: memoryNamed,
    act: asMemoryGuardActOfCopy({ segment: input.segment }),
  };
};

/**
 * .what = detect a native-memory path written by a bash command
 * .why = Bash tool sends a command string, not a file_path; a Write|Edit-only
 *        matcher would be trivially bypassable via `echo … | teesafe ~/.claude/…`
 * .note = redirects are graded by target (getAllBashRedirectTargets), since a bare
 *         `>` also appears in `2>&1`, `>&2`, `=>`, `->`, none of which write a file
 */
const getMemoryPathFromBashWrite = (input: {
  command: string;
  cwd: string | null;
}): MemoryTouch | null =>
  getAllBashSegmentScenes(input)
    .map((scene) => getMemoryTouchOfBashSegment(scene))
    .find((touch) => touch !== null) ?? null;

/**
 * .what = whether a tool is one the guard grades, of the given kind
 * .why = the hook's filter reads the same list, so the two never disagree
 */
const isMemoryGuardTool = (input: {
  kind: keyof typeof MEMORY_GUARD_TOOLS;
  toolName: string;
}): boolean =>
  MEMORY_GUARD_TOOLS[input.kind].some((name) => name === input.toolName);

/**
 * .what = extract the path to check from a tool invocation, and the act that touches it
 * .why = Write/Edit carry file_path; Bash carries a command to inspect for writes
 */
const extractMemoryPathToCheck = (input: {
  toolName: string;
  toolInput: { file_path: string | null; command: string | null };
  cwd: string | null;
}): MemoryTouch | null => {
  // shell tool: only a write into a memory path counts
  if (
    isMemoryGuardTool({ kind: 'shell', toolName: input.toolName }) &&
    input.toolInput.command
  ) {
    return getMemoryPathFromBashWrite({
      command: input.toolInput.command,
      cwd: input.cwd,
    });
  }

  // file tools: the file_path is the write target, if memory
  if (
    isMemoryGuardTool({ kind: 'file', toolName: input.toolName }) &&
    input.toolInput.file_path &&
    isNativeMemoryPath({ path: input.toolInput.file_path })
  ) {
    return { path: input.toolInput.file_path, act: 'write' };
  }

  return null;
};

/**
 * .what = decide whether a tool invocation writes to claude native memory
 * .why = the hook halts on 'blocked' and nudges toward durable capture
 * .note = cwd is the shell's cwd the harness sends, or null; with it, a relative
 *         redirect is graded exactly, without it, one beside memory blocks
 */
export const getMemoryGuardVerdict = (input: {
  toolName: string;
  toolInput: { file_path: string | null; command: string | null };
  cwd: string | null;
}):
  | { verdict: 'allowed' }
  | { verdict: 'blocked'; path: string; act: MemoryGuardAct } => {
  // extract the candidate write path (null when not a relevant write)
  const touch = extractMemoryPathToCheck(input);

  // no memory touch found: allow
  if (!touch) return { verdict: 'allowed' };

  // a memory touch: block, and name the act that was graded
  // .note = an `unplaced` touch may name the `.claude/` root a var was set under,
  //         not a memory path; each grade above already decided it may reach memory
  return { verdict: 'blocked', path: touch.path, act: touch.act };
};
