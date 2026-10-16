/**
 * .what = how long one poke may wait on the provider: the caller's bound, capped by the wedge
 * .why = two bounds meet here and each guards a different harm. the wedge bound catches a
 *        provider that never answers, so a prime never stalls the pour behind it. a
 *        caller's bound is the time its lane has left, so a prime never outlasts the
 *        subprocess kill that would drop the lane's merged report. the poke owes BOTH, so a
 *        caller may only shorten the wedge, never lengthen it
 */
export const getOneMsOfPokeWait = (input: {
  /** the caller's bound; null where the caller sets none */
  msOfCaller: number | null;
  /** the wedge bound, `MS_OF_POKE_TIMEOUT` */
  msOfWedge: number;
}): number => Math.min(input.msOfCaller ?? input.msOfWedge, input.msOfWedge);
