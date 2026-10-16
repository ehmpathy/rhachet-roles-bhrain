/**
 * .what = the two path segments every peer review artifact is written under
 *
 * .why = the route is a review's output path's grandparent, and that is the ONLY
 *        place the route that drove a review survives into the log corpus. so the
 *        two segments are a read-side anchor as much as a write-side join, declared
 *        once, here.
 */
export const SEGMENTS_OF_PEER_REVIEWS_DIR = ['.reviews', 'peer'] as const;

/**
 * .what = the parts of a peer review artifact's filename
 * .why = the shape the grammar below composes and decomposes, named once so the
 *        write side and the read side cannot disagree about what a name carries.
 *
 * .note = reused in 3 modules: the composer's input (`asPeerReviewOutputName`), the
 *         parser's output (`asPeerReviewOutputParts`), and the round-trip test's typed
 *         fixtures (`asPeerReviewOutputName.test.ts`). the first two are a round trip,
 *         so an inline copy on each could drift with naught red (fulcrum F16)
 */
export interface PeerReviewOutputParts {
  /** the stone whose guard ran this review (e.g. `5.1.execution.from_vision`) */
  stone: string;
  /** the guard iteration — the driver's round count for this stone */
  iteration: string;
  /** the artifact hash the guard reviewed at this round */
  hash: string;
  /** the reviewer's index within the guard's declared order */
  index: string;
  /** the reviewer's slug, already sanitized (e.g. `repo-rules`) */
  slug: string;
}

/**
 * .what = the regex source of the head every peer review filename opens with — the stone,
 *         the round, the hash, and the reviewer's index
 * .why = the report grammar and the conversation grammar both open on it, so it is
 *        declared once and the two cannot disagree about a generation
 */
const SOURCE_OF_PEER_REVIEW_HEAD =
  '(?<stone>.+)\\._\\.review\\.i(?<iteration>\\d+)\\.(?<hash>[^.]+)\\.r(?<index>\\d+)';

/**
 * .what = the ONE grammar a peer review artifact's filename is written and read by
 *
 * .why = 🔴 this grammar had TWO encodings. the write side composed it inline in
 *        `runOneStoneGuardReview`; the read side re-encoded it as a regex in the
 *        review context's `asReviewRunIdentity`. two contexts, one contract, and no
 *        compile-time link between them — so a rename on the write side would lose
 *        attribution in every by-reviewer report with naught red
 *        (rule.forbid.scope-leaks).
 *
 *        ⇒ the grammar lives at the `domain.operations/` root, the true common
 *        ancestor of its two readers (a peer subdomain such as `review.peer/` reads
 *        as one side's internals): the route guard writes by it, the review meter reads by it, and
 *        neither reaches into the other (rule.prefer.most-common-denominator). the
 *        parser (`asPeerReviewOutputParts`) imports it rather than re-derives it, and
 *        the round-trip clamp beside this file turns red the moment the halves part.
 *
 * .note = 🟡 `stone` is greedy-matched because stone names carry dots
 *         (`5.1.execution.from_vision`); the `._.review.i` literal is the anchor that
 *         parts the stone from the round. `slug` likewise may carry dots, so it
 *         anchors on its tail.
 */
export const GRAMMAR_OF_PEER_REVIEW_OUTPUT = new RegExp(
  `^${SOURCE_OF_PEER_REVIEW_HEAD}\\._\\.given\\.by_peer\\.(?<slug>.+)\\.report\\.md$`,
);

/**
 * .what = the grammar of every file a reviewer's conversation is read from — a given, its
 *         detailed report, or the driver's taken to it
 * .why = the conversation expander keys generations and lanes off these names. it once
 *        re-parsed them three ways by hand, none tied to the grammar the guard writes by,
 *        so a rename here would have left a lane read no prior dialogue with naught red.
 *        it shares its head with `GRAMMAR_OF_PEER_REVIEW_OUTPUT` (`SOURCE_OF_PEER_REVIEW_HEAD`),
 *        so the two cannot part
 *
 * .note = `slug` is lazy so a `.report.md` tail is read as the report, never folded into
 *         the slug
 */
export const GRAMMAR_OF_PEER_CONVERSATION_FILE = new RegExp(
  `^${SOURCE_OF_PEER_REVIEW_HEAD}\\._\\.(?<side>given\\.by_peer|taken\\.by_self)\\.(?<slug>.+?)(?<report>\\.report)?\\.md$`,
);

/**
 * .what = the filename tail of each peer review output kind
 */
const TAIL_BY_KIND = {
  stdout: '.md',
  report: '.report.md',
  targets: '.targets.txt',
} as const;

/**
 * .what = composes the filename of one peer review artifact
 *
 * .note = three kinds share one grammar and part only on their tail — `stdout` is what
 *         the guard writes, `report` is what the review skill writes, `targets` is the
 *         computed review target list the guard hands a lane via `$targets`. the
 *         symmetry is deliberate, so a reader who holds one can name the others.
 *
 * .note = the `targets` tail is `.txt`, never `.md`, so no `*.md` given/taken
 *         enumerator ever counts it as a review artifact.
 *
 * .note = 🔴 only the `report` kind is PARSEABLE by `asPeerReviewOutputParts`,
 *         because `--output` points at the report. that asymmetry is stated rather
 *         than hidden: a caller who parses a `stdout` name gets null, correctly.
 */
export const asPeerReviewOutputName = (input: {
  parts: PeerReviewOutputParts;
  kind: 'stdout' | 'report' | 'targets';
}): string => {
  const { stone, iteration, hash, index, slug } = input.parts;
  const tail = TAIL_BY_KIND[input.kind];
  return `${stone}._.review.i${iteration}.${hash}.r${index}._.given.by_peer.${slug}${tail}`;
};
