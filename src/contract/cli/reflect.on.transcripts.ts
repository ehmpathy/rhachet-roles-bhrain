import { asCloneTranscriptsRanked } from '@src/domain.operations/reflect/transcripts/asCloneTranscriptsRanked';
import { formatCloneTranscriptsTree } from '@src/domain.operations/reflect/transcripts/formatCloneTranscriptsTree';
import { getAllCloneTranscripts } from '@src/domain.operations/reflect/transcripts/getAllCloneTranscripts';

/**
 * .what = the usage tree for `--help`
 * .why = a human learns the command from `--help` alone
 */
const USAGE = [
  '🦉 the pond remembers who spoke',
  '',
  '🌕 reflect.on.transcripts',
  '   ├─ .what = each clone session of this repo, newest human prompt first, with how to resume it',
  '   ├─ usage',
  '   │  └─ rhx reflect.on.transcripts [--all] [--limit <n>] [--min-prompts <n>] [--session <id>]',
  '   ├─ options',
  '   │  ├─ --all               every tree under each actor (default: this tree only)',
  '   │  ├─ --limit <n>         sessions to show (default: 10)',
  '   │  ├─ --min-prompts <n>   hide sessions with fewer human prompts (default: 2)',
  '   │  ├─ --session <id>      one session, by id or id prefix',
  '   │  └─ --help, -h          show this usage',
  '   ├─ notes',
  '   │  ├─ a human prompt is a turn the human typed; hook output and tool results are not',
  '   │  ├─ each clone runs under .agent/.actors/<actor>/brain/.claude; the human under ~/.claude',
  '   │  └─ one session id can sit under two actors after a fork; the resume line names the dir',
  '   └─ examples',
  '      ├─ rhx reflect.on.transcripts',
  '      ├─ rhx reflect.on.transcripts --limit 3',
  '      └─ rhx reflect.on.transcripts --session 28230521',
  '',
].join('\n');

/**
 * .what = the flags this command reads, plus the outer dispatcher's own
 * .why = `rhachet run --skill <x> --repo <y>` forwards its argv whole
 */
const FLAGS_VALUED = new Set(['limit', 'min-prompts', 'session']);
const FLAGS_BARE = new Set(['all', 'help']);
const FLAGS_DISPATCH = new Set(['skill', 'repo', 'role', 'mode']);

/**
 * .what = the parsed options, or the fault that names the bad flag
 * .why = a typo like `--limt` must halt, never fall back to a default in silence
 */
const asOptionsFromArgv = (input: {
  argv: string[];
}):
  | {
      options: {
        scope: 'tree' | 'all';
        limit: number;
        minPrompts: number;
        session: string | null;
      };
    }
  | { fault: string } => {
  const flags = input.argv.filter(
    (arg) => arg.startsWith('--') && arg !== '--',
  );
  const unknown = flags.filter((arg) => {
    const name = arg.slice(2);
    return (
      !FLAGS_VALUED.has(name) &&
      !FLAGS_BARE.has(name) &&
      !FLAGS_DISPATCH.has(name)
    );
  });
  if (unknown.length > 0)
    return { fault: `unrecognized flag(s): ${unknown.join(', ')}` };

  const asFlagValue = (name: string): string | null => {
    const index = input.argv.indexOf(`--${name}`);
    if (index < 0) return null;
    const value = input.argv[index + 1];
    return value && !value.startsWith('--') ? value : '';
  };
  const asCount = (name: string, fallback: number): number | string => {
    const value = asFlagValue(name);
    if (value === null) return fallback;
    if (!/^[0-9]+$/.test(value))
      return `--${name} needs a whole number, got "${value}"`;
    return Number(value);
  };

  const limit = asCount('limit', 10);
  if (typeof limit === 'string') return { fault: limit };
  const minPrompts = asCount('min-prompts', 2);
  if (typeof minPrompts === 'string') return { fault: minPrompts };
  const session = asFlagValue('session');
  if (session === '') return { fault: '--session needs an id or an id prefix' };
  return {
    options: {
      scope: input.argv.includes('--all') ? 'all' : 'tree',
      limit,
      minPrompts,
      session,
    },
  };
};

/**
 * .what = cli entrypoint for reflect.on.transcripts
 * .why = finds the session a human spoke to, across every clone of this repo; exit 2 on a
 *        bad flag, with the fix on stderr
 */
export const reflectOnTranscripts = async (): Promise<void> => {
  const argv = process.argv;
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(USAGE);
    return;
  }

  // a bad flag halts before any read
  const parsed = asOptionsFromArgv({ argv });
  if ('fault' in parsed) {
    process.stderr.write(
      [
        '✋ ConstraintError: reflect.on.transcripts: ' + parsed.fault,
        '   └─ fix: rhx reflect.on.transcripts --help',
        '',
      ].join('\n'),
    );
    process.exitCode = 2;
    return;
  }

  // read, rank, render
  const transcripts = await getAllCloneTranscripts({
    repoRoot: process.cwd(),
    cwd: process.cwd(),
    scope: parsed.options.scope,
    session: parsed.options.session,
    env: {
      CLAUDE_CONFIG_DIR: process.env.CLAUDE_CONFIG_DIR ?? null,
      HOME: process.env.HOME ?? null,
    },
  });
  const ranked = asCloneTranscriptsRanked({
    transcripts,
    minPrompts: parsed.options.session ? 0 : parsed.options.minPrompts,
    limit: parsed.options.limit,
  });
  process.stdout.write(
    formatCloneTranscriptsTree({
      ...ranked,
      scope: parsed.options.scope,
      minPrompts: parsed.options.session ? 0 : parsed.options.minPrompts,
      session: parsed.options.session,
    }),
  );
};
