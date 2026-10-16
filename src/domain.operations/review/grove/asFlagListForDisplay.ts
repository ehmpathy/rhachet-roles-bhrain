/**
 * .what = renders a list of cli flag names as `--a, --b`
 * .why = a usage refusal names the flags at fault; named so the refusal reads as a
 *        call rather than a prefix-and-join a reader must simulate
 *
 * .note = a name that already carries a dash is left as is, so a parser that keeps
 *         the dashes and one that strips them render the same line — and a short
 *         flag such as `-j` reads as typed, never as `---j`
 */
export const asFlagListForDisplay = (input: { flags: string[] }): string =>
  input.flags
    .map((flag) => (flag.startsWith('-') ? flag : `--${flag}`))
    .join(', ');
