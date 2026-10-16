/**
 * .what = quotes one value as a single shell word, posix single-quote form
 * .why = a fix line a human pastes must survive any path. a single-quoted word holds
 *        every byte literally save the quote itself, which closes, escapes, and reopens
 */
export const asShellSingleQuoted = (input: { value: string }): string =>
  `'${input.value.split("'").join("'\\''")}'`;
