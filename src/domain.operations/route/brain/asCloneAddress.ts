/**
 * .what = casts a `clone whoami` payload into the address to say into, or null
 * .why = the shape work is a pure transformer, apart from the communicator
 *        `getCloneAddress`, so a unit test reaches it without a real `clone whoami` spawn
 *
 * .note = the input is `unknown`: rhachet owns this shape, so a declared type here would
 *         assert a guarantee this repo cannot keep
 */
export const asCloneAddress = (input: { payload: unknown }): string | null => {
  // a non-object payload (`JSON.parse` admits a bare number, string, or null) carries
  // no address
  if (typeof input.payload !== 'object' || input.payload === null) return null;

  // prefer the slug, fall back to the serial — `clone say` takes `@:<slug|serial>`
  // .note = the fallback is no mere defense: a live enrolled clone routinely reports
  //         `slug: null` with a serial
  const candidates: unknown[] = [
    'slug' in input.payload ? input.payload.slug : null,
    'serial' in input.payload ? input.payload.serial : null,
  ];

  // take the first candidate that is a non-empty string — a number or an object would
  // put `@:[object Object]` on the wire as though confirmed (rule.require.shapefit)
  // 🔴 .note = trim BEFORE the length check, else a whitespace-only slug sends `@:   `
  const address = candidates.find(
    (candidate) => typeof candidate === 'string' && candidate.trim().length > 0,
  );

  return typeof address === 'string' ? address.trim() : null;
};
