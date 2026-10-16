/**
 * .what = the error, then each `cause` beneath it, nearest first — each one once
 * .why = a wrapped fault hides its class or its errno one level down, so a classifier must
 *        see the whole chain. one walk serves every classifier, so the cycle guard lives in
 *        one place and no peer walk can drift from it
 *
 * .note = 🔴 a `cause` chain can loop — an error that names itself, or two that name each
 *         other. the walk stops at the first cause it has already seen, so a malformed chain
 *         ends the walk rather than overflow the stack
 */
export const getAllErrorCauses = (input: { error: unknown }): unknown[] => {
  // step down one link at a time; `seen` carries every link already walked
  const getAllCausesFrom = ({
    error,
    seen,
  }: {
    error: unknown;
    seen: unknown[];
  }): unknown[] => {
    // a primitive carries no cause; a link already walked closes a loop
    if (seen.includes(error)) return [];
    if (typeof error !== 'object' || error === null) return [error];

    // this link, then the walk beneath its cause
    const cause: unknown = Reflect.get(error, 'cause');
    if (cause === undefined) return [error];
    return [
      error,
      ...getAllCausesFrom({ error: cause, seen: [...seen, error] }),
    ];
  };
  return getAllCausesFrom({ error: input.error, seen: [] });
};
