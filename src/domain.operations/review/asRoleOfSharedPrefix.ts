import type { Artifact } from 'rhachet-artifact';
import type { GitFile } from 'rhachet-artifact-git';

/**
 * .what = the `role` a brain call takes when its system prompt must be
 *         exactly one artifact's bytes — the shared prefix, naught beside it
 *
 * .why = two call sites must send one system prompt, byte for byte, with no shared
 *        test: the real review sends the prompt's shared head (`stepReview`); a prime
 *        poke sends that same head (`setOnePrefixPoke`). a prompt cache serves only
 *        the bytes two requests share from token 0, so a poke warms the review's
 *        prefix iff the two system prompts are byte-identical. the system prompt is
 *        `contents.filter(Boolean).join('\n\n')`, so one brief round-trips exactly
 *        and two do not (`head` alone reproduces `head`, never `head + '\n\n' +
 *        other`). the single-element list must hold at both sites or neither.
 *
 * 🔴 .note = no replica pin rides these calls via `rhachet-brains-openrouter@0.1.4`. it
 *         sends no affinity key and no `cache_control`, so which host and replica
 *         serves each ask is the floor's choice (grep of its dist for `affinity`,
 *         `session_id`, `cache_control`, `sha256`: 0 matches). a pin keyed on this
 *         system prompt is owed by that repo (radio task openrouter #34); without
 *         it, a poke and its pour meet one replica by chance, not by key
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
  /** the artifact whose bytes ARE the system prompt */
  prefix: Artifact<typeof GitFile>;
}): { briefs: Artifact<typeof GitFile>[] } => ({ briefs: [input.prefix] });
