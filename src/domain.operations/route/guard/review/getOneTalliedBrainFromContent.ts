import { getOneTalliedFooterLineFromContent } from './getOneTalliedFooterLineFromContent';
import { TALLIED_FOOTER_PREFIX } from './TALLIED_FOOTER_PREFIX';

/**
 * .what = recovers the pinned brain that tallied a persisted review, from its stored content
 * .why = the writer records the PIN in the `tallied by reviewer@<pin>` footer. a render that
 *        reads it back names the model that actually ran, where the versionless default
 *        would name whichever model `latest` points at today
 *
 * .note = null where the footer is absent (a deterministic tally) or carries no slug
 */
export const getOneTalliedBrainFromContent = (input: {
  content: string;
}): string | null => {
  const line = getOneTalliedFooterLineFromContent({ content: input.content });
  if (!line) return null;
  const slug = line.split(TALLIED_FOOTER_PREFIX)[1]?.trim() ?? '';
  return slug.length > 0 ? slug : null;
};
