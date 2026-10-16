/**
 * .what = the credentials every review-path brain boots with
 * .why = a review and its prime must boot under the SAME creds — the pin and the
 *        creds are the two halves of "warm the cache the pour reads", and a prime
 *        that booted under another env would poke another account's cache.
 *        one constant, imported at every boot site, so no site can drift alone
 *
 * .note = env `prep`: a review prepares code, it does not test it
 * .note = keyrack unlocks on demand (rhachet >=1.43), so no upfront unlock
 */
export const CREDS_OF_REVIEW_BRAIN = {
  keyrack: { owner: 'ehmpath', env: 'prep' },
} as const;
