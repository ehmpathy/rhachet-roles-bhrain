import * as path from 'path';
import {
  genContextBrain,
  getAvailableBrains,
  getAvailableBrainsInWords,
} from 'rhachet/brains';

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

/**
 * .what = default brain for reflect skill
 * .why = anthropic/claude/sonnet-4 is effective for rule extraction and synthesis
 */
const DEFAULT_BRAIN = 'anthropic/claude/sonnet-4';

/**
 * .what = prints help message with available brains
 * .why = enables users to discover available brain options
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
 * .what = detects if node was invoked via `node -e "code"` (eval mode)
 * .why = in eval mode, argv has no entrypoint path: [node, firstArg, ...]
 *        in normal mode, argv has entrypoint path: [node, file.js, firstArg, ...]
 *        we skip different counts to slice argv correctly
 */
const isNodeEvalMode = (argv: string[]): boolean => {
  // in eval mode, argv[1] is the first user arg (e.g., --source or 'hello')
  // in normal mode, argv[1] is an entrypoint file ending with .js, .ts, .mjs, .cjs
  const secondArg = argv[1];
  if (!secondArg) return false;
  const looksLikeEntrypointPath = /\.(js|ts|mjs|cjs)$/.test(secondArg);
  return !looksLikeEntrypointPath;
};

/**
 * .what = parses cli args into options object
 * .why = simple arg parser without external dependencies
 */
const parseArgs = (
  argv: string[],
): {
  source: string;
  target: string;
  mode: 'push' | 'pull';
  force: boolean;
  brain: string;
} => {
  // skip node binary (always argv[0]) and entrypoint path (only in normal mode)
  const skipCount = isNodeEvalMode(argv) ? 1 : 2;
  const args = argv.slice(skipCount).filter((arg) => arg !== '--');
  const options: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    if (arg.startsWith('--')) {
      const key = arg.slice(2);

      // handle boolean flags
      if (key === 'force') {
        options[key] = true;
        continue;
      }

      const value = args[i + 1];
      if (value && !value.startsWith('--')) {
        options[key] = value;
        i++;
      }
    }
  }

  return {
    source: options.source as string,
    target: options.target as string,
    mode: (options.mode as 'push' | 'pull') ?? 'pull',
    force: (options.force as boolean) ?? false,
    brain: (options.brain as string) ?? DEFAULT_BRAIN,
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

  // parse args and create brain context via discovery
  const options = parseArgs(process.argv);
  const brain = await genContextBrain({ choice: options.brain });

  // invoke stepReflect
  await stepReflect(
    {
      source: options.source,
      target: options.target,
      mode: options.mode,
      force: options.force,
    },
    { brain },
  );
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
  const snapshot = await captureSnapshot({ scope });

  console.log(`🌕 reflect.snapshot capture`);
  console.log(`   ├─ repo = ${scope.gitRepoName}`);
  console.log(`   ├─ tree = ${scope.worktreeName}`);
  console.log(`   ├─ branch = ${scope.branch}`);
  console.log(`   │`);
  console.log(`   ├─ transcript`);
  console.log(
    `   │  ├─ episodes = ${snapshot.metadata.transcript.episodeCount}`,
  );
  console.log(`   │  └─ mainFile = ${snapshot.metadata.transcript.mainFile}`);
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

  if (at) {
    // get specific snapshot
    const snapshot = getOneSnapshot({ scope, at });
    if (!snapshot) {
      console.log(`🌕 reflect.snapshot get --at ${at}`);
      console.log(`   └─ 💥 snapshot not found`);
      process.exit(1);
    }

    console.log(`🌕 reflect.snapshot get --at ${at}`);
    console.log(`   ├─ repo = ${scope.gitRepoName}`);
    console.log(`   ├─ tree = ${scope.worktreeName}`);
    console.log(`   ├─ branch = ${scope.branch}`);
    console.log(`   │`);
    console.log(`   ├─ transcript`);
    console.log(
      `   │  └─ episodes = ${snapshot.metadata.transcript.episodeCount}`,
    );
    console.log(`   │`);
    console.log(`   ├─ savepoints = ${snapshot.metadata.savepoints.count}`);
    console.log(`   ├─ annotations = ${snapshot.metadata.annotations.count}`);
    console.log(`   ├─ size = ${formatBytes(snapshot.sizeBytes)}`);
    console.log(`   │`);
    console.log(`   └─ path = ${asHomePath(snapshot.path)}`);
  } else {
    // list all snapshots
    const summary = getAllSnapshots({ scope });
    const annotations = getAllAnnotations({ scope });

    console.log(`🌕 reflect.snapshot get`);
    console.log(`   ├─ repo = ${scope.gitRepoName}`);
    console.log(`   ├─ tree = ${scope.worktreeName}`);
    console.log(`   ├─ branch = ${scope.branch}`);
    console.log(`   │`);
    console.log(`   ├─ snapshots = ${summary.count}`);
    console.log(`   ├─ annotations = ${annotations.count}`);

    if (summary.snapshots.length > 0) {
      console.log(`   ├─ size = ${formatBytes(summary.totalBytes)}`);
      console.log(`   │`);
      console.log(`   └─ list`);
      for (let i = 0; i < summary.snapshots.length; i++) {
        const snap = summary.snapshots[i];
        if (!snap) continue;
        const isLast = i === summary.snapshots.length - 1;
        const prefix = isLast ? '└─' : '├─';
        const continuation = isLast ? ' ' : '│';
        const meta = snap.metadata;
        const stats = meta
          ? `(episodes=${meta.transcript.episodeCount}, savepoints=${meta.savepoints.count})`
          : '';
        console.log(`      ${prefix} ${snap.timestamp} ${stats}`);
        console.log(`      ${continuation}  └─ ${asHomePath(snap.path)}`);
      }
    } else {
      console.log(`   └─ size = ${formatBytes(summary.totalBytes)}`);
    }
  }
  console.log('');
};

/**
 * .what = parses positional text argument from argv
 * .why = enables text extraction for annotate command
 */
const parseTextArg = (argv: string[]): string => {
  // skip node binary and entrypoint, plus -- separator
  const skipCount = isNodeEvalMode(argv) ? 1 : 2;
  const args = argv.slice(skipCount).filter((arg) => arg !== '--');

  // find first non-flag arg
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
    console.log(`🌕 reflect.snapshot annotate`);
    console.log(`   └─ 💥 annotation text required`);
    console.log('');
    console.log('usage: rhx reflect.snapshot.annotate "your annotation text"');
    process.exit(1);
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
    console.log(`🌕 reflect.snapshot backup`);
    console.log(`   └─ 💥 --into s3://bucket required`);
    console.log('');
    console.log('usage: rhx reflect.snapshot.backup --into s3://my-bucket');
    process.exit(1);
  }

  const scope = getReflectScope({ cwd: process.cwd() });
  const sourceDir = `${scope.storagePath}/snapshots`;

  const result = backupSnapshots({ sourceDir, into });

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

  if (at) {
    // get specific savepoint
    const savepoint = getOneSavepoint({ scope, at });
    if (!savepoint) {
      console.log(`🌕 reflect.savepoint get --at ${at}`);
      console.log(`   └─ 💥 savepoint not found`);
      process.exit(1);
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
  } else {
    // list all savepoints
    const summary = getAllSavepoints({ scope });

    console.log(`🌕 reflect.savepoint get`);
    console.log(`   ├─ repo = ${scope.gitRepoName}`);
    console.log(`   ├─ tree = ${scope.worktreeName}`);
    console.log(`   ├─ branch = ${scope.branch}`);
    console.log(`   │`);
    console.log(`   ├─ savepoints = ${summary.count}`);

    if (summary.savepoints.length > 0) {
      console.log(`   ├─ size = ${formatBytes(summary.totalBytes)}`);
      console.log(`   │`);
      console.log(`   └─ list`);
      for (let i = 0; i < summary.savepoints.length; i++) {
        const sp = summary.savepoints[i];
        if (!sp) continue;
        const isLast = i === summary.savepoints.length - 1;
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
      }
    } else {
      console.log(`   └─ size = ${formatBytes(summary.totalBytes)}`);
    }
  }
  console.log('');
};
