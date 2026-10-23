/**
 * .what = the milliseconds the lane's deadline still leaves the meet, floored at zero
 * .why = every wait of the meet — the gather, the trail, the poke, the wait on a holder — is
 *        capped by this one figure, so the meet can never spend the share of the bound the
 *        brain call keeps (`getOneReviewPrimeMeetStopMs`). a prime is an optimization, never
 *        a gate (rule.forbid.cold-pour-of-a-shared-prefix)
 *
 * .note = `msOfStop` is an epoch-ms instant, compared to `Date.now()` alone
 */
export const getOneMsLeftOfMeet = (input: { msOfStop: number }): number =>
  Math.max(0, input.msOfStop - Date.now());
