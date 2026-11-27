/**
 * .what = true only when a human or a job names the live-brain tier: `BRAIN_LIVE=true`
 * .why  = a live-brain test bills a real model call and rides a vendor's model catalog; one that
 *         is neither a safety guard nor a rhachet acceptance smoke runs only when targeted, never
 *         on every ci push (bulletin live-brain-tests-three-tiers)
 *
 * .note = target it: `BRAIN_LIVE=true npx jest -c ./jest.integration.config.ts <file>`
 * .note = the jest env files and the brain global setup read it too: a keyless run asks the
 *         keyrack for no brain key
 */
export const RUN_BRAIN_TEST = process.env.BRAIN_LIVE === 'true';
