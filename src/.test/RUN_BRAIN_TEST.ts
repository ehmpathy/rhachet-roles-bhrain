/**
 * .what = true when a human or a job names the live-brain tier: `BRAIN_LIVE=true`, or CI
 * .why  = a live-brain test bills a real model call and rides a vendor's model catalog; it runs
 *         only when targeted. a suite with no brain call must never die at setup for want of a
 *         brain key (bulletin live-brain-tests-three-tiers)
 *
 * .note = CI holds the keys and owns the live-brain proof, so it stays strict: an absent key
 *         there fails fast at setup, as before. only a keyless local box goes lenient
 * .note = target it locally: `BRAIN_LIVE=true npx jest -c ./jest.integration.config.ts <file>`
 */
export const RUN_BRAIN_TEST =
  process.env.BRAIN_LIVE === 'true' || process.env.CI === 'true';
