import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';

/**
 * .what = parses the {slug, iteration} pair out of a peer-review file path
 * .why = the contemplation gate picks the LATEST given per slug by iteration, and both
 *        facts live only in the filename grammar, so one parser reads them
 *
 * 🔴 .note = the hash segment is MATCHED and VALIDATED below, and deliberately NOT
 *         returned. the gate does not pair a .given to its .taken by (slug, hash) — it
 *         pairs them by the DERIVED PATH (getRouteGuardReviewPeerPathTaken). a .taken
 *         write does not move the artifact hash, so one reviewer's successive givens
 *         routinely share a hash; (slug, hash) would hand a fresh critique the prior
 *         iteration's answer (r8 blocker.1, i002).
 *
 * ⚠️ both data objects downstream already refuse a `hash` field, each with a note that the
 *    absence is the guard (RouteGuardReviewPeerGiven, RouteGuardReviewPeerTakenMeta —
 *    r11 blocker.1, i003). this parser is one hop UPSTREAM of both, and to return the
 *    field here left it within reach of the next author who wants a key: the two halves
 *    refuse it, and the source they both parse from offered it (r11 blocker.2, i004).
 *    the raw hash stays legible from `pathGiven`/`pathTaken` for any reader who genuinely
 *    needs it, so no capability is lost — only the invitation.
 *
 * grammar (given OR taken):
 *   $stone._.review.i$iter.$hash.r$index._.given.by_peer.$slug.md
 *   $stone._.review.i$iter.$hash.r$index._.taken.by_self.$slug.md
 */
export const getRouteGuardReviewPeerPathMeta = (input: {
  path: string;
}): { slug: string; iteration: number } => {
  const name = path.basename(input.path);

  // iteration + hash = the i$iter segment and the dot-free segment after it
  // .note = the iteration is zero-padded on disk (asStoneGuardCounter); parseInt
  //         reads it as a number so callers compare ordinals, never strings
  // .note = group 2 (the hash) is captured so the grammar check below can REQUIRE it.
  //         it is never returned — see the ⚠️ above
  const stampMatch = name.match(/\.i(\d+)\.([^.]+)\.r\d+\./);

  // slug = the text after the given|taken infix, up to the .md suffix
  const slugMatch = name.match(
    /_\.(?:given\.by_peer|taken\.by_self)\.(.+)\.md$/,
  );

  // 🔴 name the fix, not just the symptom. this throw is reachable by a HUMAN typo:
  //    the driver hand-writes .taken filenames, and the enumerator's glob wildcards
  //    (i*, r*) admit a stamp this parser then refuses. under P2 the gate reads every
  //    historical file, so one bad name halts the entrance gate, the exit gate, and
  //    the stophook alike — and a bare "could not parse" strands the driver with no
  //    move (rule.require.errors-name-the-fix; r7 nitpick.1, i002)
  if (!stampMatch?.[1] || !stampMatch?.[2] || !slugMatch?.[1])
    UnexpectedCodePathError.throw(
      [
        'could not parse a peer-review filename, so the contemplation gate cannot run.',
        '',
        `  file: ${input.path}`,
        '',
        '  why: every .given/.taken filename must carry the stamp grammar —',
        '       $stone._.review.i$iter.$hash.r$index._.given.by_peer.$slug.md',
        '       $stone._.review.i$iter.$hash.r$index._.taken.by_self.$slug.md',
        '       $iter and $index must be digits, and $hash must hold no dot.',
        '',
        '  fix: if you hand-wrote this file, rename it to the exact path the halt',
        '       printed under "articulate into" — do not retype it. if it is a stray',
        '       or legacy file, move it out of .reviews/peer/.',
      ].join('\n'),
      { path: input.path },
    );

  return {
    iteration: parseInt(stampMatch[1], 10),
    slug: slugMatch[1],
  };
};
