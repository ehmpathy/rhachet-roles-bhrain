/**
 * .what = the stderr row for a status line pointer drop that failed at unbind time
 * .why = the unbind landed; the reader still checks the bind flag the pointer leads to, so a
 *        pointer left behind reads blank. the row names the code and the fix, beside its peer
 *        for the cache (`asStatusLineCacheDropFaultRow`)
 */
export const asStatusLinePointerDropFaultRow = (input: {
  code: string;
  pointerPath: string;
}): string =>
  `[route.bind.del] warn: status line pointer drop failed (${input.code}). fix: remove ${input.pointerPath}`;
