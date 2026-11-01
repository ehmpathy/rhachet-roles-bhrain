import { asBashQuotesMasked } from './asBashQuotesMasked';
import { asBashWordBare } from './asBashWordBare';

/**
 * .what = the verbs that copy bytes into a file named among their args
 * .why = tee and teesafe write every operand; cp and mv name a source and a target
 */
const BASH_COPY_VERBS = ['tee', 'teesafe', 'cp', 'mv'] as const;
type BashCopyVerb = (typeof BASH_COPY_VERBS)[number];

/**
 * .what = words that run the next word as the command, rather than run themselves
 * .why = `sudo cat` and `FOO=1 grep` still run the reader after them
 */
const BASH_COMMAND_PREFIXES = [
  'sudo',
  'command',
  'exec',
  'env',
  'nice',
  'time',
  'rhx',
  'npx',
];

/**
 * .what = commands that only read the files they name, and write none
 * .why = the one exemption from the copy grade: `grep cp M` reads, so a verb word
 *        in a reader's args is a pattern or a path, never a command it runs
 * .note = a closed list on purpose. an unlisted command with a verb word beside a
 *         memory path blocks; a false block is a nudge, a false pass is a lost lesson
 */
const BASH_READER_COMMANDS = [
  'cat',
  'grep',
  'egrep',
  'fgrep',
  'rg',
  'head',
  'tail',
  'less',
  'more',
  'ls',
  'echo',
  'printf',
  'wc',
  'stat',
  'file',
  'diff',
  'jq',
];

/**
 * .what = whether a shell word only sets up the command after it
 * .why = an env assignment or a prefix like `sudo` is not the command itself
 */
const isBashCommandPrefix = (input: { word: string }): boolean =>
  /^\w+=/.test(input.word) ||
  BASH_COMMAND_PREFIXES.includes(asBashWordBare({ word: input.word }));

/**
 * .what = whether a simple command only reads
 * .why = a reader's args are data; but a reader exempts its whole command, so the
 *        exemption must fail safe
 *   - a `$(…)`, `<(…)`, or backtick runs a command inside it, even inside quotes
 *   - an operator left outside quotes (`&`, `;`, `|`, a paren, a newline) means the
 *     split missed a cut, so the words may hold a second command; no exemption
 */
const isBashReaderSegment = (input: { segment: string }): boolean => {
  const words = input.segment.trim().split(/\s+/);
  const wordCommand = words.find((word) => !isBashCommandPrefix({ word }));
  if (!wordCommand) return false;
  if (/\$\(|<\(|`/.test(input.segment)) return false;
  if (/[&;|()\n]/.test(asBashQuotesMasked({ command: input.segment })))
    return false;
  return BASH_READER_COMMANDS.includes(asBashWordBare({ word: wordCommand }));
};

/**
 * .what = the copy verb a simple command may run, if any
 * .why = shell grammar has no end of wrappers (`do cp`, `bash -c "cp`, `xargs cp`,
 *        `find -exec cp`), so a verb counts wherever it sits as a whole word;
 *        only a known reader is exempt, which makes a miss block, never pass
 */
export const getOneBashCopyVerb = (input: {
  segment: string;
}): BashCopyVerb | null => {
  if (isBashReaderSegment({ segment: input.segment })) return null;
  const names = input.segment
    .trim()
    .split(/\s+/)
    .map((word) => asBashWordBare({ word }));
  return (
    names
      .map((name) => BASH_COPY_VERBS.find((verb) => verb === name) ?? null)
      .find((verb) => verb !== null) ?? null
  );
};
