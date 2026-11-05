/**
 * .what = the char budget of one review prompt, attributed to named inputs
 * .why = a spend figure says what a review cost, not what the prompt was
 *        made of — these rows say which input to cut. every char lands in
 *        exactly one row, so the rows sum to the prompt's length; `scaffold`
 *        carries that invariant so the total never disagrees with the sum
 *        of its parts (rule.forbid.failhide).
 *
 * .note = a domain object, so it sits in `domain.objects/Reviewer/` — both the meter and
 *         the grove render these rows, and neither owns them.
 *
 * .note = the row vocabulary lives apart from the re-parse transformer that fills it,
 *         so a reader that needs only the schema never imports the parser, and the
 *         parser can be retired without a rehome (rule.require.single-responsibility).
 *
 * .note = a COARSER projection of `PromptComposition.inputs`, never a peer of it.
 *         it exists because the re-parse lane (`asPromptSectionChars`) reads
 *         delimited blocks plus the two head markers, so it parts instructions and
 *         the output contract by name and leaves only markup as residual. the fine
 *         schema folds into this one through `SECTION_OF_INPUT`, a
 *         `Record<PromptInputName, keyof PromptSectionChars>`, so a new named input
 *         fails to compile until it names its row here.
 */
export interface PromptSectionChars {
  /** the review instructions — the head text ahead of the output contract */
  instructions: number;
  /** the output contract — from `MARKER_OF_OUTPUT_FORMAT` to the first block behind it */
  outputFormat: number;
  /** the rubric, as rendered — identical per lane, and the lane's own bytes */
  rules: number;
  /** reference docs, as rendered — identical per lane, and the lane's own bytes */
  refs: number;
  /** the prior peer dialogue — APPENDS every round */
  conversation: number;
  /** the full file bodies of EDITED files, carried as context around their mutations */
  targetFiles: number;
  /** the whole body of each file this branch ADDED — a net-new diff, rendered once */
  'targetDiffs.additions': number;
  /** the void marker of each file this branch DELETED — a diff with no body to send */
  'targetDiffs.deletions': number;
  /** the hunks of each file this branch EDITED — the delta against the range base */
  'targetDiffs.mutations': number;
  /**
   * the residual — genuine markup alone: section headers and xml tags
   *
   * .note = on an older layout whose head carries no markers, the re-parse lane
   *         cannot cut the head, so there instructions and the output contract
   *         still land here and both named rows read 0
   *
   * .note = a block under a tag no row names would also land here, so the reader
   *         hunts every gap for such a tag and grades the census `unattributed`
   *         where it finds one (`TAGS_OF_GAP_MARKUP`) — the residual sums exact,
   *         and it no longer vouches for what it absorbed
   */
  scaffold: number;
}

/**
 * .what = whether a row's bytes CAN ride a cross-round shared prefix — a fact about
 *         the row's POSITION in the wire order, never about the kind of input it is
 * .why = a section's share of the prompt is only half the answer. `rules` at 30%
 *        of a prompt costs almost naught when it is served from cache, where
 *        `targetDiffs` at 30% is re-paid at full rate every round. so the census
 *        marks which side of the first volatile byte each row sits on.
 *
 * .note = `instructions` and `outputFormat` lead the static head, identical for
 *         every lane of one goal, so both are cacheable.
 *
 * .note = `scaffold` is marked cacheable because its bulk — the target block's
 *         `---` separators and tags — sits in the head the lanes of a level share.
 *
 * 🔴 .note = `rules` and `refs` are `true`, and the claim is a PARTLY one. in a
 *         corpus-first prompt (what `compileReviewPrompt` emits) they trail the target
 *         corpus, so a round whose base moved or whose driver repaired a file parts the
 *         prefix ahead of them — but the partitions of a lane read them from one another
 *         within a round, and a round with a stable corpus reads them across rounds. in a
 *         rubric-first prompt on disk, they lead the corpus outright. one static table
 *         labels both layouts, so it holds the position each row CAN reach
 *         (`asPromptHead` states the trade)
 *
 * 🔴 .note = `targetFiles` is `true`, and it reads as a surprise. it is NOT a
 *         guarantee that every file body caches — a file the driver just repaired
 *         differs from last round and cannot. it is the position claim: an untouched
 *         body is byte-identical across rounds, `getAllTargetsByCacheStability`
 *         sorts the touched ones last, and `asTargetSection` now places the whole
 *         file group ahead of every diff. so the row CAN ride the prefix, and its
 *         chars are an upper bound on what it will.
 *
 *         it was `false` until 2026-10-01, which understated the bound badly — the
 *         realized grove rate (21.9%) beat the "most any cache could serve" figure
 *         derived from this table (6.2%) by ~3×, and that contradiction sat
 *         unexplained in the report for a full round of measurement.
 *
 * ⚠️ .note = a boolean cannot say "partly", and two of these rows are partly. where
 *         a finer answer is needed, read the realized `cache.get` against
 *         `prompt.sharedPrefix.chars` rather than this table.
 */
export const IS_CACHEABLE_SECTION: Record<keyof PromptSectionChars, boolean> = {
  instructions: true,
  outputFormat: true,
  // partly: they trail the corpus in today's layout (see the 🔴 note above)
  rules: true,
  refs: true,
  scaffold: true,
  targetFiles: true,
  // an addition's body is the file itself — base-independent, so it is as stable as
  // a file body, and it rides directly behind the file group
  'targetDiffs.additions': true,
  // a deletion is a void tag of a path alone — stable while the file stays deleted
  'targetDiffs.deletions': true,
  // a mutation's hunks shift whenever the range base moves, so it trails every row
  'targetDiffs.mutations': false,
  conversation: false,
};

/**
 * .what = the rank each census row prints at — the wire order, head to tail
 * .why = declared once, beside the union it ranks, so every breadth renders
 *        the same order rather than each with its own that could differ.
 *        the order is the order the bytes are sent: the head the lanes of a level
 *        share leads (instructions, outputFormat, scaffold, the target rows), then the
 *        lane's own tail (rules, refs, conversation).
 *
 * .note = per `asPromptHead`: byte 0 opens the instructions, which run to
 *         `MARKER_OF_OUTPUT_FORMAT`; the output contract runs to `MARKER_OF_TARGET`;
 *         the first `scaffold` byte is that marker's header line, `## target (REVIEW
 *         THIS SECTION ONLY)`, ahead of the `<target>` body. the `# review task` preamble
 *         is `instructions`, never scaffold. `scaffold` is spread through the prompt
 *         (headers and tags), so its rank is where its FIRST byte sits. the layout
 *         fixture (`genReviewPromptLayoutInput`) compiles to `## output format`, then
 *         `## target (…)`, then `## rules (…)`, in that order — read it there to check.
 *
 * .note = must stay a Record, never a hand-written array — a Record goes red
 *         when a seventh input joins `PromptSectionChars`; an array would
 *         compile while it silently drops the new row from every census
 *         (rule.require.distinguish-every-review-input).
 *
 * 🔴 .note = this table is a CLAIM ABOUT BYTES, and only bytes settle it. it drifted
 *         once: it carried `conversation` ahead of the two target rows while the
 *         composer had already placed the append-only conversation last, so every
 *         head/tail attribution built on it was wrong and no test went red. if you
 *         edit it, verify it against a shipped `input.prompt.md` — the section
 *         header offsets are the evidence
 *         (rule.require.order-prompt-sections-by-volatility-then-size).
 */
export const RANK_OF_SECTION: Record<keyof PromptSectionChars, number> = {
  instructions: 1,
  outputFormat: 2,
  scaffold: 3,
  targetFiles: 4,
  'targetDiffs.additions': 5,
  'targetDiffs.deletions': 6,
  'targetDiffs.mutations': 7,
  rules: 8,
  refs: 9,
  conversation: 10,
};

/**
 * .what = the order of census rows by their declared rank
 * .why = names the sort, so the row list states its order by name rather than by a
 *        closure to decode (rule.require.named-transformers)
 *
 * .note = declared above `ORDER_OF_SECTIONS`, since that list is built at module load
 */
const asSectionRankOrder = (input: {
  a: keyof PromptSectionChars;
  b: keyof PromptSectionChars;
}): number => RANK_OF_SECTION[input.a] - RANK_OF_SECTION[input.b];

/**
 * .what = the census row names, in print order
 * .why = walked once off the rank above rather than re-listed, so the rank stays the
 *        single place a new input must name itself
 *
 * .note = the `as` cast is the documented exception `rule.forbid.as-cast`
 *         permits: `Object.keys` is typed `(o: object) => string[]` on
 *         purpose, since a value may carry keys beyond its declared type, so
 *         TS cannot soundly narrow it. the true type is
 *         `Array<keyof PromptSectionChars>`, which `RANK_OF_SECTION`'s keys
 *         provably are — a literal `Record<keyof PromptSectionChars, number>`
 *         with no dynamic writes.
 */
export const ORDER_OF_SECTIONS = [
  ...(Object.keys(RANK_OF_SECTION) as Array<keyof PromptSectionChars>),
].sort((a, b) => asSectionRankOrder({ a, b }));
/**
 * .what = a census of all-zero rows, one per section, to accumulate onto
 * .why = declared once, beside the type it instances, and exported to every
 *        reader that folds onto it — a reader's own copy that misses a
 *        section a later build adds would silently read `undefined` there
 *        while others read `0`.
 *
 * .note = spread it, never mutate it — `{ ...SECTIONS_NIL }` per fold. frozen, like
 *         `CENSUS_NIL`, so the note is enforced rather than merely asked.
 */
export const SECTIONS_NIL: Readonly<PromptSectionChars> = Object.freeze({
  instructions: 0,
  outputFormat: 0,
  rules: 0,
  refs: 0,
  conversation: 0,
  targetFiles: 0,
  'targetDiffs.additions': 0,
  'targetDiffs.deletions': 0,
  'targetDiffs.mutations': 0,
  scaffold: 0,
});
