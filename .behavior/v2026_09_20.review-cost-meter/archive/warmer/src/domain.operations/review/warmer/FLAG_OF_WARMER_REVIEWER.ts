/**
 * .what = the argv flag that names a warmer's reviewer
 * .why = the spawn writes it into the warmer's argv and the warmer's own arg parse reads it
 *        back. two literals would drift apart in silence, and every warmer would then spawn
 *        with no reviewer — so both sides import this one, via `FLAG_OF_WARMER_ARG`
 */
export const FLAG_OF_WARMER_REVIEWER = '--reviewer';
