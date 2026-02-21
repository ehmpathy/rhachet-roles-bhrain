import * as fs from 'fs/promises';
import * as path from 'path';

import { delRouteBind } from '@src/domain.operations/route/bind/delRouteBind';
import { getRouteBind } from '@src/domain.operations/route/bind/getRouteBind';
import { getRouteBindByBranch } from '@src/domain.operations/route/bind/getRouteBindByBranch';
import { setRouteBind } from '@src/domain.operations/route/bind/setRouteBind';
import { computeStoneReviewInputHash } from '@src/domain.operations/route/guard/computeStoneReviewInputHash';
import { genContextCliEmit } from '@src/domain.operations/route/guard/genContextCliEmit';
import { getOneStoneGuardApproval } from '@src/domain.operations/route/judges/getOneStoneGuardApproval';
import { stepRouteDrive } from '@src/domain.operations/route/stepRouteDrive';
import { stepRouteStoneDel } from '@src/domain.operations/route/stepRouteStoneDel';
import { stepRouteStoneGet } from '@src/domain.operations/route/stepRouteStoneGet';
import { stepRouteStoneSet } from '@src/domain.operations/route/stepRouteStoneSet';
import { getAllStones } from '@src/domain.operations/route/stones/getAllStones';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

/**
 * .what = detects if node was invoked via `node -e "code"` (eval mode)
 * .why = in eval mode, argv has no entrypoint path
 */
const isNodeEvalMode = (argv: string[]): boolean => {
  const secondArg = argv[1];
  if (!secondArg) return false;
  const looksLikeEntrypointPath =
    /\.(js|ts|mjs|cjs)$/.test(secondArg) || !secondArg.startsWith('--');
  return !looksLikeEntrypointPath;
};

/**
 * .what = parses cli args into options object
 * .why = simple arg parser without external dependencies
 */
const parseArgs = (argv: string[]): Record<string, string | undefined> => {
  const skipCount = isNodeEvalMode(argv) ? 1 : 2;
  const args = argv.slice(skipCount).filter((arg) => arg !== '--');
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
route.stone.set - mark stone as passed, approved, or promised

usage:
  route.stone.set [options]

options:
  --stone <name>     stone name or glob pattern (required)
  --route <path>     path to route directory (required)
  --as <status>      status to set: passed, approved, or promised (required)
  --that <slug>      self-review slug to promise (required for --as promised)
  --help             show this help message

examples:
  route.stone.set --stone 1.vision --as passed
  route.stone.set --stone 1.vision --as approved
  route.stone.set --stone 1.vision --as promised --that all-done
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
 * .what = prints help for route.bind
 */
const printBindHelp = (): void => {
  console.log(
    `
route.bind - bind/query/remove a route for the current branch

usage:
  route.bind [options]

options:
  --route <path>     path to route directory to bind (sets the bind)
  --get              query the current bind
  --del              remove the current bind
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
  --mode <hook>      mode: hook = silent on route complete (for hooks)
  --help             show this help message

examples:
  route.drive                    # echo current stone
  route.drive --mode hook        # silent if route complete (for hooks)
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
    const mode = options.mode === 'hook' ? 'hook' : undefined;
    const result = await stepRouteDrive({
      route: options.route,
      mode,
    });

    if (result.emit) {
      console.log(result.emit.stdout);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`error: ${error.message}`);
    }
    process.exit(1);
  }
};

/**
 * .what = cli entrypoint for route.bind skill
 * .why = enables bind/query/remove of a route to the current branch
 */
export const routeBind = async (): Promise<void> => {
  const options = parseArgs(process.argv);

  if (options.help) {
    printBindHelp();
    return;
  }

  try {
    // dispatch: --get
    if (options.get === 'true') {
      const result = await getRouteBind();
      if (result) {
        console.log(`bound to: ${result.route}`);
      } else {
        console.log('not bound');
      }
      return;
    }

    // dispatch: --del
    if (options.del === 'true') {
      const result = await delRouteBind();
      if (result.deleted) {
        console.log('unbound route');
      } else {
        console.log('not bound (no bind to remove)');
      }
      return;
    }

    // dispatch: --route (set bind)
    if (options.route) {
      const result = await setRouteBind({ route: options.route });
      console.log(`bound route: ${result.route}`);
      return;
    }

    // no valid option
    console.error('error: provide --route, --get, or --del');
    console.error('run with --help for usage');
    process.exit(1);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`error: ${error.message}`);
    }
    process.exit(1);
  }
};

/**
 * .what = resolves --route from bind when absent
 * .why = enables auto-resolve fallback for all route.stone.* commands
 */
const resolveRouteFromBind = async (): Promise<string | null> => {
  const bind = await getRouteBindByBranch({ branch: null });
  if (bind) return bind.route;
  return null;
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
    console.error('error: --stone is required');
    console.error('run with --help for usage');
    process.exit(1);
  }
  if (!options.route) {
    const routeFromBind = await resolveRouteFromBind();
    if (routeFromBind) {
      options.route = routeFromBind;
    } else {
      console.error(
        'error: no route bound to this branch. use --route or route.bind',
      );
      process.exit(1);
    }
  }

  try {
    const result = await stepRouteStoneGet({
      stone: options.stone as '@next-one' | '@next-all' | string,
      route: options.route,
      say: options.say === 'true',
    });

    if (result.emit) {
      console.log(result.emit.stdout);
    } else if (result.stones.length > 0) {
      console.log(result.stones.map((s) => s.name).join('\n'));
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`error: ${error.message}`);
    }
    process.exit(1);
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

  if (!options.stone) {
    console.error('error: --stone is required');
    console.error('run with --help for usage');
    process.exit(1);
  }
  if (!options.route) {
    const routeFromBind = await resolveRouteFromBind();
    if (routeFromBind) {
      options.route = routeFromBind;
    } else {
      console.error(
        'error: no route bound to this branch. use --route or route.bind',
      );
      process.exit(1);
    }
  }
  if (
    !options.as ||
    (options.as !== 'passed' &&
      options.as !== 'approved' &&
      options.as !== 'promised')
  ) {
    console.error('error: --as must be "passed", "approved", or "promised"');
    console.error('run with --help for usage');
    process.exit(1);
  }

  // validate --that required for promised
  if (options.as === 'promised' && !options.that) {
    console.error('error: --that is required when --as is "promised"');
    console.error('run with --help for usage');
    process.exit(1);
  }

  // construct stderr progress context for live feedback
  const progress = genContextCliEmit({ stderr: process.stderr });

  try {
    const result = await stepRouteStoneSet(
      {
        stone: options.stone,
        route: options.route,
        as: options.as as 'passed' | 'approved' | 'promised',
        that: options.that,
      },
      progress.context,
    );

    progress.done();

    if (result.emit) {
      console.log(result.emit.stdout);
    }

    // exit with non-zero if not passed
    if (result.passed === false) {
      process.exit(1);
    }
  } catch (error) {
    progress.done();
    if (error instanceof Error) {
      console.error(`error: ${error.message}`);
    }
    process.exit(1);
  }
};

/**
 * .what = cli entrypoint for route.stone.del skill
 * .why = enables shell invocation via package-level import
 */
export const routeStoneDel = async (): Promise<void> => {
  const options = parseArgs(process.argv);

  if (options.help) {
    printDelHelp();
    return;
  }

  if (!options.stone) {
    console.error('error: --stone is required');
    console.error('run with --help for usage');
    process.exit(1);
  }
  if (!options.route) {
    const routeFromBind = await resolveRouteFromBind();
    if (routeFromBind) {
      options.route = routeFromBind;
    } else {
      console.error(
        'error: no route bound to this branch. use --route or route.bind',
      );
      process.exit(1);
    }
  }

  // parse mode with default to plan
  const mode = options.mode === 'apply' ? 'apply' : ('plan' as const);

  try {
    const result = await stepRouteStoneDel({
      stone: options.stone,
      route: options.route,
      mode,
    });

    if (result.emit) {
      console.log(result.emit.stdout);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`error: ${error.message}`);
    }
    process.exit(1);
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
    console.error('error: --mechanism is required');
    console.error('run with --help for usage');
    process.exit(1);
  }
  if (!options.stone) {
    console.error('error: --stone is required');
    console.error('run with --help for usage');
    process.exit(1);
  }
  if (!options.route) {
    const routeFromBind = await resolveRouteFromBind();
    if (routeFromBind) {
      options.route = routeFromBind;
    } else {
      console.error(
        'error: no route bound to this branch. use --route or route.bind',
      );
      process.exit(1);
    }
  }

  try {
    if (options.mechanism === 'approved?') {
      await judgeApproved({ stone: options.stone, route: options.route });
    } else if (options.mechanism === 'reviewed?') {
      const allowBlockers = parseInt(options['allow-blockers'] ?? '0', 10);
      const allowNitpicks = parseInt(options['allow-nitpicks'] ?? '0', 10);
      await judgeReviewed({
        stone: options.stone,
        route: options.route,
        allowBlockers,
        allowNitpicks,
      });
    } else {
      console.error(`error: unknown mechanism "${options.mechanism}"`);
      console.error('run with --help for usage');
      process.exit(1);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`error: ${error.message}`);
    }
    process.exit(1);
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
  const stoneMatched = stones.find((s) => s.name === input.stone);
  if (!stoneMatched) {
    console.log('passed: false');
    console.log('reason: stone not found');
    process.exit(1);
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
    console.log('passed: false');
    console.log('reason: wait for human approval');
    process.exit(1);
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
  const stoneMatched = stones.find((s) => s.name === input.stone);
  if (!stoneMatched) {
    console.log('passed: false');
    console.log('reason: stone not found');
    process.exit(1);
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
    process.exit(1);
  }

  // parse blockers and nitpicks from review files
  let totalBlockers = 0;
  let totalNitpicks = 0;

  for (const filePath of reviewFiles) {
    const content = await fs.readFile(filePath, 'utf-8');
    // match format: "N blocker(s)" from review skill output (e.g., "├─ 3 blockers 🔴")
    const blockerMatch = content.match(/(\d+)\s+blockers?/i);
    const nitpickMatch = content.match(/(\d+)\s+nitpicks?/i);

    if (blockerMatch?.[1]) {
      totalBlockers += parseInt(blockerMatch[1], 10);
    }
    if (nitpickMatch?.[1]) {
      totalNitpicks += parseInt(nitpickMatch[1], 10);
    }
  }

  // check thresholds
  if (totalBlockers > input.allowBlockers) {
    console.log('passed: false');
    console.log(
      `reason: blockers exceed threshold (${totalBlockers} > ${input.allowBlockers})`,
    );
    process.exit(1);
  }

  if (totalNitpicks > input.allowNitpicks) {
    console.log('passed: false');
    console.log(
      `reason: nitpicks exceed threshold (${totalNitpicks} > ${input.allowNitpicks})`,
    );
    process.exit(1);
  }

  console.log('passed: true');
  console.log(
    `reason: reviews pass (blockers: ${totalBlockers}/${input.allowBlockers}, nitpicks: ${totalNitpicks}/${input.allowNitpicks})`,
  );
};
