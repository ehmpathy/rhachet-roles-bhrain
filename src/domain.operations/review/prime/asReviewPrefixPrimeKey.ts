import { createHash } from 'crypto';

/**
 * .what = the key two lanes share exactly when a prime of one warms the other
 * .why = a prompt cache serves a prefix per model, and the prefix a lane sends
 *        as its system prompt is its static head (instructions + rules). so two
 *        lanes on one brain with one head would read each other's cache entry,
 *        and any other pair would not — the key is the hash of both, and of
 *        naught else (rule.require.name-the-shared-prefix-as-the-cache-anchor)
 *
 * .note = the NUL separator keeps the two fields apart, so no brain slug that
 *         ends where a head begins can collide with another split of the bytes
 */
export const asReviewPrefixPrimeKey = (input: {
  brain: string;
  head: string;
}): string =>
  createHash('sha256')
    .update(`${input.brain}\0${input.head}`)
    .digest('hex')
    .slice(0, 32);
