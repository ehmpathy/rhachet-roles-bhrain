import { MalfunctionError } from 'helpful-errors';

import { asPeerConversationFileParts } from '@src/domain.operations/asPeerConversationFileParts';
import {
  asPeerReviewOutputName,
  SEGMENTS_OF_PEER_REVIEWS_DIR,
} from '@src/domain.operations/asPeerReviewOutputName';

import { enumRouteFiles } from '../../artifact/enumRouteFiles';
import { asStoneGuardCounter } from '../../asStoneGuardCounter';
import { enumRouteGuardReviewPeerFiles } from './enumRouteGuardReviewPeerFiles';

/**
 * .what = enumerates the full peer-review conversation for a stone — every
 *         .given.by_peer (summary + detailed .report) + .taken.by_self across
 *         PRIOR generations
 * .why = ONE shared expander feeds both the guard $conversation var and the
 *        review --conversation flag, so the two paths cannot drift (R4)
 *
 * excludes the current {iteration, hash} generation when `exclude` is supplied,
 * so a later reviewer in the SAME guard run never sees an earlier reviewer's
 * brand-new, still-unanswered given (no .taken can exist for it yet).
 *
 * the .report.md files are ALWAYS part of the conversation: the summary
 * .given.by_peer.md holds only the verdict counts, while the paired .report.md
 * carries the DETAILED prior critique (locations + snippets + rule cites). a
 * reviewer must see its full prior critique to judge convergence, so the reports
 * are enumerated here directly — the gate enumerator keeps its own report
 * exclusion (it pairs given↔taken by the summary file), so the report inclusion
 * lives on THIS conversation path, not on the shared enumerator.
 *
 * 🔴 `slug` narrows the dialogue to ONE reviewer's own lane. without it, every lane
 *    reads every other lane's givens, reports, and takens from every round, so the
 *    conversation grows as lanes × rounds and is uncacheable (it sits in the tail).
 *    measured on a 20-lane guard at round 7: 387 files, 1.52M chars, 77% of a lane's
 *    prompt — and the lane timed out with 94k tokens of actual targets. a reviewer
 *    judges convergence on ITS OWN prior critique and the driver's answer to it.
 */
export const getAllRouteGuardReviewPeerConversationFiles = async (input: {
  route: string;
  stone: string;
  exclude?: { iteration: number; hash: string };
  slug?: string;
}): Promise<string[]> => {
  // union all three sides: given summaries, given detail reports, taken responses
  const [givens, reports, takens] = await Promise.all([
    enumRouteGuardReviewPeerFiles({
      route: input.route,
      stone: input.stone,
      kind: 'given',
    }),
    enumRouteFiles({
      route: input.route,
      // .why = composed by the one grammar the guard writes by, with each varied part
      //        a wildcard, so a rename of the grammar cannot leave this glob behind
      glob: `${SEGMENTS_OF_PEER_REVIEWS_DIR.join('/')}/${asPeerReviewOutputName(
        {
          parts: {
            stone: input.stone,
            iteration: '*',
            hash: '*',
            index: '*',
            slug: '*',
          },
          kind: 'report',
        },
      )}`,
    }),
    enumRouteGuardReviewPeerFiles({
      route: input.route,
      stone: input.stone,
      kind: 'taken',
    }),
  ]);
  // keep only the named reviewer's own dialogue, when a slug is supplied
  const filesOfLane = getAllPeerConversationFilesOfLane({
    files: [...givens, ...reports, ...takens],
    slug: input.slug ?? null,
  });

  // drop the entire current generation so only settled prior dialogue is seen
  const filesSettled = input.exclude
    ? getAllFilesOutsideGeneration({
        files: filesOfLane,
        iteration: input.exclude.iteration,
        hash: input.exclude.hash,
      })
    : filesOfLane;

  // a lane reads only its latest generations; the unscoped read keeps the whole record
  const filesRecent =
    input.slug === undefined
      ? filesSettled
      : getAllFilesOfLatestGenerations({
          files: filesSettled,
          depth: DEPTH_OF_LANE_CONVERSATION,
        });

  // order the dialogue as it was spoken
  return asConversationFilesOrdered({ files: filesRecent });
};

/**
 * .what = how many of a lane's own prior generations its reviewer reads
 * .why = the latest given carries every point still open, and the latest taken carries
 *        the driver's current answer to each — every older round is either settled or
 *        restated there. an unbounded dialogue grew to 171 files and 120k tokens (21.8%
 *        of one lane's prompt) by round 32, and its stale "repair absent" claims were
 *        re-raised verbatim against a target that held the repair. two generations keep
 *        the latest exchange plus the one before it, so a re-raise is still visible as one
 */
export const DEPTH_OF_LANE_CONVERSATION = 2;

/**
 * .what = the files of the latest `depth` generations, by iteration
 * .why = a generation is one `iNNN.hash` round; the zero-padded counter sorts lexically
 *        in numeric order, so the last keys of the sorted set are the latest rounds
 */
const getAllFilesOfLatestGenerations = (input: {
  files: string[];
  depth: number;
}): string[] => {
  const keysAll = [
    ...new Set(input.files.map((file) => asGenerationKey({ file }))),
  ].sort();
  const keysKept = new Set(keysAll.slice(-input.depth));
  return input.files.filter((file) => keysKept.has(asGenerationKey({ file })));
};

/**
 * .what = the parts of one conversation file, read by the declared conversation grammar
 * .why = every filter below keys on these parts, so the name is read one way, by the
 *        grammar the guard writes by — never re-parsed by hand
 */
const asConversationFilePartsOrThrow = (input: { file: string }) =>
  asPeerConversationFileParts({ file: input.file }) ??
  MalfunctionError.throw('peer review file lacks a generation infix', {
    file: input.file,
  });

/**
 * .what = the `iNNN.hash` generation of one peer review file
 * .why = the generation is the unit a depth counts in. the zero-padded iteration leads,
 *        so the key sorts in round order
 */
const asGenerationKey = (input: { file: string }): string => {
  const parts = asConversationFilePartsOrThrow(input);
  return `i${parts.iteration}.${parts.hash}`;
};

/**
 * .what = the conversation files in the order the dialogue was spoken
 * .why = a reviewer reads its prior rounds oldest first, each given before its answer
 *
 * .note = a plain lexical sort suffices: the i/r counters are zero-padded
 *         (asStoneGuardCounter), so lexical order equals numeric order — rounds stay
 *         round-major (i-segment), reviewers index-major (r-segment), and
 *         given → report → taken within each reviewer (the tail: given < taken, and
 *         .md < .report.md)
 */
const asConversationFilesOrdered = (input: { files: string[] }): string[] =>
  [...input.files].sort();

/**
 * .what = the files of one reviewer's lane, or every file when no slug is named
 * .why = a lane reads its own dialogue alone; the unscoped read serves callers that
 *        want the whole conversation
 */
const getAllPeerConversationFilesOfLane = (input: {
  files: string[];
  slug: string | null;
}): string[] => {
  const slug = input.slug;
  if (slug === null) return input.files;
  return input.files.filter((file) =>
    isPeerConversationFileOfSlug({ file, slug }),
  );
};

/**
 * .what = the files outside one generation — its iteration and artifact hash
 * .why = the current generation is still in flight, so only settled prior dialogue
 *        is handed to a reviewer
 */
const getAllFilesOutsideGeneration = (input: {
  files: string[];
  iteration: number;
  hash: string;
}): string[] => {
  const keyCurrent = `i${asStoneGuardCounter({ value: input.iteration })}.${input.hash}`;
  return input.files.filter((file) => asGenerationKey({ file }) !== keyCurrent);
};

/**
 * .what = whether a conversation file belongs to the named reviewer's lane
 * .why = the three files a lane owns — its given, its detailed report, and the
 *        driver's taken to it — all carry its slug as one declared part, so an exact
 *        match means `repo-rules` never matches `repo-rules-ops`
 */
const isPeerConversationFileOfSlug = (input: {
  file: string;
  slug: string;
}): boolean => asConversationFilePartsOrThrow(input).slug === input.slug;
