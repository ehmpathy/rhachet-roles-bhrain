/**
 * .what = a count of concerns of one kind, as a human reads it — `1 blocker`, `3 nitpicks`
 * .why = the judge's shed lines interpolated a raw count into a fixed plural noun, so a single
 *        concern read `1 blockers`. one render for both judge surfaces (the reason line and the
 *        residual lines), so they cannot drift
 */
export const asConcernCountPhrase = (input: {
  count: number;
  kind: 'blockers' | 'nitpicks';
}): string =>
  `${input.count} ${input.count === 1 ? input.kind.slice(0, -1) : input.kind}`;
