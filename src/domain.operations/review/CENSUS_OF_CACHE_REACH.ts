/**
 * .what = the one record of how long a prompt prefix stays readable from cache, both arms
 * .why = the figure once lived as prose at six sites, and a correction reached some and
 *        missed others. a measurement is a claim, so it is declared once, here, and every
 *        other site cites this module (rule.require.a-cue-is-not-a-claim)
 *
 * .note = two arms, and they disagree on the ABSOLUTE rate — so both sit in this one file,
 *         where no reader can meet one without the other:
 *         · `decay` — one lane (`mech-decode-friction`, a static rubric), rounds sent in one
 *           process at a gap. the hit rate falls with the gap, and that SHAPE is the robust
 *           half: it is what sets the reach. the absolute rate rests on one lane, so no
 *           spend decision should rest on it
 *         · `crossProcess` — production pokes, each from a fresh process, read back by a
 *           later review. a keep-warm poke across rounds lives on this arm, and it hit far
 *           less — which is why no keep-warm poke ships
 */
export const CENSUS_OF_CACHE_REACH = {
  decay: [
    { gapMinutes: 20, hitRate: 0.9 },
    { gapMinutes: 33, hitRate: 0.278 },
    { gapMinutes: 66, hitRate: 0 },
  ],
  crossProcess: { hits: 3, of: 24 },
} as const;
