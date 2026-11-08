import { asBashQuotesMasked } from './asBashQuotesMasked';

/**
 * .what = pattern for the operators that part one shell command from the next
 * .why = a verb grades only the command it opens; `mv a b && cat M` is two commands
 *
 * pattern breakdown:
 * - && · || = a conditional chain
 * - ; · newline = a sequence
 * - | = a pipe, unless it is the `>|` noclobber operator
 * - & = a background job, when it stands alone: not in `&&`, `&>`, `>&`, `<&`, `|&`
 */
const BASH_COMMAND_SEPARATOR_PATTERN =
  /&&|\|\||;|\n|(?<!>)\||(?<![&<>|])&(?![&>])/g;

/**
 * .what = split a bash command line into the simple commands it chains
 * .why = the memory guard asks of each simple command whether it writes, and what
 * .note = quotes and escapes are tracked (asBashQuotesMasked), so a quoted or
 *         escaped separator stays inside its command
 */
export const getAllBashCommandSegments = (input: {
  command: string;
}): string[] => {
  // find each separator outside quotes, by offset into the original command
  const masked = asBashQuotesMasked({ command: input.command });
  const cuts = [...masked.matchAll(BASH_COMMAND_SEPARATOR_PATTERN)].map(
    (match) => ({ start: match.index, end: match.index + match[0].length }),
  );

  // slice the original between the separators
  const starts = [0, ...cuts.map((cut) => cut.end)];
  const ends = [...cuts.map((cut) => cut.start), input.command.length];
  return starts
    .map((start, index) => input.command.slice(start, ends[index]).trim())
    .filter((segment) => segment.length > 0);
};
