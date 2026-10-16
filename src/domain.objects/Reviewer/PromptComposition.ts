import type { AttributionGrade } from '@src/domain.objects/Reviewer/AttributionGrade';

/**
 * .what = every named input a review prompt is built from
 * .why = the census is only useful if exhaustive — a new input that lands in
 *        the prompt with no name here is invisible downstream, and its spend
 *        swells `markup`, the residual row, with no way to tell real
 *        overhead from an unattributed input. so this list is the contract:
 *        extend the prompt, extend this union (rule.require.distinguish-every-review-input)
 *
 * .note = the sum invariant does not police this — `markup` is the residual,
 *         so the rows sum to `chars` by algebra whatever enters the prompt.
 *         what catches an unattributed input is the bound on markup's share,
 *         enforced by `getOneAttributionGrade` in the shipped path, not only
 *         under test
 */
export type PromptInputName =
  /** the preamble, the diff howto, and the goal — identical for every lane of one goal; the goal block parts an `exhaustive` lane from a `representative` one */
  | 'instructions'
  /** the json output contract — identical for EVERY review ever run */
  | 'outputFormat'
  /** the rubric — identical per lane, across its rounds */
  | 'rules'
  /** reference docs — identical per lane, across its rounds */
  | 'refs'
  /** the prior peer dialogue — APPENDS per round, so its head stays stable */
  | 'conversation'
  /** the whole body of each file this branch ADDED — a net-new diff, sent once */
  | 'targetDiffs.additions'
  /** the void marker of each file this branch DELETED — no body to send */
  | 'targetDiffs.deletions'
  /** the hunks of each file this branch EDITED — rewritten wherever the driver repaired */
  | 'targetDiffs.mutations'
  /** the full bodies of EDITED files, carried as context around their mutations */
  | 'targetFiles'
  /**
   * the path list a `pull` render sends in place of a payload — nil under `push`
   *
   * earns a row because it is real mass nobody attributed. under `pull` the
   * two rows above are nil by construction, so every path char fell into
   * `markup` — and on a 293-target corpus that is the majority of the prompt
   */
  | 'targetPaths'
  /** the render overhead — section headers, xml tags, and separators */
  | 'markup';

/**
 * .what = one input's contribution to the prompt
 * .why = chars alone misread. a large CACHEABLE input is the cheap half, and a
 *        small per-round one can still be the dear half — so the seam rides with
 *        the mass. `count` makes a per-file average derivable with no raw corpus.
 */
export interface PromptInputWeight {
  /** chars this input contributed to the compiled prompt */
  chars: number;
  /** how many files or blocks fed it */
  count: number;
  /** whether it sat in the static head a prompt cache can serve */
  cacheable: boolean;
}

/**
 * .what = the char budget of one review prompt, split by input and by cacheability
 * .why = a hit rate says how much of the prompt was served from cache, but
 *        not where the uncacheable remainder came from, so it cannot point at
 *        the next lever. this does: it attributes every char to a named
 *        input, marked cacheable or not. `targetDiffs` vs `targetFiles` is
 *        the split that matters most — a diff is the delta the reviewer must
 *        weigh, the file is context around it. if files dominate the
 *        uncacheable remainder, the lever is context, never the rubric
 *
 * .note = the inputs are exhaustive — their chars sum to `chars` exactly, by
 *         algebra (`markup` is the residual). so the sum proves the
 *         arithmetic and says naught about coverage — an unnamed input lands
 *         in `markup` with the sum still green. `attribution` is the row
 *         that speaks to coverage
 */
export interface PromptComposition {
  /** the compiled prompt's total length */
  chars: number;
  /**
   * whether the census can stand behind the rows below.
   *
   * rides on the composition rather than beside it, so a reader cannot take
   * the rows without the caveat. `unattributed` does not mean a defect was
   * found — it means the residual is too large to vouch for, and the reader
   * must check the corpus shape before they trust a percentage
   * (`getOneAttributionGrade`, `HINT_OF_UNATTRIBUTED`)
   */
  attribution: AttributionGrade;
  /** the split a prompt cache actually sees */
  cacheable: {
    /** chars in the static head — the max a cache could ever serve */
    head: number;
    /** chars in the variable tail — re-paid at full input rate every round */
    tail: number;
  };
  /** every char of the prompt, attributed to exactly one named input */
  inputs: Record<PromptInputName, PromptInputWeight>;
}
