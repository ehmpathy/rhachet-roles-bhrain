/**
 * .what = whether a fulcrum's `holds` names one concern of one reviewer
 * .why = invariant 4: the halt shows a human what each fulcrum holds, so a dispute may only cite a
 *        fulcrum that names the concern it backs. a hold reads `<reviewer>/<iteration>/<concern>`
 *        (e.g. `repo-rules/i002/blocker.3`); the iteration is free, since concern ordinals renumber
 *        each round and the driver names the round it read
 */
export const isFulcrumHoldsOfConcern = (input: {
  holds: string[];
  reviewer: string;
  about: string;
}): boolean =>
  input.holds.some(
    (hold) =>
      hold.startsWith(`${input.reviewer}/`) && hold.endsWith(`/${input.about}`),
  );
