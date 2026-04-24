import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';

import { delRouteBind } from '@src/domain.operations/route/bind/delRouteBind';
import { getRouteBind } from '@src/domain.operations/route/bind/getRouteBind';
import { getRouteBindByBranch } from '@src/domain.operations/route/bind/getRouteBindByBranch';
import { setRouteBind } from '@src/domain.operations/route/bind/setRouteBind';
import { getDecisionIsArtifactProtected } from '@src/domain.operations/route/bouncer/getDecisionIsArtifactProtected';
import { getRouteBouncerCache } from '@src/domain.operations/route/bouncer/getRouteBouncerCache';
import { computeReviewThresholdVerdict } from '@src/domain.operations/route/guard/computeReviewThresholdVerdict';
import { computeReviewTotalsFromFiles } from '@src/domain.operations/route/guard/computeReviewTotalsFromFiles';
import { computeStoneReviewInputHash } from '@src/domain.operations/route/guard/computeStoneReviewInputHash';
import { genContextCliEmit } from '@src/domain.operations/route/guard/genContextCliEmit';
import { getLatestReviewFilesPerIndex } from '@src/domain.operations/route/guard/getLatestReviewFilesPerIndex';
import { getOneStoneGuardApproval } from '@src/domain.operations/route/judges/getOneStoneGuardApproval';
import { stepRouteDrive } from '@src/domain.operations/route/stepRouteDrive';
import { stepRouteReview } from '@src/domain.operations/route/stepRouteReview';
import { stepRouteStoneAdd } from '@src/domain.operations/route/stepRouteStoneAdd';
import { stepRouteStoneDel } from '@src/domain.operations/route/stepRouteStoneDel';
import { stepRouteStoneGet } from '@src/domain.operations/route/stepRouteStoneGet';
import { stepRouteStoneSet } from '@src/domain.operations/route/stepRouteStoneSet';
import { asYieldModeForRewound } from '@src/domain.operations/route/stones/asYieldModeForRewound';
import { findStoneByName } from '@src/domain.operations/route/stones/findStoneByName';
import { getAllStones } from '@src/domain.operations/route/stones/getAllStones';
import { isPromisedActionSlugAbsent } from '@src/domain.operations/route/stones/isPromisedActionSlugAbsent';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

/**
 * .what = detects if node was invoked via `node -e "code"` (eval mode)
 * .why = in eval mode, argv has no entrypoint path and args come after --
 *
 * argv patterns:
 *   normal: ['node', '/path/to/entry.js', '--arg', 'val']
 *   eval:   ['node', 'arg1', 'arg2'] (node strips -e and code from argv!)
 *
 * detection: if argv[1] doesn't look like a file path, assume eval mode
 */
const isNodeEvalMode = (argv: string[]): boolean => {
  const secondArg = argv[1];
  if (!secondArg) return false;

  // entrypoint path (ends with js/ts extension) = normal mode
  if (/\.(js|ts|mjs|cjs)$/.test(secondArg)) return false;

  // otherwise assume eval mode (node strips -e and code from argv)
  return true;
};

/**
 * .what = copies bytes read from a buffer into a new buffer
 * .why = encapsulates buffer slice for readability in stdin read loops
 */
const asBufferChunkCopy = (input: {
  buffer: Buffer;
  bytesRead: number;
}): Buffer => {
  return Buffer.from(input.buffer.subarray(0, input.bytesRead));
};

/**
 * .what = canonicalizes absolute path to relative, handles symlinks
 * .why = encapsulates path canonicalization for glob match in route.bounce
 */
const asRelativePathFromAbsolute = (input: {
  filePath: string;
  cwd: string;
  fsSync: { realpathSync: (p: string) => string };
}): string | null => {
  let cwdCanonical: string;
  let filePathCanonical: string;

  try {
    cwdCanonical = input.fsSync.realpathSync(input.cwd);
    const fileDir = path.dirname(input.filePath);
    const fileName = path.basename(input.filePath);
    try {
      const fileDirCanonical = input.fsSync.realpathSync(fileDir);
      filePathCanonical = path.join(fileDirCanonical, fileName);
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        console.error(
          `[route.bounce] fail-open: parent dir does not exist: ${fileDir}`,
        );
        filePathCanonical = input.filePath;
      } else {
        throw error;
      }
    }
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      console.error(
        `[route.bounce] fail-open: cwd does not exist: ${input.cwd}`,
      );
      cwdCanonical = input.cwd;
      filePathCanonical = input.filePath;
    } else {
      throw error;
    }
  }

  if (!filePathCanonical.startsWith(cwdCanonical)) {
    return null;
  }
  return path.relative(cwdCanonical, filePathCanonical);
};

/**
 * .what = extracts grant action from positional args or named option
 * .why = encapsulates grant action parse for readability in routeMutateGrant
 */
const getGrantActionFromArgs = (input: {
  argv: string[];
  grantOption: string | undefined;
}): string | undefined => {
  const positionalArgs = getCleanArgsFromArgv({ argv: input.argv }).filter(
    (arg) => !arg.startsWith('--'),
  );
  const grantIndex = positionalArgs.indexOf('grant');
  const positionalAction =
    grantIndex >= 0 ? positionalArgs[grantIndex + 1] : undefined;
  return positionalAction ?? input.grantOption;
};

/**
 * .what = valid stone passage actions for route.stone.set
 * .why = enables clear validation without inline enum check
 */
const VALID_STONE_PASSAGE_ACTIONS = new Set([
  'passed',
  'approved',
  'promised',
  'blocked',
  'rewound',
  'arrived',
]);

/**
 * .what = checks if action is a valid stone passage action
 * .why = encapsulates action validation for readability
 */
const isValidStonePassageAction = (input: {
  action: string | undefined;
}): input is { action: string } => {
  return !!input.action && VALID_STONE_PASSAGE_ACTIONS.has(input.action);
};

/**
 * .what = extracts clean args from argv, skipping node/entrypoint args and separators
 * .why = encapsulates argv preprocessing for readability
 */
const getCleanArgsFromArgv = (input: { argv: string[] }): string[] => {
  const skipCount = isNodeEvalMode(input.argv) ? 1 : 2;
  return input.argv.slice(skipCount).filter((arg) => arg !== '--');
};

/**
 * .what = parses cli args into options object
 * .why = simple arg parser without external dependencies
 */
const parseArgs = (argv: string[]): Record<string, string | undefined> => {
  const args = getCleanArgsFromArgv({ argv });
  const options: Record<string, string | undefined> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[i + 1];

      if (value && !value.startsWith('--')) {
        options[key] = value;
        i++;
      } else {
        options[key] = 'true';
      }
    }
  }

  return options;
};

/**
 * .what = collects all values for a repeated key from argv
 * .why = enables multi-value support for --stone in route.stone.del
 */
const collectArgsMulti = (argv: string[], key: string): string[] => {
  const args = getCleanArgsFromArgv({ argv });
  const values: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    if (arg === `--${key}`) {
      const value = args[i + 1];
      if (value && !value.startsWith('--')) {
        values.push(value);
        i++;
      }
    }
  }

  return values;
};

/**
 * .what = collects stdin content synchronously
 * .why = enables @stdin source for route.stone.add
 */
const collectStdinContent = (): string | null => {
  // check if stdin has data (non-TTY means piped input)
  if (process.stdin.isTTY) return null;

  // read stdin synchronously via fd 0
  const chunks: Buffer[] = [];
  const BUFSIZE = 256;
  const buf = Buffer.allocUnsafe(BUFSIZE);

  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const fsSync = require('fs');

  while (true) {
    try {
      const bytesRead = fsSync.readSync(0, buf, 0, BUFSIZE, null);
      if (bytesRead === 0) break;
      chunks.push(asBufferChunkCopy({ buffer: buf, bytesRead }));
    } catch (error) {
      // readSync throws on pipe closed (EAGAIN/EWOULDBLOCK) or EOF conditions
      // only break on expected EOF-like errors; rethrow unexpected I/O errors
      if (
        error instanceof Error &&
        'code' in error &&
        (error.code === 'EAGAIN' ||
          error.code === 'EWOULDBLOCK' ||
          error.code === 'EOF')
      ) {
        break;
      }
      throw error;
    }
  }

  if (chunks.length === 0) return null;
  return Buffer.concat(chunks).toString('utf-8');
};

/**
 * .what = prints help for route.stone.get
 */
const printGetHelp = (): void => {
  console.log(
    `
route.stone.get - get next stone(s) from a route

usage:
  route.stone.get [options]

options:
  --stone <query>    stone query: @next-one, @next-all, or glob pattern (required)
  --route <path>     path to route directory (required)
  --say              echo stone content to stdout
  --help             show this help message
`.trim(),
  );
};

/**
 * .what = prints help for route.stone.set
 */
const printSetHelp = (): void => {
  console.log(
    `
route.stone.set - mark stone as passed, approved, promised, blocked, rewound, or arrived

usage:
  route.stone.set [options]

options:
  --stone <name>     stone name or glob pattern (required)
  --route <path>     path to route directory (required)
  --as <status>      status to set: passed, approved, promised, blocked, rewound, or arrived (required)
  --that <slug>      review.self slug to promise (required for --as promised)
  --help             show this help message

note:
  --as arrived is an alias for --as passed (state claim, not judgment claim)

examples:
  route.stone.set --stone 1.vision --as arrived
  route.stone.set --stone 1.vision --as passed
  route.stone.set --stone 1.vision --as approved
  route.stone.set --stone 1.vision --as promised --that all-done
  route.stone.set --stone 3.blueprint --as blocked
  route.stone.set --stone 3.blueprint --as rewound
`.trim(),
  );
};

/**
 * .what = prints help for route.stone.del
 */
const printDelHelp = (): void => {
  console.log(
    `
route.stone.del - delete unused stones from a route

usage:
  route.stone.del [options]

options:
  --stone <pattern>  pattern for stones to delete (required)
                     @all = match all stones
                     auto-wraps with *...* if no glob chars present
  --route <path>     path to route directory (required)
  --mode <plan|apply> plan = preview (default), apply = execute deletion
  --help             show this help message
`.trim(),
  );
};

/**
 * .what = prints help for route.stone.add
 */
const printAddHelp = (): void => {
  console.log(
    `
route.stone.add - add a stone to a route

usage:
  route.stone.add [options]

options:
  --stone <name>     stone name (required, e.g., 3.1.6.research.custom)
  --from <source>    content source (required):
                       @stdin = read from stdin
                       template($behavior/refs/...) = read from template file
                       '<text>' = literal content
  --route <path>     path to route directory (optional, uses bound route)
  --mode <plan|apply> plan = preview (default), apply = create stone
  --help             show this help message

examples:
  echo "content" | route.stone.add --stone 3.1.research.adhoc --from @stdin
  route.stone.add --stone 3.1.research.adhoc --from 'template($behavior/refs/template.research.adhoc.stone)'
  route.stone.add --stone 3.1.research.adhoc --from 'investigate the topic'
`.trim(),
  );
};

/**
 * .what = prints help for route.stone.judge
 */
const printJudgeHelp = (): void => {
  console.log(
    `
route.stone.judge - judge mechanism for guard validation

usage:
  route.stone.judge [options]

mechanisms:
  approved?          check if stone has human approval marker
  reviewed?          check if reviews pass thresholds (computes artifact hash automatically)

options:
  --mechanism <type> judge mechanism: approved? or reviewed? (required)
  --stone <name>     stone name (required)
  --route <path>     path to route directory (required)
  --allow-blockers   max blockers allowed (for reviewed?, default: 0)
  --allow-nitpicks   max nitpicks allowed (for reviewed?, default: 0)
  --help             show this help message
`.trim(),
  );
};

/**
 * .what = prints help for route.bind.set
 */
const printBindSetHelp = (): void => {
  console.log(
    `
route.bind.set - bind a route to the current branch

usage:
  route.bind.set [options]

options:
  --route <path>     path to route directory to bind (required)
  --help             show this help message
`.trim(),
  );
};

/**
 * .what = prints help for route.bind.get
 */
const printBindGetHelp = (): void => {
  console.log(
    `
route.bind.get - query the route bound to the current branch

usage:
  route.bind.get [options]

options:
  --help             show this help message
`.trim(),
  );
};

/**
 * .what = prints help for route.bind.del
 */
const printBindDelHelp = (): void => {
  console.log(
    `
route.bind.del - remove the route bind for the current branch

usage:
  route.bind.del [options]

options:
  --help             show this help message
`.trim(),
  );
};

/**
 * .what = prints help for route.drive
 */
const printDriveHelp = (): void => {
  console.log(
    `
route.drive - echo current stone and pass command for bound route

usage:
  route.drive [options]

options:
  --route <path>     path to route directory (uses bound route if absent)
  --when <context>   hook context: hook.onBoot or hook.onStop
                     onBoot: show guidance, exit 0 (don't block session start)
                     onStop: show guidance, exit 2 (block premature stop)
  --help             show this help message

examples:
  route.drive                        # echo current stone
  route.drive --when hook.onBoot     # show stone, exit 0 (for onBoot hooks)
  route.drive --when hook.onStop     # show stone, exit 2 if unpassed (for onStop hooks)
`.trim(),
  );
};

/**
 * .what = prints help for route.review
 */
const printReviewHelp = (): void => {
  console.log(
    `
route.review - review stone artifacts with change stats

usage:
  route.review [options]

options:
  --stone <name>     stone name to review (defaults to next blocked on approval)
  --route <path>     path to route directory (uses bound route if absent)
  --open <opener>    editor to open artifact in (vim, code, nvim, etc.)
  --help             show this help message

examples:
  route.review                    # review next stone blocked on approval
  route.review --open vim         # open artifact in vim (if single file)
  route.review --stone 3.blueprint --open code
`.trim(),
  );
};

/**
 * .what = cli entrypoint for route.drive skill
 * .why = echoes current stone and pass command as GPS-like guidance
 */
export const routeDrive = async (): Promise<void> => {
  const options = parseArgs(process.argv);

  if (options.help) {
    printDriveHelp();
    return;
  }

  try {
    // parse --when parameter
    const when =
      options.when === 'hook.onBoot' || options.when === 'hook.onStop'
        ? options.when
        : undefined;

    const result = await stepRouteDrive({
      route: options.route,
      when,
    });

    if (result.emit?.stdout) {
      console.log(result.emit.stdout);
    }

    if (result.emit?.stderr) {
      if (result.emit.stderr.reason) {
        console.error(result.emit.stderr.reason);
      }
      process.exit(result.emit.stderr.code);
    }
  } catch (error) {
    // allowlist BadRequestError: format nicely and exit 2
    if (error instanceof BadRequestError) {
      console.error(`error: ${error.message}`);
      process.exit(2);
    }
    // rethrow unexpected errors (no failhide)
    throw error;
  }
};

/**
 * .what = cli entrypoint for route.review skill
 * .why = enables foremen to scan artifacts and review in editor
 */
export const routeReview = async (): Promise<void> => {
  const options = parseArgs(process.argv);

  if (options.help) {
    printReviewHelp();
    return;
  }

  // validate opener command exists in PATH
  if (options.open) {
    try {
      execSync(`command -v ${options.open}`, { stdio: 'pipe' });
    } catch (error) {
      // allowlist command-not-found (exit code 1 or 127): format nicely and exit 2
      if (error && typeof error === 'object' && 'status' in error) {
        const errorLines = [
          '🦉 look for the light',
          '',
          '🗿 route.review',
          `   └─ ✗ opener '${options.open}' not found in PATH`,
        ];
        console.error(errorLines.join('\n'));
        process.exit(2);
      }
      // rethrow unexpected errors (no failhide)
      throw error;
    }
  }

  try {
    const result = await stepRouteReview({
      route: options.route,
      stone: options.stone,
      open: options.open,
    });

    if (result.emit.stdout) {
      console.log(result.emit.stdout);
    }

    if (result.emit.stderr) {
      console.error(result.emit.stderr.reason);
      process.exit(result.emit.stderr.code);
    }
  } catch (error) {
    // allowlist BadRequestError: format nicely and exit 2
    if (error instanceof BadRequestError) {
      console.error(`error: ${error.message}`);
      process.exit(2);
    }
    // rethrow unexpected errors (no failhide)
    throw error;
  }
};

/**
 * .what = cli entrypoint for route.bind.set skill
 * .why = binds a route to the current branch for auto-lookup
 */
export const routeBindSet = async (): Promise<void> => {
  const options = parseArgs(process.argv);

  if (options.help) {
    printBindSetHelp();
    return;
  }

  if (!options.route) {
    console.error('error: --route is required');
    console.error('run with --help for usage');
    process.exit(2);
  }

  try {
    const result = await setRouteBind({ route: options.route });
    console.log(`bound route: ${result.route}`);
  } catch (error) {
    // allowlist BadRequestError: format nicely and exit 2
    if (error instanceof BadRequestError) {
      console.error(`error: ${error.message}`);
      process.exit(2);
    }
    // rethrow unexpected errors (no failhide)
    throw error;
  }
};

/**
 * .what = cli entrypoint for route.bind.get skill
 * .why = queries the route bound to the current branch
 */
export const routeBindGet = async (): Promise<void> => {
  const options = parseArgs(process.argv);

  if (options.help) {
    printBindGetHelp();
    return;
  }

  try {
    const result = await getRouteBind();
    if (result) {
      console.log(`bound to: ${result.route}`);
    } else {
      console.log('not bound');
    }
  } catch (error) {
    // allowlist BadRequestError: format nicely and exit 2
    if (error instanceof BadRequestError) {
      console.error(`error: ${error.message}`);
      process.exit(2);
    }
    // rethrow unexpected errors (no failhide)
    throw error;
  }
};

/**
 * .what = cli entrypoint for route.bind.del skill
 * .why = removes the route bind for the current branch
 */
export const routeBindDel = async (): Promise<void> => {
  const options = parseArgs(process.argv);

  if (options.help) {
    printBindDelHelp();
    return;
  }

  try {
    const result = await delRouteBind();
    if (result.deleted) {
      console.log('unbound route');
    } else {
      console.log('not bound (no bind to remove)');
    }
  } catch (error) {
    // allowlist BadRequestError: format nicely and exit 2
    if (error instanceof BadRequestError) {
      console.error(`error: ${error.message}`);
      process.exit(2);
    }
    // rethrow unexpected errors (no failhide)
    throw error;
  }
};

/**
 * .what = looks up route from bind
 * .why = enables auto-detect fallback for all route.stone.* commands
 */
const getRouteFromBindOrNull = async (): Promise<string | null> => {
  const bind = await getRouteBindByBranch({ branch: null });
  if (bind) return bind.route;
  return null;
};

/**
 * .what = gets route from option or bind, throws if neither available
 * .why = encapsulates route lookup for readability in orchestrators
 */
const getRouteOrThrow = async (input: {
  route: string | undefined;
}): Promise<string> => {
  if (input.route) return input.route;
  const routeFromBind = await getRouteFromBindOrNull();
  if (routeFromBind) return routeFromBind;
  throw new BadRequestError(
    'no route bound to this branch. use --route or route.bind',
  );
};

/**
 * .what = cli entrypoint for route.stone.get skill
 * .why = enables shell invocation via package-level import
 */
export const routeStoneGet = async (): Promise<void> => {
  const options = parseArgs(process.argv);

  if (options.help) {
    printGetHelp();
    return;
  }

  if (!options.stone) {
    throw new BadRequestError('--stone is required', {
      hint: '--help for usage',
    });
  }
  const route = await getRouteOrThrow({ route: options.route });

  try {
    const result = await stepRouteStoneGet({
      stone: options.stone as '@next-one' | '@next-all' | string,
      route,
      say: options.say === 'true',
    });

    if (result.emit) {
      console.log(result.emit.stdout);
    } else if (result.stones.length > 0) {
      console.log(result.stones.map((s) => s.name).join('\n'));
    }
  } catch (error) {
    // allowlist BadRequestError: format nicely and exit 2
    if (error instanceof BadRequestError) {
      console.error(`error: ${error.message}`);
      process.exit(2);
    }
    // rethrow unexpected errors (no failhide)
    throw error;
  }
};

/**
 * .what = cli entrypoint for route.stone.set skill
 * .why = enables shell invocation via package-level import
 */
export const routeStoneSet = async (): Promise<void> => {
  const options = parseArgs(process.argv);

  if (options.help) {
    printSetHelp();
    return;
  }

  // validate --stone required
  if (!options.stone)
    throw new BadRequestError('--stone is required', {
      hint: '--help for usage',
    });

  // validate --route required (or get from bind)
  const route = await getRouteOrThrow({ route: options.route });

  // validate --as required and valid
  if (!isValidStonePassageAction({ action: options.as })) {
    throw new BadRequestError(
      '--as must be "passed", "approved", "promised", "blocked", "rewound", or "arrived"',
      { hint: '--help for usage' },
    );
  }

  // validate --that required for promised
  if (isPromisedActionSlugAbsent({ action: options.as, slug: options.that }))
    throw new BadRequestError('--that is required when --as is "promised"', {
      hint: '--help for usage',
    });

  // validate and derive yield mode (only for rewound)
  const yieldMode = asYieldModeForRewound({
    asAction: options.as,
    hard: options.hard,
    soft: options.soft,
    yield: options.yield,
  });

  // detect TTY for human vs agent
  // allow approval in test/CI environments (Jest sets NODE_ENV=test, CI runners set CI=true)
  const isTestEnv =
    process.env.NODE_ENV === 'test' || process.env.CI === 'true';
  const isTTY = isTestEnv || (process.stdout.isTTY ?? false);

  // construct progress context (stdout so it appears with tree)
  const progress = genContextCliEmit({ stderr: process.stdout });

  // print owl header early so progress appears below it
  const owlHeader = `🦉 the way speaks for itself`;
  console.log(owlHeader);

  try {
    const result = await stepRouteStoneSet(
      {
        stone: options.stone,
        route,
        as: options.as as
          | 'passed'
          | 'approved'
          | 'promised'
          | 'blocked'
          | 'rewound'
          | 'arrived',
        that: options.that,
        yield: yieldMode,
      },
      { ...progress.context, isTTY },
    );

    progress.done();

    if (result.emit) {
      // strip owl header (printed early) to avoid duplication
      const stdoutWithoutOwl = result.emit.stdout
        .replace(owlHeader, '')
        .replace(/^\n+/, ''); // trim lead newlines left behind
      console.log(''); // blank line after progress, before tree
      console.log(stdoutWithoutOwl);
      if (result.emit.stderr) {
        console.error('');
        console.error(result.emit.stderr);
      }
    }

    // exit with code 2 for intentional guard block or approval blocked
    if (
      result.passed === false ||
      result.challenged === true ||
      result.approved === false
    ) {
      process.exit(2);
    }
  } catch (error) {
    progress.done();
    // allowlist BadRequestError: format nicely and exit 2
    if (error instanceof BadRequestError) {
      console.error(`error: ${error.message}`);
      process.exit(2);
    }
    // rethrow unexpected errors (no failhide)
    throw error;
  }
};

/**
 * .what = cli entrypoint for route.stone.del skill
 * .why = enables shell invocation via package-level import
 */
export const routeStoneDel = async (): Promise<void> => {
  try {
    const options = parseArgs(process.argv);

    if (options.help) {
      printDelHelp();
      return;
    }

    // collect all --stone values for multi-pattern support
    const stones = collectArgsMulti(process.argv, 'stone');
    if (stones.length === 0) {
      throw new BadRequestError('--stone is required', {
        hint: '--help for usage',
      });
    }

    const route = await getRouteOrThrow({ route: options.route });

    // parse mode with default to plan
    const mode = options.mode === 'apply' ? 'apply' : ('plan' as const);

    const result = await stepRouteStoneDel({
      stones,
      route,
      mode,
    });

    if (result.emit) {
      console.log(result.emit.stdout);
    }
  } catch (error) {
    // allowlist BadRequestError: format nicely and exit 2
    if (error instanceof BadRequestError) {
      console.error(`error: ${error.message}`);
      process.exit(2);
    }
    // rethrow unexpected errors (no failhide)
    throw error;
  }
};

/**
 * .what = cli entrypoint for route.stone.add skill
 * .why = enables drivers to add stones to their route on the fly
 */
export const routeStoneAdd = async (): Promise<void> => {
  try {
    const options = parseArgs(process.argv);

    if (options.help) {
      printAddHelp();
      return;
    }

    // validate --stone is provided
    if (!options.stone) {
      throw new BadRequestError('--stone is required', {
        hint: '--help for usage',
      });
    }

    // validate --from is provided
    if (!options.from) {
      throw new BadRequestError('--from is required', {
        hint: '--help for usage',
      });
    }

    // get route from option or bind
    const route = await getRouteOrThrow({ route: options.route });

    // collect stdin if source is @stdin
    const stdin = options.from === '@stdin' ? collectStdinContent() : null;

    // parse mode with default to plan
    const mode = options.mode === 'apply' ? 'apply' : ('plan' as const);

    const result = await stepRouteStoneAdd({
      stone: options.stone,
      source: options.from,
      stdin,
      route,
      mode,
    });

    if (result.emit) {
      console.log(result.emit.stdout);
    }
  } catch (error) {
    // allowlist BadRequestError: format nicely and exit 2
    if (error instanceof BadRequestError) {
      console.error(`error: ${error.message}`);
      process.exit(2);
    }
    // rethrow unexpected errors (no failhide)
    throw error;
  }
};

/**
 * .what = cli entrypoint for route.stone.judge skill
 * .why = enables deterministic judge mechanisms for guard validation
 */
export const routeStoneJudge = async (): Promise<void> => {
  const options = parseArgs(process.argv);

  if (options.help) {
    printJudgeHelp();
    return;
  }

  if (!options.mechanism) {
    throw new BadRequestError('--mechanism is required', {
      hint: '--help for usage',
    });
  }
  if (!options.stone) {
    throw new BadRequestError('--stone is required', {
      hint: '--help for usage',
    });
  }
  const route = await getRouteOrThrow({ route: options.route });

  try {
    if (options.mechanism === 'approved?') {
      await judgeApproved({ stone: options.stone, route });
    } else if (options.mechanism === 'reviewed?') {
      const allowBlockers = parseInt(options['allow-blockers'] ?? '0', 10);
      const allowNitpicks = parseInt(options['allow-nitpicks'] ?? '0', 10);
      await judgeReviewed({
        stone: options.stone,
        route,
        allowBlockers,
        allowNitpicks,
      });
    } else {
      throw new BadRequestError(`unknown mechanism "${options.mechanism}"`, {
        hint: '--help for usage',
      });
    }
  } catch (error) {
    // allowlist BadRequestError: format nicely and exit 2
    if (error instanceof BadRequestError) {
      console.error(`error: ${error.message}`);
      process.exit(2);
    }
    // rethrow unexpected errors (no failhide)
    throw error;
  }
};

/**
 * .what = judge mechanism for human approval check
 * .why = enables gated milestones that require human sign-off
 */
const judgeApproved = async (input: {
  stone: string;
  route: string;
}): Promise<void> => {
  // find the stone
  const stones = await getAllStones({ route: input.route });
  const stoneMatched = findStoneByName({ stones, name: input.stone });
  if (!stoneMatched) {
    console.log('passed: false');
    console.log('reason: stone not found');
    process.exit(2);
  }

  // check for approval marker
  const approval = await getOneStoneGuardApproval({
    stone: stoneMatched,
    route: input.route,
  });

  if (approval) {
    console.log('passed: true');
    console.log('reason: human approval found');
  } else {
    const approveCmd = `rhx route.stone.set --stone ${input.stone} --as approved`;
    const passCmd = `rhx route.stone.set --stone ${input.stone} --as passed`;
    console.log('passed: false');
    console.log('reason: wait for human approval');
    console.log('');
    console.log('✋ halted, human approval required');
    console.log('   ├─ please ask your human to');
    console.log(`   │  └─ ${approveCmd}`);
    console.log('   │');
    console.log('   └─ after human approves, run');
    console.log(`      └─ ${passCmd}`);
    process.exit(2);
  }
};

/**
 * .what = judge mechanism for review threshold check
 * .why = enables milestones gated on code review quality
 */
const judgeReviewed = async (input: {
  stone: string;
  route: string;
  allowBlockers: number;
  allowNitpicks: number;
}): Promise<void> => {
  // find the stone to compute artifact hash
  const stones = await getAllStones({ route: input.route });
  const stoneMatched = findStoneByName({ stones, name: input.stone });
  if (!stoneMatched) {
    console.log('passed: false');
    console.log('reason: stone not found');
    process.exit(2);
  }

  // compute artifact hash to find reviews for current content
  const hash = await computeStoneReviewInputHash({
    stone: stoneMatched,
    route: input.route,
  });

  // find review files for this stone and hash
  const routeDir = path.join(input.route, '.route');
  const reviewGlob = `${input.stone}.guard.review.*.${hash}.*.md`;

  const reviewFiles = await enumFilesFromGlob({
    glob: reviewGlob,
    cwd: routeDir,
  });

  if (reviewFiles.length === 0) {
    console.log('passed: false');
    console.log(`reason: no review files found for hash ${hash.slice(0, 8)}`);
    process.exit(2);
  }

  // get latest review per index (later iterations supersede earlier)
  const latestReviewFiles = getLatestReviewFilesPerIndex({ reviewFiles });

  // compute total blockers and nitpicks from latest reviews
  const { totalBlockers, totalNitpicks } = await computeReviewTotalsFromFiles({
    reviewFiles: latestReviewFiles,
  });

  // check thresholds
  const verdict = computeReviewThresholdVerdict({
    totalBlockers,
    totalNitpicks,
    allowBlockers: input.allowBlockers,
    allowNitpicks: input.allowNitpicks,
  });

  // output verdict
  console.log(`passed: ${verdict.passed}`);
  console.log(`reason: ${verdict.reason}`);
  if (!verdict.passed) {
    process.exit(2);
  }
};

/**
 * .what = prints help for route.bounce
 */
const printBounceHelp = (): void => {
  console.log(
    `
route.bounce - artifact gate enforcement for protected files

usage:
  route.bounce [options]

options:
  --mode <type>      mode: hook = pretool check, list = show protected files (default)
  --help             show this help message

stdin (for --mode hook):
  claude code PreToolUse hooks pipe JSON with tool_input.file_path

examples:
  route.bounce                              # list protected artifacts
  route.bounce --mode hook                  # pretool check via stdin (exit 2 if blocked)
`.trim(),
  );
};

/**
 * .what = reads tool input from stdin synchronously
 * .why = claude code PreToolUse hooks receive tool input as JSON on stdin
 *
 * stdin format from Claude Code:
 * {
 *   "hook_event_name": "PreToolUse",
 *   "tool_name": "Write" | "Edit" | ...,
 *   "tool_input": { "file_path": "/absolute/path/...", ... }
 * }
 */
const readToolInputFromStdin = (): {
  tool_name?: string;
  tool_input?: { file_path?: string };
} | null => {
  // first check RHACHET_STDIN env var (set by shell wrapper to work around node -e stdin issues)
  const envStdin = process.env.RHACHET_STDIN;
  if (envStdin) {
    try {
      return JSON.parse(envStdin);
    } catch (error) {
      // JSON.parse throws SyntaxError for malformed JSON; fail open for invalid input
      // note: stderr output makes this observable per rule.prefer.helpful-error-wrap
      if (error instanceof SyntaxError) {
        console.error(
          `[route.bounce] fail-open: RHACHET_STDIN contains invalid JSON: ${error.message}`,
        );
        return null;
      }
      throw error;
    }
  }

  // fallback: check if stdin has data available (non-TTY means piped input)
  if (process.stdin.isTTY) return null;

  // read stdin synchronously via fd 0
  const chunks: Buffer[] = [];
  const BUFSIZE = 256;
  const buf = Buffer.allocUnsafe(BUFSIZE);
  let bytesRead: number;

  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const fsSync = require('fs');

  while (true) {
    try {
      bytesRead = fsSync.readSync(0, buf, 0, BUFSIZE, null);
      if (bytesRead === 0) break;
      chunks.push(asBufferChunkCopy({ buffer: buf, bytesRead }));
    } catch (error) {
      // readSync throws on pipe closed (EAGAIN/EWOULDBLOCK) or EOF conditions
      // only break on expected EOF-like errors; rethrow unexpected I/O errors
      if (
        error instanceof Error &&
        'code' in error &&
        (error.code === 'EAGAIN' ||
          error.code === 'EWOULDBLOCK' ||
          error.code === 'EOF')
      ) {
        break;
      }
      throw error;
    }
  }

  if (chunks.length === 0) return null;

  const input = Buffer.concat(chunks).toString('utf-8').trim();
  if (!input) return null;

  try {
    return JSON.parse(input);
  } catch (error) {
    // allowlist SyntaxError from JSON.parse: return null for invalid JSON
    if (error instanceof SyntaxError) return null;
    // rethrow unexpected errors (no failhide)
    throw error;
  }
};

/**
 * .what = cli entrypoint for route.bounce skill
 * .why = enforces artifact gate protection before file writes/edits
 */
export const routeBounce = async (): Promise<void> => {
  const options = parseArgs(process.argv);

  if (options.help) {
    printBounceHelp();
    return;
  }

  const mode = options.mode ?? 'list';

  // hook mode: routeBounceHook handles all expected errors internally (returns early)
  // any unexpected error will crash with stack trace (fail-fast)
  // note: Claude Code treats crashed hooks as "error but allow" (fail-open semantics)
  if (mode === 'hook') {
    await routeBounceHook();
    return;
  }

  // list mode: no catch block (fail-fast with stack trace for debug)
  await routeBounceList();
};

/**
 * .what = hook mode implementation for route.bounce
 * .why = checks if a file mutation is blocked by an unpassed stone guard
 */
const routeBounceHook = async (): Promise<void> => {
  // load bouncer cache
  const cache = await getRouteBouncerCache();

  // read tool input from stdin (claude code PreToolUse provides tool input via stdin)
  const toolInput = readToolInputFromStdin();

  // only check Write and Edit tools (file mutation operations)
  // todo: Bash tool could bypass protection via redirects like `echo "..." > src/file.ts`
  //       for now we fail open on Bash. we assume bonintent robots. revisit if malintent escapes via cat/redirects.
  const toolName = toolInput?.tool_name;
  if (toolName !== 'Write' && toolName !== 'Edit') {
    return; // not a file mutation tool, allow through
  }

  // extract file_path from nested tool_input (claude code sends { tool_input: { file_path } })
  let filePath = toolInput?.tool_input?.file_path;

  if (!filePath) {
    // no path to check, allow through (fail open)
    return;
  }

  // convert absolute path to relative for glob match
  if (path.isAbsolute(filePath)) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const fsSync = require('fs');
    const relativePath = asRelativePathFromAbsolute({
      filePath,
      cwd: process.cwd(),
      fsSync,
    });
    if (relativePath === null) {
      // path outside repo, cannot match relative globs, allow through
      return;
    }
    filePath = relativePath;
  }

  const decision = getDecisionIsArtifactProtected({
    path: filePath,
    cache,
  });

  if (decision.blocked && decision.protection) {
    // output blocked feedback in zen format per blueprint
    const lines = [
      '🦉 patience, friend',
      '',
      '🗿 route.bounce',
      '   ├─ blocked',
      `   │  ├─ artifact = ${filePath}`,
      `   │  └─ guard = ${path.basename(decision.protection.guard)}`,
      '   │',
      '   ├─ a journey of a thousand miles begins with a single step 🪷',
      '   │  ├─',
      '   │  │',
      `   │  │  this artifact is locked until stone ${decision.protection.stone} is passed.`,
      '   │  │',
      '   │  │  the way cannot be rushed. each stone builds on the last.',
      '   │  │',
      '   │  └─',
      '   │',
      '   └─ to pass this stone and unlock this gate, run',
      '      └─ rhx route.drive',
    ];
    console.error(lines.join('\n'));
    process.exit(2);
  }

  // not blocked, exit 0 silently for hook
};

/**
 * .what = list mode implementation for route.bounce
 * .why = displays all protected artifacts and their guard status
 */
const routeBounceList = async (): Promise<void> => {
  // load bouncer cache
  const cache = await getRouteBouncerCache();

  if (cache.protections.length === 0) {
    console.log('no protected artifacts');
    return;
  }

  // group protections by stone
  const byStone = new Map<string, typeof cache.protections>();
  for (const p of cache.protections) {
    const list = byStone.get(p.stone) ?? [];
    list.push(p);
    byStone.set(p.stone, list);
  }

  console.log('🗿 route.bounce');
  console.log('   └─ protected artifacts');

  const stones = Array.from(byStone.keys());
  for (let i = 0; i < stones.length; i++) {
    const stone = stones[i]!;
    const protections = byStone.get(stone)!;
    const isLast = i === stones.length - 1;
    const prefix = isLast ? '      └─' : '      ├─';

    const stoneStatus = protections[0]?.passed ? '✓' : '○';
    console.log(`${prefix} ${stone} ${stoneStatus}`);

    const childPrefix = isLast ? '         ' : '      │  ';
    for (let j = 0; j < protections.length; j++) {
      const p = protections[j]!;
      const isLastGlob = j === protections.length - 1;
      const globPrefix = isLastGlob ? '└─' : '├─';
      console.log(`${childPrefix}${globPrefix} ${p.glob}`);
    }
  }
};

/**
 * .what = cli entrypoint for route.mutate grant commands
 * .why = manages privilege flags for route protection bypass
 */
export const routeMutateGrant = async (): Promise<void> => {
  const options = parseArgs(process.argv);

  // extract action from positional args or named option
  const action = getGrantActionFromArgs({
    argv: process.argv,
    grantOption: options.grant,
  });

  if (!action || !['allow', 'block', 'get'].includes(action)) {
    console.log(`
route.mutate grant - manage route protection privilege

usage:
  rhx route.mutate grant allow   # grant privilege (human only)
  rhx route.mutate grant block   # revoke privilege
  rhx route.mutate grant get     # check privilege state

options:
  --route <path>    route path (default: auto-detect from branch)
`);
    process.exit(1);
  }

  try {
    // get route from option or auto-detect
    let routePath = options.route;
    if (!routePath) {
      const bind = await getRouteBindByBranch({ branch: null });
      if (!bind) {
        console.error('error: no bound route found. use --route to specify.');
        process.exit(1);
      }
      routePath = bind.route;
    }

    const privilegeFlagPath = path.join(
      routePath,
      '.route',
      '.privilege.mutate.flag',
    );

    if (action === 'allow') {
      // ensure .route dir exists
      await fs.mkdir(path.dirname(privilegeFlagPath), { recursive: true });
      // create flag file
      await fs.writeFile(privilegeFlagPath, '');

      console.log('');
      console.log('🦉 privilege granted');
      console.log('');
      console.log('🗿 route.mutate grant allow');
      console.log(`   ├─ route = ${routePath}`);
      console.log('   └─ flag = .route/.privilege.mutate.flag created');
      console.log('');
      console.log('✨ route mutation now allowed until revoked');
      console.log('');
    } else if (action === 'block') {
      // remove flag file (idempotent)
      await fs.rm(privilegeFlagPath, { force: true });

      console.log('');
      console.log('🦉 privilege revoked');
      console.log('');
      console.log('🗿 route.mutate grant block');
      console.log(`   ├─ route = ${routePath}`);
      console.log('   └─ flag = .route/.privilege.mutate.flag removed');
      console.log('');
      console.log('🔒 route mutation now blocked');
      console.log('');
    } else if (action === 'get') {
      // check flag existence
      const hasPrivilege = await fs
        .access(privilegeFlagPath)
        .then(() => true)
        .catch(() => false);

      console.log('');
      console.log('🗿 route.mutate grant get');
      console.log(`   ├─ route = ${routePath}`);
      console.log(
        `   └─ status = ${hasPrivilege ? 'allowed' : 'blocked (no privilege flag)'}`,
      );
      console.log('');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`error: ${error.message}`);
    }
    process.exit(1);
  }
};
