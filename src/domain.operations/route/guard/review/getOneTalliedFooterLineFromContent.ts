import { TALLIED_FOOTER_PREFIX } from './TALLIED_FOOTER_PREFIX';

/**
 * .what = the `└─ tallied by reviewer@<pin>` footer line of a persisted review, or null
 * .why = the artifact stores the reviewer's raw stdout ABOVE the footer the writer adds,
 *        and a reviewer in this repo quotes the very phrase it reads — a test assertion,
 *        a docblock. a match on the phrase anywhere reads that quote as a footer, so a
 *        deterministic tally renders as a sub-brain one under a slug like `');`.
 *
 *        ⇒ this matches only the line the writer emits (`formatArtifactFooters`): a
 *        top-level branch, indented by spaces alone. a stdout line carries its tree's
 *        `│` gutter, so a quote can never take this shape. the LAST match wins, since
 *        the footer closes the artifact
 */
export const getOneTalliedFooterLineFromContent = (input: {
  content: string;
}): string | null => {
  const footers = input.content
    .split('\n')
    .filter((line) =>
      line.replace(/^ */, '').startsWith(`└─ ${TALLIED_FOOTER_PREFIX}`),
    );
  return footers[footers.length - 1] ?? null;
};
