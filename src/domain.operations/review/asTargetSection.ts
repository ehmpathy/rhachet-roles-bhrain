import { asTargetDiffBody } from './asTargetDiffBody';
import { isTargetDiffSent } from './isTargetDiffSent';
import { isTargetFileSent } from './isTargetFileSent';
import { isTargetPayloadSent } from './isTargetPayloadSent';

/**
 * .what = one target file, as the prompt carries it
 * .why = declared once rather than inline at three signatures — the shape is the
 *        contract between the scope walk, this renderer, and the census, so a
 *        field added to one must be added to a name rather than to three literals
 */
export interface ReviewTarget {
  path: string;
  content: string | null;
  diff?: string | null;
  changeKind?: 'new' | 'edited' | 'deleted';
}

/**
 * .what = the separator between two adjacent target blocks
 * .why = named once because three joins use it — the file group, the diff group,
 *        and the seam between the groups. a literal at three sites would let one
 *        drift, and every byte here is pinned by snapshot
 */
const SEPARATOR_OF_BLOCKS = '\n\n---\n\n';

/**
 * .what = one EDITED target's full file body, as its own block — the context
 *         around its mutation
 * .why = the STABLE half of an edited target. a file body changes only when that
 *        file is touched, so every untouched body is byte-identical to the prior
 *        round and can ride a shared prefix — but only where no volatile byte sits
 *        ahead of it (rule.require.order-prompt-sections-by-volatility-then-size).
 *
 * .note = an added or deleted file has no block here. each IS its diff on this
 *         branch, so each renders once, in the diff group (`renderTargetDiff`).
 */
const renderTargetFile = (input: { target: ReviewTarget }): string => {
  // drop one final newline so the close tag sits flush on the next line
  const fileBody = (input.target.content ?? '').replace(/\n$/, '');
  return `<target.file path="${input.target.path}">\n${fileBody}\n</target.file>`;
};

/**
 * .what = the one-glyph `kind` each diff carries — `+` added, `-` deleted, `~` edited
 * .why = the attribute repeats on every diff of every round, so a glyph rather than a
 *        word is paid once per target and saves the difference without bound. the
 *        three glyphs read as git's own marks for the three kinds of change
 */
const KIND_OF_DIFF: Record<'new' | 'deleted' | 'edited', '+' | '-' | '~'> = {
  new: '+',
  deleted: '-',
  edited: '~',
};

/**
 * .what = one target's diff, as its own block — an addition, a deletion, or a mutation
 * .why = every change on this branch is a diff, so each renders as one, labeled by
 *        its `kind`, and the census parts the three by that label:
 *        - an ADDITION (`kind="+"`) is the whole body. git's own form prefixes every
 *          line with `+` under a preamble — the body plus a char per line, and not
 *          one byte the body lacks
 *        - a DELETION (`kind="-"`) is a void tag of the path. no removed body is sent
 *        - a MUTATION (`kind="~"`) is the hunks against the range base
 *
 * .note = callers must gate this on `isTargetDiffSent`; it is not re-checked here.
 *         a diff measured but not rendered inflates a `targetDiffs.*` census row
 *         and drives `markup` (the residual) negative, with every row still summed
 *         to `chars`, so no assertion would catch it.
 */
const renderTargetDiff = (input: { target: ReviewTarget }): string => {
  const { target } = input;
  const kind = KIND_OF_DIFF[target.changeKind ?? 'edited'];

  // a deletion: a lone void tag — the path is the whole of what changed
  if (target.changeKind === 'deleted')
    return `<target.diff path="${target.path}" kind="${kind}" />`;

  // an addition sends its body; a mutation its hunks. drop one final newline so
  // the close tag sits flush on the next line
  const body = asTargetDiffBody({ target });
  return `<target.diff path="${target.path}" kind="${kind}">\n${body.replace(/\n$/, '')}\n</target.diff>`;
};

/**
 * .what = the rank each change kind takes within the diff group
 * .why = additions lead: an added file's body is base-independent, so it is as
 *        stable as a file body and rides the shared prefix right behind the file
 *        group. deletions follow, a path apiece. mutations trail, since their hunk
 *        lines shift whenever the range base moves
 *        (rule.require.order-prompt-sections-by-volatility-then-size)
 */
const RANK_OF_DIFF_KIND: Record<'new' | 'deleted' | 'edited', number> = {
  new: 0,
  deleted: 1,
  edited: 2,
};

/**
 * .what = the PULL-focus target block — a path list, plus the diff range to run
 * .why = in pull focus the brain has tool use, so it opens each file and runs
 *        `git diff` itself. we send neither diff nor content, just the paths and
 *        the base to compare against.
 *
 * .note = every char it emits lands in the `targetPaths` census row, never in
 *         `markup`. on a large corpus the path list can be the majority of
 *         the prompt, so it needs its own row rather than a place in the
 *         residual.
 *
 * .note = the returned string's bytes are prompt content, so they are pinned by
 *         snapshot and they lead the cacheable tail. do not reword them for prose
 *         style; a byte changed here voids the shared prefix of every pull lane
 *         (rule.require.name-the-shared-prefix-as-the-cache-anchor). the one
 *         gerund in its copy is load-bearing for that reason.
 */
const asPullTargetSection = (input: {
  targets: ReviewTarget[];
  diffRange?: string;
}): string => {
  const pathList = input.targets.map((t) => `- ${t.path}`).join('\n');
  const rangeNote = input.diffRange
    ? `\n\nthe diff range for "this pr" is \`${input.diffRange}\` — run \`git diff\` against that base to see what changed.`
    : '';
  return `the following files are in scope for review. please open and read them as needed:\n\n${pathList}${rangeNote}`;
};

/**
 * .what = the whole target block of the review prompt, for either focus
 * .why = `compileReviewPrompt` is the canonical orchestrator, so it must read
 *        as narrative rather than simulate two map/join pipelines inside an
 *        IIFE (rule.forbid.inline-decode-friction,
 *        rule.require.narrative-flow). a reader there learns what the block
 *        is from one name, and comes here only when they need how.
 *
 * 🔴 .why the two groups are NOT interleaved per target — it buys INVARIANCE to
 *     diff volatility, never a bigger prefix in every case. the margin is a
 *     HEDGE, and it was measured both ways over 12 targets with 1 repaired per
 *     round (`reviewPromptCacheAnatomy` `[case6]`):
 *
 *     | scenario | this layout | a per-target `{diff, file}` pair |
 *     |---|---|---|
 *     | the diff base HELD | 23,274 · 76.8% | 24,759 · **81.9%** |
 *     | the diff base MOVED | **23,274 · 76.8%** | 13,170 · 43.6% |
 *
 *     so the interleave WINS by 5.1pp where every diff is stable — it carries
 *     each untouched diff ahead of the point where the prefix parts, and this
 *     layout carries none. it LOSES by 33.2pp the moment the range base moves,
 *     because one perturbed diff at pair 0 voids all 12 bodies behind it.
 *
 *     the figure that settles it is that this layout's share is the SAME in both
 *     rows: its prefix is bounded by the first changed body and no diff sits
 *     ahead of it, so diff churn cannot touch it. break-even is a ~13% chance
 *     the base moves between two rounds; `since-main` moves whenever any other
 *     PR merges, and a diff's `@@` line numbers shift whenever a file above it
 *     changes — both far above 13%
 *     (rule.require.order-prompt-sections-by-volatility-then-size).
 *
 * 🔴 .note = do NOT restate this as "a small volatile section voids a large
 *     stable one" unconditionally. that wording was authored here from the
 *     census shares alone (`targetDiffs` 5.7%, `targetFiles` 87.6%) and the
 *     measurement refuted it — under a perfect stability sort the interleave is
 *     ahead. the claim is invariance, and only `[case6]` settles it.
 *
 * .note = the cost is an attention one, and it is deliberate: the reviewer no
 *         longer reads a file's delta adjacent to that file. the deltas arrive
 *         last instead, which is the most recent position in context, and the
 *         `## how to use the diff (FOCUS ON THE DELTA)` instruction in the static
 *         head is what keeps the delta primary.
 *
 * .note = within the file group the order is `targets`' own, which
 *         `getAllTargetsByCacheStability` sorted upstream so repaired files sort
 *         last. that sort is what makes the lead worth it, and a reorder here
 *         would void it.
 *
 * .note = the focus split is `isTargetPayloadSent`, never an inline
 *         `focus === 'pull'`. the census must zero exactly the two rows this
 *         branch declines to render, so the two read one decision.
 *
 * 🔴 .why `shared` splits the section into two BANDS before the kind groups — the
 *     body-then-diff order is a volatility order, and volatility is key 2. reuse
 *     BREADTH is key 1 (`rule.require.order-prompt-bytes-by-reuse-breadth`): on a
 *     partition run, the targets every partition carries must lead every prompt
 *     byte for byte, or the prime writes a prefix no partition reads. one kind
 *     group over the whole list put each partition's OWN edited bodies ahead of
 *     the shared route files (they render as additions, in the diff group), so
 *     the prefix parted at the first narrow byte.
 *
 *     measured 2026-10-12, `5.3.verification i004`, partition `14.cli`: 75k chars
 *     of its own bodies led 1.07M chars of shared route, and the run cached 0.3%
 *     (rule.forbid.shared-bytes-behind-narrow-bytes).
 *
 *     ⇒ so the shared band renders first, kind groups within it, then the narrow
 *     band, kind groups within it. a whole run has no shared band, so its bytes
 *     are unchanged.
 */
export const asTargetSection = (input: {
  targets: ReviewTarget[];
  focus: 'pull' | 'push';
  diffRange?: string;
  /** the paths every partition of a split carries; absent on a whole run */
  shared?: string[];
}): string => {
  if (!isTargetPayloadSent({ focus: input.focus }))
    return asPullTargetSection({
      targets: input.targets,
      diffRange: input.diffRange,
    });

  // push focus: the shared band leads, then this run's own band — each in kind groups
  const shared = new Set(input.shared ?? []);
  const bands = [
    input.targets.filter((target) => shared.has(target.path)),
    input.targets.filter((target) => !shared.has(target.path)),
  ];
  return bands
    .flatMap((band) => asTargetBlocksOfBand({ targets: band }))
    .join(SEPARATOR_OF_BLOCKS);
};

/**
 * .what = one band's blocks — every edited file's stable body, then every diff,
 *         additions then deletions then mutations
 * .why = the volatility order, applied within one breadth band (see `asTargetSection`).
 *        a stable sort keeps the upstream cache-stability order within each kind
 */
const asTargetBlocksOfBand = (input: { targets: ReviewTarget[] }): string[] => {
  // every edited file's body, in the upstream order
  const fileBlocks = input.targets
    .filter((target) => isTargetFileSent({ target }))
    .map((target) => renderTargetFile({ target }));

  // every diff, by kind — clone before the sort, so no list but this copy can change
  const diffBlocks = [
    ...input.targets.filter((target) => isTargetDiffSent({ target })),
  ]
    .sort((a, b) => asDiffKindOrder({ a, b }))
    .map((target) => renderTargetDiff({ target }));

  return [...fileBlocks, ...diffBlocks];
};

/**
 * .what = the order of diff targets by their change kind's rank
 * .why = names the sort, so the section states its order by name rather than by a
 *        closure to decode (rule.require.named-transformers). a target with no kind
 *        ranks as `edited`
 */
const asDiffKindOrder = (input: { a: ReviewTarget; b: ReviewTarget }): number =>
  RANK_OF_DIFF_KIND[input.a.changeKind ?? 'edited'] -
  RANK_OF_DIFF_KIND[input.b.changeKind ?? 'edited'];
