import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';

import { asErrorFacts } from '@src/domain.operations/reflect/tokens/asErrorFacts';
import { asTokenProposal } from '@src/domain.operations/reflect/tokens/asTokenProposal';
import { formatTokenSpendErrorTree } from '@src/domain.operations/reflect/tokens/formatTokenSpendErrorTree';
import { formatTokenSpendTree } from '@src/domain.operations/reflect/tokens/formatTokenSpendTree';
import { getOneTokenSpendReport } from '@src/domain.operations/reflect/tokens/getOneTokenSpendReport';

/**
 * .what = the usage tree for `--help`
 * .why = a human learns the command from `--help` alone
 */
const USAGE = [
  '🦉 the pond reflects what it was fed',
  '',
  '🌕 reflect.on.token.spend',
  '   ├─ .what = where a claude transcript spent its tokens, and what each part cost to keep',
  '   ├─ usage',
  '   │  └─ rhx reflect.on.token.spend [--from <selector>]...',
  '   ├─ options',
  '   │  ├─ --from (repeatable; default = @current)',
  '   │  │  ├─ @current          this session (CLAUDE_CODE_SESSION_ID), else the newest in this dir',
  '   │  │  ├─ <path>.jsonl      one transcript file',
  '   │  │  ├─ <uuid>            a session id, found under the claude projects roots',
  "   │  │  └─ '<glob>'          many transcripts, summed as a corpus (quote it)",
  '   │  └─ --help, -h           show this usage',
  '   ├─ notes',
  '   │  ├─ the proposal ranks by price when every repaid row is priced, else by tokens',
  "   │  ├─ a model's spec with no rate for a kind (e.g. the 1h cache write) leaves it unpriced",
  '   │  ├─ each inventory row names how its count was found',
  '   │  │  ├─ [measured]       read straight from message.usage',
  '   │  │  ├─ [exact]          the whole of a context rise in which one category arrived',
  '   │  │  ├─ [apportioned]    a context rise split across categories by byte share',
  '   │  │  └─ [unattributed]   a rise no record explains',
  '   │  └─ a rebase is a call where the context re-based; blocks held before it end there',
  '   │     ├─ compaction       the first call after a compaction record',
  '   │     └─ shrink           the context fell with no compaction record to explain it',
  '   └─ examples',
  '      ├─ rhx reflect.on.token.spend',
  '      ├─ rhx reflect.on.token.spend --from ~/.claude/projects/-home-me-repo/8f27….jsonl',
  "      └─ rhx reflect.on.token.spend --from '~/.claude/projects/-home-me-repo/*.jsonl'",
  '',
].join('\n');

/**
 * .what = the `--from` selectors in argv
 * .why = `--from` repeats; each value is one selector
 */
const asSelectorsFromArgv = (input: { argv: string[] }): string[] => {
  const selectors = input.argv.flatMap((arg, index) => {
    if (arg !== '--from') return [];
    const value = input.argv[index + 1];
    if (!value || value.startsWith('--'))
      throw new BadRequestError('--from needs a value', {
        hint: 'pass a path, a session uuid, a quoted glob, or @current',
        hintRun: 'rhx reflect.on.token.spend --from @current',
      });
    return [value];
  });
  return selectors.length ? selectors : ['@current'];
};

/**
 * .what = the flags this command reads, plus the outer dispatcher's own
 * .why = `rhachet run --skill <x> --repo <y>` forwards its argv whole, so its own flags
 *        reach us too; they are known and read by naught here
 */
const FLAGS_KNOWN = new Set(['from', 'help', 'skill', 'repo', 'role', 'mode']);

/**
 * .what = the flags in argv this command does not know
 * .why = a typo like `--form` must halt, never fall back to `@current` in silence
 * .note = the whole argv is scanned: under `node -e` the entry path is absent, so a fixed
 *         slice would drop a real arg; the node binary path never opens with `--`
 */
const asUnknownFlagsFromArgv = (input: { argv: string[] }): string[] =>
  input.argv.filter(
    (arg) =>
      arg.startsWith('--') && arg !== '--' && !FLAGS_KNOWN.has(arg.slice(2)),
  );

/**
 * .what = lets a reader that closes stdout early end the run quietly
 * .why = `| head` closes the pipe once it has its lines; the rest of the tree has no
 *        reader, which is the reader's choice, not a fault — so no node stack, no `💥`
 * .note = only EPIPE is absorbed; any other stream error still throws
 */
const withQuietClosedPipe = (): void => {
  process.stdout.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EPIPE') return;
    throw error;
  });
};

/**
 * .what = cli entrypoint for reflect.on.token.spend
 * .why = reports a transcript's token spend as a tree; exit 2 on a constraint,
 *        exit 1 on a malfunction, each with its cause on stderr
 */
export const reflectOnTokenSpend = async (): Promise<void> => {
  withQuietClosedPipe();
  const argv = process.argv;
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(USAGE);
    return;
  }

  try {
    // an unknown flag halts before any read
    const unknownFlags = asUnknownFlagsFromArgv({ argv });
    if (unknownFlags.length > 0)
      throw new BadRequestError('unrecognized flag(s)', {
        flags: unknownFlags,
        hint: 'the only flag is --from (repeatable); see --help',
        hintRun: 'rhx reflect.on.token.spend --help',
      });

    const report = await getOneTokenSpendReport({
      selectors: asSelectorsFromArgv({ argv }),
      cwd: process.cwd(),
      env: {
        CLAUDE_CONFIG_DIR: process.env.CLAUDE_CONFIG_DIR ?? null,
        CLAUDE_CODE_SESSION_ID: process.env.CLAUDE_CODE_SESSION_ID ?? null,
        HOME: process.env.HOME ?? null,
      },
    });
    const proposal = asTokenProposal({ repaid: report.repaid, limit: 3 });
    process.stdout.write(formatTokenSpendTree({ report, proposal }));
  } catch (error) {
    // .note = this helpful-errors version names the caller-must-fix class BadRequestError
    //         and the system-must-fix class UnexpectedCodePathError; the header names
    //         the class by who must act, so a human reads one vocabulary
    // .note = the exit code is set, never forced: `process.exit` would cut a piped stderr
    //         before it drains, so a long error tree could reach the human truncated
    if (error instanceof BadRequestError) {
      process.stderr.write(
        formatTokenSpendErrorTree({
          header: '✋ ConstraintError',
          ...asErrorFacts({ error }),
        }),
      );
      process.exitCode = 2;
      return;
    }
    if (error instanceof UnexpectedCodePathError) {
      process.stderr.write(
        formatTokenSpendErrorTree({
          header: '💥 MalfunctionError',
          ...asErrorFacts({ error }),
        }),
      );
      process.exitCode = 1;
      return;
    }
    throw error;
  }
};
