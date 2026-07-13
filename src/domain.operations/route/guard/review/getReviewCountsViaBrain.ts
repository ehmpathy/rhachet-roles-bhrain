import { UnexpectedCodePathError } from 'helpful-errors';
import { type IsoDuration, toMilliseconds } from 'iso-time';
import { z } from 'zod';

import type { ContextReviewBrainSupply } from '../../genReviewBrainSupply';
import type { ReviewCounts } from './getReviewCountsViaRegex';

/**
 * .what = the max time the fallback sub-brain call may take before it fails loud
 * .why = runOneStoneGuardReview timeboxes the reviewer subprocess; the sub-brain call must
 *        inherit an equivalent bound, else a hung ask() makes a bounded reviewer's MEASUREMENT
 *        step unbounded — a regression of an extant guarantee. matched to the reviewer
 *        subprocess default (DEFAULT_REVIEW_TIMEOUT = PT21M in runStoneGuardReviews): a real
 *        L3 reviewer brain call runs in the tens-of-minutes range, not sub-second, so a tight
 *        bound would spuriously malfunction the very reviews this fallback exists to rescue.
 *        this bounds an in-process async call, NOT a child process, so it does not reuse the
 *        reviewer subprocess timeout directly.
 * .note = override via RHACHET_FALLBACK_BRAIN_TIMEOUT_MS for tests (mirrors stepReview's
 *         RHACHET_REVIEW_TIMEOUT_MS), so a hang test need not wait the full PT21M.
 */
const FALLBACK_BRAIN_TIMEOUT = 'PT21M' as IsoDuration;

/**
 * .what = the one error class every fault of the sub-brain tally tactic is raised as
 * .why = the per-reviewer seam (runOneStoneGuardReview) converts a brain-tally fault into a
 *        malfunction, but MUST NOT swallow an unexpected code defect (rule.forbid.failhide).
 *        a dedicated class is the allowlist: the seam catches `instanceof ReviewTallyError` and
 *        rethrows all else. every fault this leaf raises (the build, the ask, the timeout) is
 *        this class, so the allowlist and the raise stay in lockstep — no fragile message match.
 */
export class ReviewTallyError extends UnexpectedCodePathError {}

/**
 * .what = the specific fault class for a sub-brain tally that exceeds its time bound
 * .why = the per-reviewer seam reports a DISTINCT user-visible message for a timeout vs a
 *        generic brain fault (the wish's distinct-messages ask). a dedicated subclass lets
 *        the seam tell the two apart by type — not by a fragile message match — while the
 *        `instanceof ReviewTallyError` allowlist still catches it (it extends that class).
 */
export class ReviewTallyTimeoutError extends ReviewTallyError {}

/**
 * .what = resolves the fallback timeout in ms, with the test env override applied
 * .why = lets a hang test bound the wait to milliseconds instead of the full PT21M default
 */
const getFallbackTimeoutMs = (): number => {
  const override = process.env.RHACHET_FALLBACK_BRAIN_TIMEOUT_MS;
  if (override) return parseInt(override, 10);
  return toMilliseconds(FALLBACK_BRAIN_TIMEOUT);
};

/**
 * .what = the internal (wire) schema the sub-brain answers against
 * .why = a FLAT object, not a discriminated union — the fireworks/deepseek json_schema
 *        validator requires a top-level `type` field, which a union (anyOf) lacks (400
 *        "JSON schema must include a 'type' field"; the complex-schema hazard flagged in
 *        3.1.1.research.external.product.flagged yield [3]). the `evidence` quote (mitigation
 *        #3) forces the brain to cite the verdict text it counted, so a fabricated 0/0 on
 *        empty input has no quote to supply. this wire shape is INTERNAL — the code maps it
 *        into the honest ReviewCounts union immediately, so the returned contract stays a
 *        proper discriminated union and evidence is dropped.
 */
const schemaOfBrainTally = z.object({
  detected: z.boolean(),
  blockers: z.number().int().min(0),
  nitpicks: z.number().int().min(0),
  evidence: z.string(),
});

/**
 * .what = the prompt that teaches the sub-brain to tally a review by its own labels
 * .why = four research-backed mitigations (see 3.1.1.research.external.product.flagged yield):
 *        #1 count from the reviewer's labels/summary, not the raw transcript;
 *        #2 explicitly license "no verdict" (detected=false) so an over-confident model abstains;
 *        #3 quote the verdict text counted (evidence), so a fabricated tally has no quote;
 *        #4 read each item's severity from HOW it is written, not from its section title.
 */
const genPromptForTally = (input: { content: string }): string =>
  [
    "here is a code review's output. count the blockers and nitpicks it reports.",
    '',
    "read the reviewer's own labels and summary. do not re-review the subject.",
    '',
    "an issue's severity comes from how the reviewer describes IT, not from the section",
    'title it sits under. count each reported issue as a BLOCKER if the reviewer frames it as',
    'must-fix / would-block / unresolved / high-severity, or a NITPICK if the reviewer frames',
    'it as optional / a suggestion / advisory / low-severity. read how each item itself is',
    'written and its severity marks (🔴 / 🟠 / 🟡, "[confirmed, unresolved]", "must",',
    '"consider"); the section title (Blockers, Maintenance hazards, Scope leaks, Worth-surfaced,',
    "etc.) is a hint, never a decree. do not require the literal words 'blocker' or 'nitpick'.",
    '',
    'always fill all four fields. if the review reports a clean pass with no issues, return',
    'detected=true with blockers=0 and nitpicks=0.',
    '',
    'if you cannot find any verdict at all (the text is empty or garbage), return detected=false',
    'with blockers=0, nitpicks=0, and evidence="" (an empty string).',
    '',
    'when detected=true, quote the exact review text your counts are based on in `evidence`.',
    '',
    '---',
    input.content,
  ].join('\n');

/**
 * .what = probabilistic tactic — extracts a review's tally via a cheap sub-brain
 * .why = when a reviewer states its verdict in prose (no numbers), the deterministic regex
 *        misses. this leaf hands the SMALL review text (never the huge subject) to a cheap
 *        fast brain and asks for a strict-schema tally. it is the second tactic in the
 *        getReviewCounts cascade; getReviewCountsViaRegex is its deterministic peer.
 *
 * .note = builds the brain lazily via context.getReviewBrain() — ONLY here, on the fallback
 *         path, so a numeric-only reviewer never constructs a brain.
 * .note = does NOT swallow brain errors. a brain fault (or timeout) throws, wrapped for
 *         context — the per-reviewer seam converts it to a malfunction. a try/catch →
 *         { detected: false } here would be a rule.forbid.failhide (a brain crash masquerades
 *         as "no verdict" and could pass).
 */
export const getReviewCountsViaBrain = async (
  input: { content: string },
  context: ContextReviewBrainSupply,
): Promise<ReviewCounts> => {
  // ask the sub-brain to tally, bounded by a timeout so a hang fails loud (never unbounds)
  const timeoutMs = getFallbackTimeoutMs();
  const output = await ReviewTallyError.wrap(
    async () => {
      // build the brain lazily — only reached on the fallback path. inside the wrap so a
      // build fault (locked keyrack, absent brain package) also carries REVIEW_TALLY_ERROR_PREFIX
      // and the per-reviewer seam converts it to a malfunction, never crashes the whole guard.
      const brain = await context.getReviewBrain();

      // a timeout promise that rejects if the brain hangs past the bound
      // .note = deliberate mutation: the cancellable timer handle — assigned inside the Promise
      //         executor so the finally block can clearTimeout it. a const cannot cross that scope.
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new ReviewTallyTimeoutError(
                `fallback brain timed out after ${timeoutMs}ms`,
                { timeoutMs, bound: FALLBACK_BRAIN_TIMEOUT },
              ),
            ),
          timeoutMs,
        );
      });

      // race the ask against the timeout; clear the timer either way
      try {
        const result = await Promise.race([
          brain.brain.choice.ask({
            role: { briefs: [] },
            prompt: genPromptForTally({ content: input.content }),
            schema: { output: schemaOfBrainTally },
          }),
          timeout,
        ]);
        return result.output;
      } finally {
        if (timer) clearTimeout(timer);
      }
    },
    {
      message: 'getReviewCountsViaBrain: sub-brain tally failed',
      metadata: { contentLength: input.content.length },
    },
  )();

  // no verdict discernible — carry no counts to fake (mitigation #2)
  if (!output.detected) return { detected: false };

  // fabricated tally guard — an empty quote means the brain invented a verdict (mitigation #3)
  if (output.evidence.trim() === '') return { detected: false };

  // map internal → ReviewCounts (drop evidence — a validation artifact, not part of contract)
  return {
    detected: true,
    blockers: output.blockers,
    nitpicks: output.nitpicks,
  };
};
