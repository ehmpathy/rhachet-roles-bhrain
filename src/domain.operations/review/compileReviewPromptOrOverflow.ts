import { compileReviewPrompt } from '@src/domain.operations/review/compileReviewPrompt';
import { ReviewContextOverflowError } from '@src/domain.operations/review/ReviewContextOverflowError';

/**
 * .what = compiles the review prompt, or hands back the overflow that stopped it
 * .why = an overflow has two answers now, and the compile step cannot pick between them:
 *        a lane that declared partitions is split (F91), and one that did not is refused
 *        with the lever that would make it fit (seed S33). so the overflow is returned as
 *        DATA for the orchestrator to route, never thrown past it
 *
 * .note = 🔴 narrowed on the TYPE, never on the message. a prior discriminator read
 *         `error.message.includes('context window')`, so a reword at the throw site
 *         turned the whole diagnostic into a rethrow with no test red. every other
 *         error still throws (rule.forbid.failhide)
 */
export const compileReviewPromptOrOverflow = (input: {
  prompt: Parameters<typeof compileReviewPrompt>[0];
}):
  | { compiled: ReturnType<typeof compileReviewPrompt>; overflow: null }
  | { compiled: null; overflow: ReviewContextOverflowError } => {
  try {
    return { compiled: compileReviewPrompt(input.prompt), overflow: null };
  } catch (error) {
    if (!(error instanceof ReviewContextOverflowError)) throw error;
    return { compiled: null, overflow: error };
  }
};
