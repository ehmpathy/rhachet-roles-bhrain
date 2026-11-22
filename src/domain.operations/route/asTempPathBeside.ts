/**
 * .what = a temp path beside a target file, unique to this process and this write
 * .why = an atomic write is a temp file + rename. two writers at once must never share a temp file,
 *        or a rename could publish the other's half-written bytes
 */
export const asTempPathBeside = (input: { path: string }): string =>
  `${input.path}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
