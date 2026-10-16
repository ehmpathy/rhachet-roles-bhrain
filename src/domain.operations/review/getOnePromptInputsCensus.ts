import {
  ORDER_OF_SECTIONS,
  type PromptSectionChars,
  SECTIONS_NIL,
} from '@src/domain.objects/Reviewer/PromptSectionChars';
import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';

/**
 * .what = what a set of review prompts were MADE OF, by named input
 * .why = a rollup says WHICH LANE spent the tokens. it cannot say WHICH INPUT — the
 *        rubric, the refs, the prior conversation, the diffs, or the file bodies
 *        carried as context. a cut has to be aimed at one of those.
 *
 * .note = folded at TWO breadths, `--of tree` and `--of grove`, from one operation —
 *         so the same corpus reads the same rows at both, and a breadth cannot omit a
 *         stat its peer carries (rule.require.report-both-cost-levers-with-trend-and-locus).
 *         it lives at `review/` because neither breadth owns it
 *         (rule.prefer.most-common-denominator).
 *
 * .note = read from each run's `metrics.compiled.json` where present (kilobytes), and
 *         from a re-parse of its rendered prompt otherwise. `unread` counts the runs
 *         whose prompt was absent or unparseable — the coverage every share must be
 *         weighed against.
 */
export interface PromptInputsCensus {
  /** runs whose inputs could be read, by either source */
  read: number;
  /** runs read from `metrics.compiled.json` — measured at compile time, exact */
  compiled: number;
  /** runs recovered by a re-parse of the rendered prompt — coarser, and dear */
  parsed: number;
  /** runs whose prompt was absent (a refusal) or whose markers did not parse */
  unread: number;
  /**
   * runs whose OWN census vouched for its rows (`attribution === 'attributed'`)
   *
   * .why = the honesty grade must survive the fold. every other grade this meter
   *        carries — `metered` / `refused` / `unknown` — travels beside its
   *        aggregate, so a reader weighs a figure against the share of the corpus
   *        that could prove it. without this count, a run whose own composition
   *        declined to vouch for its rows would be laundered into a confident
   *        percentage with no signal at all (rule.forbid.failhide).
   */
  attributed: number;
  /** runs whose own census DECLINED to vouch — the caveat's denominator */
  unattributed: number;
  /**
   * runs that state NO grade — they predate the field, or a re-parse found no head
   * markers to cut at
   *
   * .note = counted apart from `attributed` ON PURPOSE. to fold an absent grade in
   *         with a clean one would mint a verdict nobody rendered, which is the
   *         precise defect `asAttributionGrade` returns `null` to prevent.
   */
  ungraded: number;
  /** summed chars over the read prompts — the rows sum to `chars` exactly */
  sections: PromptSectionChars;
  /** total prompt chars over the read prompts */
  chars: number;
  /** target files carried across the read prompts */
  targets: number;
  /**
   * where the target mass came from, summed by path over the runs that recorded it
   *
   * .why = `sections` names the KIND of input and never the PLACE, so a reader at
   *        this breadth could see `targetFiles` dominate and could not name a
   *        directory to prune (rule.require.report-both-cost-levers-with-trend-and-locus,
   *        obligation 4).
   *
   * .note = `placed` counts the read runs whose locus was recorded. a run compiled
   *         before the `locus` row existed is read and UNPLACED — its mass is not
   *         folded in as zero, it is left out and counted, so every share is weighed
   *         against the runs that could supply it (rule.forbid.failhide).
   *
   * .note = summed by PATH before the rollup, so a file sent in every round is one
   *         file with its mass summed, never one row per round
   */
  locus: {
    placed: number;
    targets: { path: string; chars: number }[];
  };
}

/**
 * .what = the prompts that could be read, one per run that yielded one
 */
type PromptRead = NonNullable<ReviewRunMeter['prompt']>;
const getAllPromptsRead = (input: { runs: ReviewRunMeter[] }): PromptRead[] =>
  input.runs
    .map((one) => one.prompt)
    .filter((one): one is PromptRead => one !== null);

/**
 * .what = the by-section chars, summed across the read prompts
 * .why = the fold `getOneReviewTokensOfRuns` holds on the token axis, held here on
 *        the section axis — so the sum has one home
 */
const getOnePromptSectionsTotal = (input: {
  read: PromptRead[];
}): PromptSectionChars =>
  input.read.reduce<PromptSectionChars>(
    (sum, one) => asPromptSectionsSum({ a: sum, b: one.sections }),
    { ...SECTIONS_NIL },
  );

/**
 * .what = two section maps, summed key by key
 * .why = keyed off `SECTIONS_NIL`, so a row added to the census is summed here with
 *        no edit — a hand-listed sum would drop it silently
 */
const asPromptSectionsSum = (input: {
  a: PromptSectionChars;
  b: PromptSectionChars;
}): PromptSectionChars =>
  ORDER_OF_SECTIONS.reduce(
    (acc, key) => ({ ...acc, [key]: input.a[key] + input.b[key] }),
    { ...SECTIONS_NIL },
  );

/**
 * .what = how many read prompts carry one provenance
 */
const getOnePromptCountOfSource = (input: {
  read: PromptRead[];
  source: PromptRead['source'];
}): number => input.read.filter((one) => one.source === input.source).length;

/**
 * .what = how many read prompts carry one attribution grade
 * .note = `null` is a grade of its own here — the prompt states none
 */
const getOnePromptCountOfAttribution = (input: {
  read: PromptRead[];
  attribution: PromptRead['attribution'];
}): number =>
  input.read.filter((one) => one.attribution === input.attribution).length;

/**
 * .what = one count, summed across the read prompts
 */
const getOnePromptCountSum = (input: {
  read: PromptRead[];
  of: 'chars' | 'targets';
}): number => input.read.reduce((sum, one) => sum + one[input.of], 0);

/**
 * .what = the target mass of every placed prompt, summed by path
 * .why = one file sent in every round is one place a reader ca prune, so the fold
 *        keys on the path and sums its chars across runs
 */
const getOnePromptLocusTotal = (input: {
  read: PromptRead[];
}): PromptInputsCensus['locus'] => {
  const placed = input.read.flatMap((one) =>
    one.locus === null ? [] : [one.locus],
  );
  // .note = deliberate mutation, and a SCOPED ZONE — a grove folds thousands of runs
  //         of hundreds of paths each, so a spread per entry would go quadratic. the
  //         map is born here and only its entries leave, copied into a fresh array
  //         (rule.require.immutable-vars)
  const charsByPath = new Map<string, number>();
  for (const one of placed.flat())
    charsByPath.set(one.path, (charsByPath.get(one.path) ?? 0) + one.chars);
  return {
    placed: placed.length,
    targets: [...charsByPath.entries()].map(([path, chars]) => ({
      path,
      chars,
    })),
  };
};

/**
 * .what = folds every readable prompt into one by-input census
 * .why = the one place the by-input rows are summed, so the total and the rows
 *        cannot drift on what they count — at either breadth that renders them
 *
 * .note = a run whose prompt could not be read is COUNTED as unread rather than
 *         folded in as zeroes. a zero row would state "this run carried no rules"
 *         as a fact, where the truth is that nobody could read it
 */
export const getOnePromptInputsCensus = (input: {
  runs: ReviewRunMeter[];
}): PromptInputsCensus => {
  const read = getAllPromptsRead({ runs: input.runs });

  return {
    read: read.length,
    compiled: getOnePromptCountOfSource({ read, source: 'compiled' }),
    parsed: getOnePromptCountOfSource({ read, source: 'parsed' }),
    unread: input.runs.length - read.length,
    // three counts, never two. an absent grade is not a clean one, so it is
    // counted apart — the same split `asAttributionGrade` draws when it reads a
    // prompt that predates the field
    attributed: getOnePromptCountOfAttribution({
      read,
      attribution: 'attributed',
    }),
    unattributed: getOnePromptCountOfAttribution({
      read,
      attribution: 'unattributed',
    }),
    ungraded: getOnePromptCountOfAttribution({ read, attribution: null }),
    sections: getOnePromptSectionsTotal({ read }),
    chars: getOnePromptCountSum({ read, of: 'chars' }),
    targets: getOnePromptCountSum({ read, of: 'targets' }),
    locus: getOnePromptLocusTotal({ read }),
  };
};
