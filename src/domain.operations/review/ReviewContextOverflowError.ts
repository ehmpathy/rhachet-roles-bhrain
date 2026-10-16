import { BadRequestError } from 'helpful-errors';

import type { PromptComposition } from '@src/domain.objects/Reviewer/PromptComposition';

import { asCountHuman } from './asCountHuman';
import { asPercentHuman } from './asPercentHuman';

/**
 * .what = the refusal thrown where a compiled prompt would overrun its context window
 * .why = the two figures a driver reads — the share and the window — must
 *        travel as data, not prose a catch site regexes back out
 *        (rule.require.solve-at-cause, rule.forbid.maintenance-hazards).
 *
 *        a `helpful-errors` metadata bag does not serve this: `HelpfulError`
 *        keeps its bag on a non-enumerable, private `original` field with no
 *        getter, so a catch site cannot read it back — the bag serves the
 *        message and the log, never the caller. the figures instead ride as
 *        a public readonly field, and this constructor renders the sentence
 *        from that field, so the prose and the data have one author.
 *
 * .note = it also gives the catch a type to narrow on, rather than a
 *         message-string match — a second prose seam at the same spot.
 *
 * 🔴 .note = the composition rides too. a refused prompt is the one prompt a
 *         driver must cut, and "which named input made it overflow" — `targetFiles`
 *         or `targetDiffs` above all — is the question the cut turns on. a census
 *         computed only AFTER the gate left every refused run with no split at all,
 *         so a driver hand-rolled one (rule.forbid.adhoc-scope-rollups). it is a
 *         few hundred bytes of counts, never the prompt itself.
 */
export class ReviewContextOverflowError extends BadRequestError {
  constructor(
    public readonly figures: {
      /** what share of the window the prompt would have used */
      percentOfWindow: number;
      /** the window itself, in tokens */
      windowTokens: number;
      /** what the prompt was estimated at, in tokens */
      promptTokens: number;
    },
    /** what the refused prompt was made of, one row per named input */
    public readonly composition: PromptComposition,
  ) {
    super(
      `prompt exceeds 75% of context window (${asPercentHuman({ of: figures.percentOfWindow })} of ${asCountHuman({ of: figures.windowTokens })} tokens). ` +
        `reduce scope or use --focus pull to avoid quality degradation.`,
      figures,
    );
    this.name = 'ReviewContextOverflowError';
  }
}
