import { BadRequestError } from 'helpful-errors';
import * as path from 'path';
import { getAvailableBrains, getAvailableBrainsInWords } from 'rhachet/brains';

import { FLAGS_OF_DISPATCHER } from '@src/contract/cli/FLAGS_OF_DISPATCHER';
import { genReviewBrain } from '@src/domain.operations/brain/genReviewBrain';
import { getInvocationArgs } from '@src/domain.operations/cli/getInvocationArgs';
import { getAllAnnotations } from '@src/domain.operations/reflect/annotation/getAllAnnotations';
import { setAnnotation } from '@src/domain.operations/reflect/annotation/setAnnotation';
import { getAllSavepoints } from '@src/domain.operations/reflect/savepoint/getAllSavepoints';
import { getOneSavepoint } from '@src/domain.operations/reflect/savepoint/getOneSavepoint';
import { setSavepoint } from '@src/domain.operations/reflect/savepoint/setSavepoint';
import { getReflectScope } from '@src/domain.operations/reflect/scope/getReflectScope';
import { backupSnapshots } from '@src/domain.operations/reflect/snapshot/backupSnapshots';
import { captureSnapshot } from '@src/domain.operations/reflect/snapshot/captureSnapshot';
import { getAllSnapshots } from '@src/domain.operations/reflect/snapshot/getAllSnapshots';
import { getOneSnapshot } from '@src/domain.operations/reflect/snapshot/getOneSnapshot';
import { stepReflect } from '@src/domain.operations/reflect/stepReflect';

import { asConstraintErrorHeader } from './asConstraintErrorHeader';

/**
 * .what = default brain for reflect skill
 * .why = anthropic/claude/sonnet-4 is effective for rule extraction and synthesis
 *
 * .note = PINNED, deliberately (rule.require.versionless-brain-defaults, its false-positive
 *         clause). `rhachet-brains-anthropic` registers versioned slugs only, so no
 *         versionless anthropic slug exists to name. move to a versionless tier slug once
 *         one is registered for this model line
 */
const DEFAULT_BRAIN = 'anthropic/claude/sonnet-4';

/**
 * .what = prints help message with available brains
 * .why = enables humans to discover available brain options
 */
const printHelp = async (): Promise<void> => {
  const { atoms, repls } = await getAvailableBrains();
  const brainsInWords = getAvailableBrainsInWords({
    atoms,
    repls,
    choice: '',
  });

  console.log(
    `
reflect - extract rules from feedback and propose to target

usage:
  reflect.sh [options]

options:
  --source <path>     source directory with feedback files (required)
  --target <path>     target directory for rules (required)
  --mode <mode>       reflect mode: push or pull (default: pull)
  --force             create target directory if it does not exist
  --brain <slug>      brain to use for reflection (default: ${DEFAULT_BRAIN})
  --help              show this help message

${brainsInWords}
`.trim(),
  );
};

/**
 * .what = checks if help flag is present in args
 * .why = enables early exit for help display
 */
const hasHelpFlag = (argv: string[]): boolean => {
  return argv.includes('--help') || argv.includes('-h');
};

/**
 * .what = the long flags `reflect` reads, plus the dispatcher's own
 * .why = the allowlist the parser checks, so an unknown flag refuses by name
 */
const FLAGS_KNOWN_OF_REFLECT: ReadonlySet<string> = new Set([
  'source',
  'target',
  'mode',
  'force',
  'brain',
  'help',
  ...FLAGS_OF_DISPATCHER,
]);

/**
 * .what = parses cli args into options object
 * .why = simple arg parser without external dependencies; exported so the flag contract
 *        is testable without a brain round-trip
 */
export const parseReflectArgs = (
  argv: string[],
): {
  source: string;
  target: string;
  mode: 'push' | 'pull';
  force: boolean;
  brain: string;
  /** flags typed with no value — refused by the caller, never run on a default */
  valuelessFlags: string[];
  /** flags this parser does not read — refused by the caller, never dropped in silence */
  unknownFlags: string[];
} => {
  // the caller args, eval-mode offset and `--` handled in one shared place
  const args = getInvocationArgs(argv);

  // .note = deliberate mutation, and a SCOPED ZONE: `options`, the two flag lists, and the
  //         cursor `i` are born in this call and none escapes — only the typed record built
  //         below does. the cursor must advance by two past a flag's value, which a
  //         map/reduce cannot express without a second index (rule.require.immutable-vars)
  const options: Record<string, string | boolean> = {};
  const flagsValueless: string[] = [];
  const flagsUnknown: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    if (arg.startsWith('--')) {
      const key = arg.slice(2);

      // a flag this parser does not read is recorded, so a typo never runs as though heard
      if (!FLAGS_KNOWN_OF_REFLECT.has(key)) {
        flagsUnknown.push(arg);
        continue;
      }

      // handle boolean flags
      if (key === 'force') {
        options[key] = true;
        continue;
      }

      // a flag typed with its value forgotten is recorded, never read as absent — a bare
      // `--target` must not fall through to a default (rule.forbid.unexpected-defaults)
      const value = args[i + 1];
      if (!value || value.startsWith('--')) {
        flagsValueless.push(arg);
        continue;
      }
      options[key] = value;
      i++;
    }
  }

  return {
    source: options.source as string,
    target: options.target as string,
    mode: (options.mode as 'push' | 'pull') ?? 'pull',
    force: (options.force as boolean) ?? false,
    brain: (options.brain as string) ?? DEFAULT_BRAIN,
    valuelessFlags: flagsValueless,
    unknownFlags: flagsUnknown,
  };
};

/**
 * .what = cli entrypoint for reflect skill
 * .why = enables shell invocation via package-level import
 */
export const reflect = async (): Promise<void> => {
  // handle --help flag
  if (hasHelpFlag(process.argv)) {
    await printHelp();
    return;
  }

  // parse args
  const options = parseReflectArgs(process.argv);

  // an unknown flag refuses in the `🌕` frame, before any brain cost is paid
  if (options.unknownFlags.length > 0) {
    console.error('🌕 reflect');
    console.error(
      `   ├─ ✋ ConstraintError: unknown flag ${options.unknownFlags.join(', ')}`,
    );
    console.error('   └─ fix: run with --help for the flags reflect reads');
    process.exit(2);
  }

  // a flag typed with no value refuses in the `🌕` frame, before any brain cost is paid
  if (options.valuelessFlags.length > 0) {
    console.error('🌕 reflect');
    console.error(
      `   ├─ ✋ ConstraintError: ${options.valuelessFlags.join(', ')} given with no value`,
    );
    console.error('   └─ fix: run with --help for the value each one expects');
    process.exit(2);
  }

  // invoke stepReflect with validation error handler
  try {
    // create brain context via discovery with credentials
    // uses env: 'prep' to match review; reviewers always target ehmpath/prep creds
    // keyrack auto-unlocks locked keys internally when the brain fetches its own
    // creds (rhachet >=1.43 get-or-unlock), so no upfront unlock is needed
    // inside the try so a bad --brain hits the catch below and prints
    // ConstraintError instead of a raw BadRequestError rejection
    const { brain } = await genReviewBrain({ choice: options.brain });

    await stepReflect(
      {
        source: options.source,
        target: options.target,
        mode: options.mode,
        force: options.force,
      },
      { brain },
    );
  } catch (error) {
    // the refusal wears the `🌕` frame every other reflect refusal does (i018 r013 nitpick.4)
    if (error instanceof BadRequestError) {
      // the headline alone, as the capture refusal does — helpful-errors appends its
      // metadata as raw json, so the hint it carries gets its own `fix:` row instead
      const headline = asConstraintErrorHeader({ error }).split('\n')[0];
      const hint =
        typeof error.metadata?.hint === 'string' ? error.metadata.hint : null;
      console.error('🌕 reflect');
      console.error(`   ${hint ? '├─' : '└─'} ${headline}`);
      if (hint) console.error(`   └─ fix: ${hint}`);
      process.exit(2);
    }
    throw error;
  }
};

/**
 * .what = prints owl-vibed header
 * .why = consistent output format across all reflect commands
 */
const printOwlHeader = (): void => {
  console.log('🦉 know thyself\n');
};

/**
 * .what = formats bytes into human-readable string
 * .why = enables readable output for file sizes
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 bytes';
  const k = 1024;
  const sizes = ['bytes', 'kb', 'mb', 'gb'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))}${sizes[i]}`;
};

/**
 * .what = replaces $HOME with ~/ in path strings
 * .why = enables concise, readable output for paths
 */
const asHomePath = (pathStr: string): string => {
  const home = process.env.HOME;
  if (!home) return pathStr;
  if (pathStr.startsWith(home)) {
    return pathStr.replace(home, '~');
  }
  return pathStr;
};

/**
 * .what = cli entrypoint for reflect.snapshot capture
 * .why = enables shell invocation to capture experience snapshots
 */
export const reflectSnapshotCapture = async (): Promise<void> => {
  printOwlHeader();

  const scope = getReflectScope({ cwd: process.cwd() });
  const snapshot = await captureSnapshot({ scope }).catch((error: unknown) => {
    // a caller-fix refusal wears the frame every other reflect refusal does, never a
    // stack (rule.require.qualified-error-headers, rule.forbid.stdout-on-exit-errors)
    if (!(error instanceof BadRequestError)) throw error;
    console.error(`🌕 reflect.snapshot capture`);
    // the headline alone — helpful-errors appends its metadata to the message, and the
    // fix line below already states the hint it carries
    const headline = asConstraintErrorHeader({ error }).split('\n')[0];
    console.error(`   ├─ ${headline}`);
    console.error(
      `   └─ fix: run claude code in this repo once, then capture again`,
    );
    return process.exit(2);
  });

  console.log(`🌕 reflect.snapshot capture`);
  console.log(`   ├─ repo = ${scope.gitRepoName}`);
  console.log(`   ├─ tree = ${scope.worktreeName}`);
  console.log(`   ├─ branch = ${scope.branch}`);
  console.log(`   │`);
  console.log(`   ├─ transcript`);
  console.log(
    `   │  ├─ sessions = ${snapshot.metadata.transcript.sessionCount}`,
  );
  console.log(`   │  └─ files = ${snapshot.metadata.transcript.fileCount}`);
  console.log(`   │`);
  console.log(
    `   ├─ savepoints = ${snapshot.metadata.savepoints.count} (+1 fresh at ${snapshot.metadata.savepoints.freshTimestamp})`,
  );
  console.log(`   ├─ annotations = ${snapshot.metadata.annotations.count}`);
  console.log(`   │`);
  console.log(`   └─ artifacts`);
  console.log(`      └─ ${asHomePath(snapshot.path)}`);
  console.log(`\n✨ snapshot captured\n`);
};

/**
 * .what = parses --at argument from argv
 * .why = enables timestamp selection for get commands
 */
const parseAtArg = (argv: string[]): string | null => {
  const atIndex = argv.indexOf('--at');
  if (atIndex === -1 || atIndex >= argv.length - 1) return null;
  return argv[atIndex + 1] ?? null;
};

/**
 * .what = cli entrypoint for reflect.snapshot get
 * .why = enables shell invocation to browse and list snapshots
 */
export const reflectSnapshotGet = async (): Promise<void> => {
  printOwlHeader();

  const scope = getReflectScope({ cwd: process.cwd() });
  const at = parseAtArg(process.argv);

  // --at names one snapshot; with no --at, every snapshot of the scope is listed
  if (at) printSnapshotOfAt({ scope, at });
  if (!at) printSnapshotList({ scope });
  console.log('');
};

/**
 * .what = prints the one snapshot `--at` names, or refuses with exit 2 when none matches
 * .why = one named act per branch of `reflect.snapshot get`, so the entrypoint reads as a
 *        choice of two acts rather than an if/else a reader must step through (r009 nitpick.5,
 *        i013). the bytes it prints are unchanged
 */
const printSnapshotOfAt = (input: {
  scope: ReturnType<typeof getReflectScope>;
  at: string;
}): void => {
  const { scope, at } = input;
  const snapshot = getOneSnapshot({ scope, at });
  if (!snapshot) {
    // a bad --at is the caller's to fix, so stderr and exit 2
    // (rule.require.exit-code-semantics, rule.forbid.stdout-on-exit-errors)
    console.error(`🌕 reflect.snapshot get --at ${at}`);
    console.error(`   ├─ ✋ ConstraintError: snapshot not found`);
    console.error(`   └─ fix: list the snapshots, then pass one of theirs`);
    console.error(`      └─ rhx reflect.snapshot get`);
    process.exit(2);
  }

  console.log(`🌕 reflect.snapshot get --at ${at}`);
  console.log(`   ├─ repo = ${scope.gitRepoName}`);
  console.log(`   ├─ tree = ${scope.worktreeName}`);
  console.log(`   ├─ branch = ${scope.branch}`);
  console.log(`   │`);
  console.log(`   ├─ transcript`);
  console.log(
    `   │  ├─ sessions = ${snapshot.metadata.transcript.sessionCount}`,
  );
  console.log(`   │  └─ files = ${snapshot.metadata.transcript.fileCount}`);
  console.log(`   │`);
  console.log(`   ├─ savepoints = ${snapshot.metadata.savepoints.count}`);
  console.log(`   ├─ annotations = ${snapshot.metadata.annotations.count}`);
  console.log(`   ├─ size = ${formatBytes(snapshot.sizeBytes)}`);
  console.log(`   │`);
  console.log(`   └─ path = ${asHomePath(snapshot.path)}`);
};

/**
 * .what = prints every snapshot of the scope, or the bare size line when there are none
 * .why = the list branch of `reflect.snapshot get`, named; an empty list returns early
 */
const printSnapshotList = (input: {
  scope: ReturnType<typeof getReflectScope>;
}): void => {
  const { scope } = input;
  const summary = getAllSnapshots({ scope });
  const annotations = getAllAnnotations({ scope });

  console.log(`🌕 reflect.snapshot get`);
  console.log(`   ├─ repo = ${scope.gitRepoName}`);
  console.log(`   ├─ tree = ${scope.worktreeName}`);
  console.log(`   ├─ branch = ${scope.branch}`);
  console.log(`   │`);
  console.log(`   ├─ snapshots = ${summary.count}`);
  console.log(`   ├─ annotations = ${annotations.count}`);

  // no snapshots → the size line closes the tree
  if (summary.snapshots.length === 0) {
    console.log(`   └─ size = ${formatBytes(summary.totalBytes)}`);
    return;
  }

  // one branch per snapshot, its path beneath it
  console.log(`   ├─ size = ${formatBytes(summary.totalBytes)}`);
  console.log(`   │`);
  console.log(`   └─ list`);
  summary.snapshots.forEach((snap, index) => {
    const isLast = index === summary.snapshots.length - 1;
    const prefix = isLast ? '└─' : '├─';
    const continuation = isLast ? ' ' : '│';
    const meta = snap.metadata;
    const stats = meta
      ? `(sessions=${meta.transcript.sessionCount}, savepoints=${meta.savepoints.count})`
      : '';
    console.log(`      ${prefix} ${snap.timestamp} ${stats}`);
    console.log(`      ${continuation}  └─ ${asHomePath(snap.path)}`);
  });
};

/**
 * .what = parses positional text argument from argv
 * .why = enables text extraction for annotate command
 */
const parseTextArg = (argv: string[]): string => {
  // the caller args, eval-mode offset and `--` handled in one shared place
  const args = getInvocationArgs(argv);

  // find first non-flag arg
  // .note = deliberate mutation, and a SCOPED ZONE: the cursor `i` is born in this loop and
  //         never escapes. it advances by two past a flag's value, so a flag's value is never
  //         read as the positional text (rule.require.immutable-vars, scoped zone)
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;
    if (!arg.startsWith('--')) {
      return arg;
    }
    // skip flag values
    if (arg.startsWith('--') && args[i + 1] && !args[i + 1]?.startsWith('--')) {
      i++;
    }
  }
  return '';
};

/**
 * .what = cli entrypoint for reflect.snapshot annotate
 * .why = enables shell invocation to annotate timeline moments
 */
export const reflectSnapshotAnnotate = async (): Promise<void> => {
  printOwlHeader();

  const scope = getReflectScope({ cwd: process.cwd() });
  const text = parseTextArg(process.argv);

  if (!text) {
    console.error(`🌕 reflect.snapshot annotate`);
    console.error(`   └─ ✋ ConstraintError: annotation text required`);
    console.error('');
    console.error(
      'usage: rhx reflect.snapshot.annotate "your annotation text"',
    );
    process.exit(2);
  }

  const annotation = setAnnotation({ scope, text });

  console.log(`🌕 reflect.snapshot annotate`);
  console.log(`   ├─ repo = ${scope.gitRepoName}`);
  console.log(`   ├─ tree = ${scope.worktreeName}`);
  console.log(`   ├─ branch = ${scope.branch}`);
  console.log(`   │`);
  console.log(`   └─ annotation = ${asHomePath(annotation.path)}`);
  console.log(`\n✨ annotated\n`);
};

/**
 * .what = parses --into argument from argv
 * .why = enables s3 uri extraction for backup command
 */
const parseIntoArg = (argv: string[]): string | null => {
  const intoIndex = argv.indexOf('--into');
  if (intoIndex === -1 || intoIndex >= argv.length - 1) return null;
  return argv[intoIndex + 1] ?? null;
};

/**
 * .what = cli entrypoint for reflect.snapshot backup
 * .why = enables shell invocation to backup snapshots to s3
 */
export const reflectSnapshotBackup = async (): Promise<void> => {
  printOwlHeader();

  const into = parseIntoArg(process.argv);

  if (!into) {
    console.error(`🌕 reflect.snapshot backup`);
    console.error(`   └─ ✋ ConstraintError: --into s3://bucket required`);
    console.error('');
    console.error('usage: rhx reflect.snapshot.backup --into s3://my-bucket');
    process.exit(2);
  }

  const scope = getReflectScope({ cwd: process.cwd() });
  const sourceDir = `${scope.storagePath}/snapshots`;

  // a caller-fix refusal (a bad uri, absent aws credentials) wears the frame every other
  // reflect refusal does, never a stack (rule.require.qualified-error-headers)
  const result = (() => {
    try {
      return backupSnapshots({ sourceDir, into });
    } catch (error) {
      if (!(error instanceof BadRequestError)) throw error;
      console.error(`🌕 reflect.snapshot backup`);
      const headline = asConstraintErrorHeader({ error }).split('\n')[0];
      console.error(`   ├─ ${headline}`);
      console.error(
        `   └─ fix: pass --into s3://<bucket>, with aws credentials set`,
      );
      return process.exit(2);
    }
  })();

  console.log(`🌕 reflect.snapshot backup`);
  console.log(`   ├─ source = ${asHomePath(result.sourceDir)}`);
  console.log(`   ├─ target = ${result.targetUri}`);
  console.log(`   │`);
  console.log(`   ├─ files = ${result.fileCount}`);
  console.log(`   └─ size = ${formatBytes(result.totalBytes)}`);
  console.log(`\n✨ synced\n`);
};

/**
 * .what = parses --mode argument from argv
 * .why = enables mode selection for savepoint set command
 */
const parseModeArg = (argv: string[]): 'plan' | 'apply' => {
  const modeIndex = argv.indexOf('--mode');
  if (modeIndex === -1 || modeIndex >= argv.length - 1) return 'plan';
  const mode = argv[modeIndex + 1];
  if (mode === 'apply') return 'apply';
  return 'plan';
};

/**
 * .what = cli entrypoint for reflect.savepoint set
 * .why = enables shell invocation to capture code state savepoints
 */
export const reflectSavepointSet = async (): Promise<void> => {
  printOwlHeader();

  const scope = getReflectScope({ cwd: process.cwd() });
  const mode = parseModeArg(process.argv);

  const savepoint = setSavepoint({ scope, mode });

  console.log(`🌕 reflect.savepoint set`);
  console.log(`   ├─ repo = ${scope.gitRepoName}`);
  console.log(`   ├─ tree = ${scope.worktreeName}`);
  console.log(`   ├─ branch = ${scope.branch}`);
  console.log(`   │`);
  console.log(`   ├─ commit = ${savepoint.commit.hash.slice(0, 7)}`);
  console.log(
    `   ├─ staged.patch = ${formatBytes(savepoint.patches.stagedBytes)}`,
  );
  console.log(
    `   ├─ unstaged.patch = ${formatBytes(savepoint.patches.unstagedBytes)}`,
  );

  console.log(`   ├─ patches.hash = ${savepoint.patches.hash}`);
  console.log(`   │`);
  console.log(`   └─ artifacts`);
  console.log(`      ├─ ${asHomePath(savepoint.patches.stagedPath)}`);
  console.log(`      └─ ${asHomePath(savepoint.patches.unstagedPath)}`);

  if (mode === 'plan') {
    console.log(`\n✨ savepoint planned (use --mode apply to write)\n`);
  } else {
    console.log(`\n✨ savepoint captured\n`);
  }
};

/**
 * .what = cli entrypoint for reflect.savepoint get
 * .why = enables shell invocation to browse and list savepoints
 */
export const reflectSavepointGet = async (): Promise<void> => {
  printOwlHeader();

  const scope = getReflectScope({ cwd: process.cwd() });
  const at = parseAtArg(process.argv);

  // --at names one savepoint; with no --at, every savepoint of the scope is listed
  if (at) printSavepointOfAt({ scope, at });
  if (!at) printSavepointList({ scope });
  console.log('');
};

/**
 * .what = prints the one savepoint `--at` names, or refuses with exit 2 when none matches
 * .why = one named act per branch of `reflect.savepoint get` (r009 nitpick.5, i013). the
 *        bytes it prints are unchanged
 */
const printSavepointOfAt = (input: {
  scope: ReturnType<typeof getReflectScope>;
  at: string;
}): void => {
  const { scope, at } = input;
  const savepoint = getOneSavepoint({ scope, at });
  if (!savepoint) {
    console.error(`🌕 reflect.savepoint get --at ${at}`);
    console.error(`   ├─ ✋ ConstraintError: savepoint not found`);
    console.error(`   └─ fix: list the savepoints, then pass one of theirs`);
    console.error(`      └─ rhx reflect.savepoint get`);
    process.exit(2);
  }

  console.log(`🌕 reflect.savepoint get --at ${at}`);
  console.log(`   ├─ commit = ${savepoint.commit.hash.slice(0, 7)}`);
  console.log(
    `   ├─ staged.patch = ${formatBytes(savepoint.patches.stagedBytes)}`,
  );
  console.log(`   │  └─ ${asHomePath(savepoint.patches.stagedPath)}`);
  console.log(`   │`);
  console.log(
    `   └─ unstaged.patch = ${formatBytes(savepoint.patches.unstagedBytes)}`,
  );
  console.log(`      └─ ${asHomePath(savepoint.patches.unstagedPath)}`);
};

/**
 * .what = prints every savepoint of the scope, or the bare size line when there are none
 * .why = the list branch of `reflect.savepoint get`, named; an empty list returns early
 */
const printSavepointList = (input: {
  scope: ReturnType<typeof getReflectScope>;
}): void => {
  const { scope } = input;
  const summary = getAllSavepoints({ scope });

  console.log(`🌕 reflect.savepoint get`);
  console.log(`   ├─ repo = ${scope.gitRepoName}`);
  console.log(`   ├─ tree = ${scope.worktreeName}`);
  console.log(`   ├─ branch = ${scope.branch}`);
  console.log(`   │`);
  console.log(`   ├─ savepoints = ${summary.count}`);

  // no savepoints → the size line closes the tree
  if (summary.savepoints.length === 0) {
    console.log(`   └─ size = ${formatBytes(summary.totalBytes)}`);
    return;
  }

  // one branch per savepoint, its two patch files beneath it
  console.log(`   ├─ size = ${formatBytes(summary.totalBytes)}`);
  console.log(`   │`);
  console.log(`   └─ list`);
  summary.savepoints.forEach((sp, index) => {
    const isLast = index === summary.savepoints.length - 1;
    const prefix = isLast ? '└─' : '├─';
    const size = sp.patches.stagedBytes + sp.patches.unstagedBytes;
    const continuation = isLast ? ' ' : '│';
    console.log(
      `      ${prefix} ${sp.timestamp} (commit=${sp.commit.hash.slice(0, 7)}, patches=${sp.patches.hash.slice(0, 7)}, ${formatBytes(size)})`,
    );
    console.log(
      `      ${continuation}  ├─ ${path.basename(sp.patches.stagedPath)}`,
    );
    console.log(
      `      ${continuation}  └─ ${path.basename(sp.patches.unstagedPath)}`,
    );
  });
};
