/**
 * .what = the `inputs` map of `metrics.compiled.json`, as it comes off disk
 * .why = the meter reads this map at three sites. one declared shape ties them at
 *        compile time, so a schema change to the artifact forces every reader to
 *        update in lockstep rather than drift one site at a time
 *
 * .note = every field is optional, and a row itself may be absent: an older artifact
 *         predates a field, and the readers must grade that absence, never assume it
 */
export type CompiledInputRows = Record<
  string,
  { chars?: number; count?: number } | undefined
>;
