/**
 * .what = compares two stone prefixes for order
 * .why = enables cascade detection and invalidation-by-order logic
 *
 * @returns negative if a < b, 0 if equal, positive if a > b
 *
 * @example
 * compareStonePrefix({ a: "1", b: "2" }) // => -1
 * compareStonePrefix({ a: "3.1", b: "3.2" }) // => -1
 * compareStonePrefix({ a: "3.2", b: "3.1" }) // => 1
 * compareStonePrefix({ a: "3", b: "3.1" }) // => -1 (3 is before 3.1)
 */
export const compareStonePrefix = (input: { a: string; b: string }): number => {
  const partsA = input.a.split('.').map((n) => parseInt(n, 10));
  const partsB = input.b.split('.').map((n) => parseInt(n, 10));

  const maxLen = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < maxLen; i++) {
    const numA = partsA[i] ?? 0;
    const numB = partsB[i] ?? 0;
    if (numA !== numB) return numA - numB;
  }

  return 0;
};
