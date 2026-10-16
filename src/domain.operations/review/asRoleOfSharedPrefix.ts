import type { Artifact } from 'rhachet-artifact';
import type { GitFile } from 'rhachet-artifact-git';

/**
 * .what = the `role` a brain call takes when its system prompt must be
 *         exactly one artifact's bytes — the shared prefix, naught beside it
 *
 * .why = two call sites derive one replica pin with no shared test: the real
 *        review sends the prompt's static head (`stepReview`); a prime poke
 *        sends that same head (`setOnePrefixPoke`). the pin is
 *        `sha256(model + \0 + systemPrompt)`, so a poke reaches the review's
 *        replica iff the two system prompts are byte-identical. the system
 *        prompt is `contents.filter(Boolean).join('\n\n')`, so one brief
 *        round-trips exactly and two do not (`head` alone reproduces `head`,
 *        never `head + '\n\n' + other`). the single-element list is why the
 *        prime can reach the replica its pour reads, and it must hold at both
 *        sites or neither.
 *
 * .note = a divergence here would read as health rather than failure: a prime
 *         would warm a replica no partition reads, and every partition would
 *         still pay its shared prefix in full. a shared constructor closes that at one place rather
 *         than a comment at each site (rule.prefer.prevent-over-correct).
 *
 * .note = takes one artifact rather than a list on purpose — a signature of
 *         `{ briefs }` would accept the exact input this exists to refuse.
 *
 * .note = the guard's tallier (`getOneReviewCountsViaBrain`) is not a caller
 *         here: it lives in `review.tally/`, which the review context depends
 *         on, so an import back would close a cycle. it holds the same law
 *         inline — its static head rides as its one brief
 *         (`setTallyHeadArtifact`), never as `briefs: []`.
 */
export const asRoleOfSharedPrefix = (input: {
  /** the artifact whose bytes ARE the system prompt, and the pin it derives */
  prefix: Artifact<typeof GitFile>;
}): { briefs: Artifact<typeof GitFile>[] } => ({ briefs: [input.prefix] });
