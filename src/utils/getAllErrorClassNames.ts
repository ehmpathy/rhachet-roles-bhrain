/**
 * .what = the constructor names along a caught value's prototype chain, nearest first
 * .why = an error thrown through a dependency may come from that dependency's own copy of
 *        its error library, so `instanceof` against this repo's import reads false. the
 *        class name survives the copy, so a check by name holds across both
 *
 * .note = it reads constructor names, never `.name`: `helpful-errors@1.5.3` leaves `.name`
 *         as `'Error'`, so only the constructor names the class. the walk covers the whole
 *         chain, so a subclass still names its parent, the same as `instanceof` would
 */
export const getAllErrorClassNames = (input: { error: unknown }): string[] => {
  // only an object can carry a prototype chain to read
  if (typeof input.error !== 'object' || input.error === null) return [];

  // walk the chain and collect each constructor name
  const getAllNamesFrom = ({ of }: { of: object | null }): string[] =>
    of === null
      ? []
      : [
          (of.constructor as { name?: unknown } | undefined)?.name,
          ...getAllNamesFrom({ of: Object.getPrototypeOf(of) }),
        ].filter((name): name is string => typeof name === 'string');
  return getAllNamesFrom({ of: input.error });
};
