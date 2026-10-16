import * as path from 'path';

/**
 * .what = every artifact a review run writes into its log dir
 * .why = names the write side and the read side of this grammar in one place,
 *        so a rename cannot land on one and leave the other stale. the same
 *        shape `DIR_OF_REVIEW_LOGS` closes for the log dir's location and
 *        `SHAPE_OF_LOG_DIR_NAME` closes for its name.
 *
 * .note = the keys are the concepts, never the filenames. a reader asks for
 *         `realized` and gets whatever file currently holds the measured
 *         figures; a rename lands here, once, and every call site follows.
 *
 * .note = clamped by `reviewCost.acceptance.test.ts`, which seeds its
 *         fixture with literal filenames rather than these constants — so a
 *         name change here that the map does not also apply to real output
 *         goes red, instead of the test tracking the map and passing over a
 *         corpus nobody can read.
 */
export const NAME_OF_RUN_ARTIFACT = {
  /** the scope the review was given — the replay record of the invocation */
  args: 'input.args.json',
  /** the exact prompt sent to the brain */
  prompt: 'input.prompt.md',
  /**
   * the prompt's static head — the shared prefix, as it rode in the system slot
   *
   * one home for the literal, so the write in `stepReview` and every read
   * of it name the same file.
   */
  head: 'input.prompt.head.md',
  /** what the prompt was MADE OF, per named input — measured at compile time */
  compiled: 'metrics.compiled.json',
  /** the MEASURED tokens and spend, written after the brain answered */
  realized: 'metrics.realized.json',
  /**
   * the projection — a token estimate and a cost guess, made before the call
   *
   * never read by the meter, at any breadth. listed here so the set is whole
   * and a reader sees the exclusion is deliberate (`getOneReviewRunMeter`),
   * not an omission.
   */
  expected: 'metrics.expected.json',
  /** the scope as resolved — the rule, ref, conversation, and target sets */
  scope: 'input.scope.json',
  /**
   * the scope RESOLUTION trace — every join, drop, and exemption, by name
   *
   * .note = written BEFORE validation, deliberately, so a run that refuses on
   *         an empty corpus still leaves the trace that says why. the refusal
   *         hint names this file by path (`emitReviewRefusal`).
   */
  scopeDebug: 'input.scope.debug.json',
  /** the token breakdown, machine-readable — by corpus, rules, and targets */
  tokensJson: 'tokens.expected.json',
  /** the same breakdown, rendered for a human to read */
  tokensMarkdown: 'tokens.expected.md',
  /** the brain's answer, exactly as it came back — the replay record of the call */
  response: 'output.response.json',
  /**
   * the review, formatted — the same bytes the driver's `--output` file carries
   *
   * the driver's copy is not in this map, deliberately: its path comes from
   * `--output`, so it is the caller's to name, and this grammar governs the
   * log dir alone.
   */
  review: 'output.review.md',
} as const;

/** one of the artifacts a run writes */
export type RunArtifact = keyof typeof NAME_OF_RUN_ARTIFACT;

/**
 * .what = the path to one artifact inside a run's log dir
 * .why = binds the JOIN along with the name, so a call site cannot reach for
 *        the constant and then re-type the `path.join` around it
 *
 * .note = `stepReview` discarded `setInputArtifacts`'s returned `compiledPath`
 *         and hand-typed `'metrics.compiled.json'` a few lines later, INSIDE the
 *         json payload of a peer artifact. an operation both sides call is what
 *         makes that re-type impossible rather than merely discouraged.
 */
export const asRunArtifactPath = (input: {
  dir: string;
  artifact: RunArtifact;
}): string => path.join(input.dir, NAME_OF_RUN_ARTIFACT[input.artifact]);
