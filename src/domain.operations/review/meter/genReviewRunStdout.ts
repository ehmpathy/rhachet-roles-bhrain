import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import { asCountHuman } from '@src/domain.operations/review/asCountHuman';
import { asPromptSectionRows } from '@src/domain.operations/review/asPromptSectionRows';
import { asRateHuman } from '@src/domain.operations/review/asRateHuman';
import type { TargetInputName } from '@src/domain.operations/review/asTargetContentsByInput';
import { getOneCacheHitRate } from '@src/domain.operations/review/getOneCacheHitRate';
import { MINUTES_OF_CACHE_REACH } from '@src/domain.operations/review/MINUTES_OF_CACHE_REACH';
import { asCostColumnHuman } from '@src/domain.operations/review/meter/asCostColumnHuman';
import { asCostLeverLines } from '@src/domain.operations/review/meter/asCostLeverLines';
import {
  asFigureHuman,
  MARK_OF_ABSENT,
} from '@src/domain.operations/review/meter/asFigureHuman';
import { asPrefixPairLines } from '@src/domain.operations/review/meter/asPrefixPairLines';
import {
  asTargetLocusLines,
  LABEL_OF_LOCUS,
  LIMIT_OF_LOCUS_ROWS,
} from '@src/domain.operations/review/meter/asTargetLocusLines';
import { asTargetLocusLinesByInput } from '@src/domain.operations/review/meter/asTargetLocusLinesByInput';
import { asTokenRowLines } from '@src/domain.operations/review/meter/asTokenRowLines';
import { getOneCostLeverFigures } from '@src/domain.operations/review/meter/getOneCostLeverFigures';
import { getOneLocusChars } from '@src/domain.operations/review/meter/getOneLocusChars';
import { getOneLocusCharsTotal } from '@src/domain.operations/review/meter/getOneLocusCharsTotal';
import type { TargetSplitOfRun } from '@src/domain.operations/review/meter/getOneTargetSplitOfRun';
import type { ReviewPrefixPair } from '@src/domain.operations/review/meter/ReviewPrefixPair';
import { SLUG_OF_ABSENT_IDENTITY } from '@src/domain.operations/review/SLUG_OF_ABSENT_IDENTITY';
import { asCountedNoun } from '@src/utils/asCountedNoun';

/**
 * .what = the identity a run renders under — its guard lane, or why it has none
 * .why = `identity: null` has two causes, and they are not alike. a hand or
 *        `review.by` run is a legitimate, expected state; a run whose artifacts
 *        could not be parsed is a defect, and its identity is absent because
 *        the read failed rather than because no guard minted it. to render the
 *        normal-case text over a corrupt run reports "all is well" at the one
 *        moment a defect is present (rule.forbid.failhide)
 */
const asRunIdentityLine = (input: { run: ReviewRunMeter }): string => {
  const { run } = input;
  if (run.identity)
    return `${run.identity.slug} · ${run.identity.stone} · i${run.identity.iteration}`;
  // `UNPARSED`, never `UNREAD` — the identity is parsed out of the run's
  // artifacts, so its absence on a defect is a parse that failed. `UNREAD` names
  // an artifact the composition row could not read; two states under
  // one word is the re-read `rule.forbid.ambiguous-labels` exists to prevent
  if (run.defect !== null)
    return `${MARK_OF_ABSENT}  🟡 UNPARSED — see the defect below`;
  // the one name every surface files an identity-less run under
  return SLUG_OF_ABSENT_IDENTITY;
};

/**
 * .what = the four token rows, or the one row that says why there are none
 * .why = the cache.set caveat is the last nil on this surface with no grade
 *        beside it. every brain we have metered bills `cache.set = 0` while
 *        it serves cache reads, so the figure looks like a term that never
 *        fires — and the misread is expensive since it sits upstream of a
 *        repair: a reader who takes it for unmeasured will propose to drop
 *        the term from `getOneCacheHitRate`'s denominator, which would
 *        silently overstate the rate for any brain that does bill a cache
 *        write. the zero is measured — the read side throws where the field
 *        is absent rather than coerce it — so the surface says so
 *        (rule.forbid.failhide).
 *
 * .note = the caveat rides only where a cache demonstrably served this run.
 *         a zero beside a zero is an unremarkable cold run, and a word there
 *         would grade what needs none.
 */
const asRunTokenLines = (input: { run: ReviewRunMeter }): string[] => {
  const { tokens, grade } = input.run;
  if (!tokens) return [`   │  └─ ${MARK_OF_ABSENT} (grade = ${grade})`];
  const caveatOfCacheSet =
    tokens.cacheSet === 0 && tokens.cacheGet > 0
      ? '  (a MEASURED zero — this run was charged no cache WRITE, and read one anyway)'
      : '';
  return asTokenRowLines({
    prefix: '   │  ',
    figures: {
      input: asFigureHuman({ of: tokens.input }),
      cacheSet: `${asFigureHuman({ of: tokens.cacheSet })}${caveatOfCacheSet}`,
      cacheGet: asFigureHuman({ of: tokens.cacheGet }),
      output: asFigureHuman({ of: tokens.output }),
    },
  });
};

/**
 * .what = the review's own spend, graded
 * .why = the grade decides how the spend renders, and the two nil cases are
 *        not alike. a refusal proves nil spend, so it reads $0; an unknown
 *        run's spend is merely unrecorded, so it reads absent. to flatten
 *        them is the misread the grade exists to prevent (rule.forbid.failhide)
 */
const asRunCostLine = (input: { run: ReviewRunMeter }): string => {
  const { run } = input;
  // one render for a spend at every breadth — the tree and grove columns read it too
  if (run.cost) return asCostColumnHuman({ cost: run.cost.total });
  if (run.grade === 'refused')
    return '$0  (refused at validation — nil cost is a FACT)';
  // the grade word itself, `unknown` — never a synonym of it on a published surface
  //    (asUnknownCaveat, rule.forbid.domain-term-synonyms)
  return `${MARK_OF_ABSENT}  🟡 unknown, not $0 — the brain may have charged`;
};

/**
 * .what = the two cost levers for this one run — input size, and cache rate
 * .why = this breadth rendered FOUR token rows and no rate at all, so a reader
 *        could see how much was sent and not what share of it repeated — one
 *        lever present, the other absent, at the only breadth that can name the
 *        run that spent it. a breadth that omits a stat its peer breadth carries
 *        is the defect stated outright, and it is invisible from inside that
 *        breadth (rule.require.report-both-cost-levers-with-trend-and-locus).
 *
 * 🔴 .note = no trend, and the absence is a fact rather than a gap. a trend needs
 *     two samples on a time axis and a run is one sample, so a `→ flat` here
 *     would be a claim about a change nobody observed. the reader who wants the
 *     move is pointed at `--of tree`, which holds the rounds — on every run, in
 *     the lever header, so the breadth never omits the stat its peers carry
 *     without a word on where it lives.
 *
 * 🔴 .note = and no cold/warm grade, for a sharper reason: `getOneCacheGrade`
 *     reads a lane's ordinals across its peer runs, and this breadth reads one
 *     dir. so a `0.0%` here cannot be parted into "its lane's first, and there was
 *     no cache to hit" from "its lane's sixth, and it missed one" — and to pick
 *     either from an absence is the guess `rule.forbid.failhide` refuses. the row
 *     says the grade is out of this breadth's reach and names the breadth that
 *     holds it, rather than quietly grade it (rule.require.errors-name-the-fix ·
 *     hazard.a-status-read-cannot-report-absence).
 */
// where a run's move lives, since a run cannot carry one
const TREND_OF_RUN_BREADTH =
  'one run is one sample — its rounds are at rhx review._.cost --of tree';

/**
 * .what = the two lever figures of a run whose grade carries no tokens — `refused` or `unknown`
 * .why = the two nil grades are opposite claims: `refused` proves no prompt was sent,
 *        while `unknown` may have been charged. each reads as itself
 *
 * .note = named for the nil GRADE, never `unmetered` — `unknown` is the declared word for
 *         that grade at every breadth (`asGradesWord`), so the name must not restate it
 */
const asRunLeverFiguresOfNilGrade = (input: {
  grade: ReviewRunMeter['grade'];
}): { figures: { input: string; cache: string }; footnote: string | null } => {
  if (input.grade === 'refused')
    return {
      figures: {
        input: '0  (refused at validation — no prompt was sent)',
        cache: `${MARK_OF_ABSENT}  (refused — no prompt, so no rate)`,
      },
      footnote: null,
    };
  // each lever reads a bare mark, and the block says what the mark means once — the
  // grade label rides the key, since it parts this nil from a `refused` one
  return {
    figures: { input: MARK_OF_ABSENT, cache: MARK_OF_ABSENT },
    footnote: `${MARK_OF_ABSENT} = unmeasured, not zero (grade = ${input.grade})`,
  };
};

const asRunLeverLines = (input: { run: ReviewRunMeter }): string[] => {
  const { tokens, grade } = input.run;

  // a run with no tokens has no figure for either lever. `unknown` renders ABSENT and
  // never `0`, and the same law binds a lever as binds the cost row above. a
  // `refused` run sent no prompt at all, so its nil is a FACT and reads as one —
  // "unknown" beside `grade = refused` would contradict itself
  if (!tokens)
    return asCostLeverLines({
      layout: 'branch',
      prefix: '   ',
      trendElsewhere: TREND_OF_RUN_BREADTH,
      ...asRunLeverFiguresOfNilGrade({ grade }),
    });

  const cacheHitRate = getOneCacheHitRate({ tokens });
  // the caveat rides the figure it qualifies, exactly as the tree's cold/warm
  // marker does — one place to read a rate and its qualification. it names all
  // three causes a zero can have, since the tree grade parts all three
  // (`getOneCacheGrade`)
  const caveatOfGrade =
    cacheHitRate === 0
      ? `  🟡 a cold first run, a prefix past the ${MINUTES_OF_CACHE_REACH}-minute reach, and a warm miss read alike here — grade it with: rhx review._.cost --of tree --trace`
      : '';

  const levers = getOneCostLeverFigures({
    // one run, so the per-run divisor is one and the figure is this run's own
    corpus: { metered: 1, tokens, cacheHitRate },
    absent: MARK_OF_ABSENT,
  });

  return asCostLeverLines({
    layout: 'branch',
    prefix: '   ',
    trendElsewhere: TREND_OF_RUN_BREADTH,
    figures: {
      input: levers.figures.input,
      cache: `${levers.figures.cache} of prompt tokens served from cache`,
    },
    caveats: { cache: caveatOfGrade },
  });
};

/**
 * .what = the LOCUS — which directories the target mass actually came from
 * .why = the census one block down names the KIND of input that bought the prompt.
 *        it cannot name the PLACE, so `targetFiles is 87.6% of 1.0M chars` is true
 *        and prunable by nobody: it cannot part mass a lane needs from mass a glob
 *        swept in. a reader who wants to cut scope needs a directory, and the
 *        rollup that first answered this question was written BY HAND — which is
 *        the tell that the tool owed it
 *        (rule.require.report-both-cost-levers-with-trend-and-locus).
 *
 * 🔴 .note = three states, rendered as three. `null` is UNREAD and names the reason
 *     plus the next move; `[]` is a FACT about a pull-focus prompt, which sends a
 *     path list and no payload; a non-empty rollup is the answer. to render `[]` for
 *     an unread locus would report "no directory carried mass" for a run whose
 *     directories were never recorded (rule.forbid.failhide ·
 *     hazard.a-status-read-cannot-report-absence).
 *
 * .note = the share is of the TARGET mass, never of the whole prompt. the question
 *         is "which of my targets is big", and a share of the prompt would answer a
 *         different one — a reader who weighs these rows against the `targetFiles`
 *         census row would find they refuse to sum.
 */
const asRunLocusLines = (input: {
  prompt: ReviewRunMeter['prompt'];
  limit: number;
}): string[] => {
  const { prompt } = input;
  if (prompt === null) return [];

  if (prompt.locus === null)
    return [
      `   ├─ ${LABEL_OF_LOCUS} — not recorded`,
      `   │  └─ 🟡 UNREAD — no directory can be named. metrics.compiled.json carries no`,
      `   │     locus row (the run predates it), and input.prompt.md, the one other`,
      `   │     artifact that names each target's path, could not be read. look for`,
      `   │     both in the \`run:\` dir above — no flag of this command will help`,
    ];

  if (prompt.locus.length === 0)
    return [
      `   ├─ ${LABEL_OF_LOCUS} — no per-target mass to place`,
      `   │  └─ this prompt sent a path LIST and no payload (--focus pull), so its`,
      `   │     targets carry no chars of their own to attribute`,
    ];

  // the measured answer — one render shared with the tree and grove breadths
  return asTargetLocusLines({
    targets: prompt.locus,
    limit: input.limit,
    head: '   ├─ ',
    gutter: '   │  ',
    suffix: '',
    figure: asFigureHuman,
    absent: MARK_OF_ABSENT,
    detail: null,
  });
};

/**
 * .what = what each named target input carries, and the lever that shrinks it
 * .why = the row names the lever beside the mass, so the reader need not recall which
 *        lever reaches which input
 *
 * .note = a row names only a lever a reader can pull today. a mutation is NOT
 *         small by nature: `since-main` hunks over many edited files measured
 *         1.1M chars (17%) on this repo's own overflowed lane, so the row states
 *         no size claim, only the lever
 */
const LEVER_OF_TARGET_INPUT: Record<TargetInputName, string> = {
  targetFiles: 'edited file bodies — a narrower bind shrinks it',
  'targetDiffs.additions':
    'added file bodies — a narrower bind or a partition shrinks it',
  'targetDiffs.deletions': 'a path apiece — never the cause of an overflow',
  'targetDiffs.mutations': 'hunks of edited files — a narrower bind shrinks it',
};

/**
 * .what = a run's target mass split into its named inputs — edited bodies
 *         (`targetFiles`), and the additions, deletions, and mutations of `targetDiffs`
 *         — each with its own directory rows
 * .why = the split decides the lever. an edited body falls to a narrower file radius;
 *        an addition does not, since its diff IS its body, and needs an outline or a
 *        partition. a run that compiled no prompt has no census to read it from, so it
 *        is re-derived — and labeled as such, since the worktree it reads may have
 *        moved since the run
 */
const asRunSplitLines = (input: {
  split: TargetSplitOfRun | null;
}): string[] => {
  if (input.split === null) return [];
  const { split } = input;
  const charsOf = (name: TargetInputName) =>
    getOneLocusChars({ rows: split.locus[name] });
  const charsOfAll = getOneLocusCharsTotal({ locus: split.locus });
  const charsOfDiffs = charsOfAll - charsOf('targetFiles');
  // a share over a zero total is undefined, so it renders absent, never `0.0%`
  const shareOf = (chars: number) =>
    asRateHuman({
      of: charsOfAll === 0 ? null : chars / charsOfAll,
      absent: MARK_OF_ABSENT,
    });
  const rowOf = (name: TargetInputName, label: string) =>
    `${label}: ${asFigureHuman({ of: charsOf(name) })} chars (${shareOf(charsOf(name))}), ${asCountedNoun({ count: split.locus[name].length, one: 'file', many: 'files' })} — ${LEVER_OF_TARGET_INPUT[name]}`;
  return [
    `   ├─ targets split: ${asFigureHuman({ of: charsOfAll })} chars (re-derived from the current worktree)`,
    `   │  ├─ ${rowOf('targetFiles', 'targetFiles')}`,
    `   │  ├─ targetDiffs: ${asFigureHuman({ of: charsOfDiffs })} chars (${shareOf(charsOfDiffs)})`,
    `   │  │  ├─ ${rowOf('targetDiffs.additions', 'additions')}`,
    `   │  │  ├─ ${rowOf('targetDiffs.deletions', 'deletions')}`,
    `   │  │  └─ ${rowOf('targetDiffs.mutations', 'mutations')}`,
    `   │  └─ targets: ${asCountHuman({ of: split.targetsRecorded })} recorded, ${asCountHuman({ of: split.targetsGone })} gone from disk since the run (not measured)`,
    ...asTargetLocusLinesByInput({
      locus: split.locus,
      head: '   ├─ ',
      gutter: '   │  ',
    }),
    '   │',
  ];
};

/**
 * .what = the composition census — one row per named input, plus the census's
 *         verdict on its own rows
 * .why = the breadth that answers "which input bought this prompt?" exactly
 */
const asRunCensusLines = (input: {
  prompt: ReviewRunMeter['prompt'];
  defect: ReviewRunMeter['defect'];
}): string[] => {
  const { prompt } = input;

  // a null prompt is UNREAD, never "not compiled": the meter cannot tell an absent
  // prompt from a pruned one or one whose markers did not parse. so the row names no
  // cause, and on a defect it defers to the defect as the identity row does
  if (prompt === null && input.defect !== null)
    return [
      `   └─ composition: ${MARK_OF_ABSENT}`,
      `      └─ 🟡 UNREAD — see the defect below`,
    ];
  if (prompt === null)
    return [
      `   └─ composition: ${MARK_OF_ABSENT}`,
      `      └─ 🟡 UNREAD — the prompt could not be read, so no input can be attributed`,
    ];

  const total = prompt.chars;
  const hasCaveat = prompt.attribution === 'unattributed';

  // the share is what a reader acts on; the seam says whether it is paid once or every round.
  // the last row closes the branch only where no caveat follows it — a `└─` that a
  // caveat then reopens reads as a broken tree
  const rows = asPromptSectionRows({
    sections: prompt.sections,
    total,
    figure: (count) => asFigureHuman({ of: count }),
    absent: MARK_OF_ABSENT,
    marks: { cacheable: 'cacheable', perRound: 'per round' },
    leafOfLast: hasCaveat ? '├─' : '└─',
  });

  // the census's verdict on its own rows, rendered beside them. `scaffold`
  // is a residual at its source, so it absorbs an input that entered with
  // no row and the rows still sum — a reader who takes a percentage with no
  // caveat takes one the writer declined to stand behind (rule.forbid.failhide)
  const caveat = hasCaveat
    ? [
        `      └─ 🟡 UNATTRIBUTED — scaffold may hide an input with no row of its own`,
        `         ├─ check FIRST: many small targets? then it is real tag overhead`,
        `         └─ else: a real input lacks a row — name it in PromptInputName, IS_CACHEABLE, getOnePromptComposition, and SECTION_OF_INPUT`,
      ]
    : [];

  return [
    `   └─ composition: ${asFigureHuman({ of: total })} chars over ${asCountedNoun({ count: prompt.targets, one: 'target', many: 'targets' })} (source: ${prompt.source}, attribution: ${prompt.attribution ?? MARK_OF_ABSENT})`,
    ...rows,
    ...caveat,
  ];
};

/**
 * .what = the cost and (where present) defect rows under the run header
 * .why = the defect string names the file at fault and the reason it could
 *        not be read — the one diagnostic that says why a run is `unknown`.
 *        it was computed, stored, and read by no renderer, so it was
 *        dropped at exactly the moment it is worth most
 *        (rule.require.errors-name-the-fix).
 *
 * .note = the headline only. a `HelpfulError` serializes as a message
 *         followed by a pretty-printed metadata block, and those extra
 *         lines carry no tree glyphs — so the report's alignment breaks at
 *         exactly the row a reader most needs to scan
 *         (rule.require.treestruct-output). the metadata is reachable in
 *         full via `--json`, so this truncates the render and loses no
 *         data, and the pointer is stated rather than left to be inferred.
 */
const asRunFactRows = (input: {
  run: ReviewRunMeter;
  cost: string;
}): string[] => {
  if (input.run.defect === null) return [`   │  └─ cost: ${input.cost}`];

  // the hint names THIS run's dir: a bare `--of run` reads the latest run, so a
  // reader who opened an older one would follow the pointer to another run's json
  const [headline, ...rest] = input.run.defect.split('\n');
  const hint =
    rest.join('').trim() === ''
      ? []
      : [
          `   │     └─ full error: rhx review._.cost --of run --at ${input.run.dir} --json`,
        ];
  // the defect stays last, so its `full error` hint keeps the deeper indent
  // it is written at — a row slipped beneath it would orphan that line.
  //
  // the row is this report's only fault statement — no qualified header sits
  // above it — so it carries the class itself: an unreadable artifact is the
  // system's to fix (rule.require.qualified-error-headers)
  return [
    `   │  ├─ cost: ${input.cost}`,
    `   │  └─ defect: 💥 MalfunctionError: ${headline}`,
    ...hint,
  ];
};

/**
 * .what = renders one review run's cost and composition for a human
 * .why = the `run` breadth position, which had no surface at all until the
 *        axis was spelled as one (`F1`). a per-run figure was an artifact on
 *        disk that nobody could ask for by name.
 *
 *        it is the breadth that answers "which input bought this prompt?"
 *        exactly, from `metrics.compiled.json` rather than a fold over many
 *        runs.
 *
 * .note = not the only breadth that attributes at all — `--of grove` sums
 *         the same rows over the prompts it could read. the one breadth
 *         that cannot is `tree`.
 *
 *         and that split is not restated here, deliberately. `--help` in
 *         `review._.cost.ts` declares which breadth answers what, and its
 *         text is snapshot-clamped; a second copy beside it is a second
 *         place to repair, and the copy that lived here went stale for
 *         exactly that reason — `--help` was corrected and its four
 *         paraphrases were not.
 *
 * .note = a composer of named rows alone. each row's grade logic lives in
 *         its own transformer above, beside the comments that record why it
 *         grades as it does (rule.forbid.decode-friction-in-orchestrators).
 */
export const genReviewRunStdout = (input: {
  run: ReviewRunMeter;
  root: string;
  /**
   * how many locus rows to render before the tail names the remainder
   *
   * .note = bounds the RENDER, never the scan — every directory is summed, and the
   *         rows past the limit are reported as a named remainder rather than
   *         dropped (`F2`). defaults to 10, which fits a terminal without a scroll.
   */
  limit?: number;
  /**
   * the run's targets split into bodies and diffs, re-derived from its recorded scope
   * against the current worktree — supplied only where the run compiled no prompt to
   * read a split from (a refusal at the overflow gate)
   */
  split?: TargetSplitOfRun | null;
  /**
   * this round set against its reviewer's prior round — null where the run has no
   * prior round to pair with (`getOnePrefixPairOfRun`)
   *
   * .note = absent (`undefined`) where the caller did not pair rounds at all, so no
   *         prefix rows render; the cli always pairs, and so always renders them
   */
  prefix?: ReviewPrefixPair | null;
}): string => {
  const { run } = input;
  const facts = asRunFactRows({
    run,
    cost: asRunCostLine({ run }),
  });
  const locus = asRunLocusLines({
    prompt: run.prompt,
    limit: input.limit ?? LIMIT_OF_LOCUS_ROWS,
  });

  return [
    '🦉 review cost — one run',
    `   ├─ run: ${run.dir}`,
    `   │  ├─ identity: ${asRunIdentityLine({ run })}`,
    `   │  ├─ grade: ${run.grade}`,
    ...facts,
    '   │',
    // the levers lead the detail they summarize: a reader who wants only "how big,
    // and how much repeated" stops here, and the token rows below are the
    // arithmetic behind these two figures rather than a peer of them
    ...asRunLeverLines({ run }),
    '   │',
    // the prefix rows sit under the cache lever they explain: what the cache COULD
    // have served from the prior round, beside what it DID serve
    ...(input.prefix === undefined
      ? []
      : [
          ...asPrefixPairLines({ identity: run.identity, pair: input.prefix }),
          '   │',
        ]),
    '   ├─ tokens',
    ...asRunTokenLines({ run }),
    '   │',
    // the locus leads the census: the census says WHICH INPUT, and the locus says
    // WHICH PLACE — and a reader who wants to prune needs the place first. a reader
    // who wants to know whether the rubric or the refs grew reads on.
    //
    // its separator rides WITH it rather than beside it: an unread prompt renders no
    // locus at all, and a bare `│` left behind would close no branch and open none
    // (rule.forbid.snapshot-visual-blemishes)
    ...(locus.length === 0 ? [] : [...locus, '   │']),
    ...asRunSplitLines({ split: input.split ?? null }),
    ...asRunCensusLines({ prompt: run.prompt, defect: run.defect }),
  ].join('\n');
};
