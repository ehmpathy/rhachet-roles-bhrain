import { execFileSync } from 'child_process';
import * as path from 'path';

import { getGitDiffStats } from '@src/infra/git/getGitDiffStats';
import { asPathAbsoluteFromCwd } from '@src/utils/asPathAbsoluteFromCwd';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

import { getRouteBindByBranch } from './bind/getRouteBindByBranch';
import { getRepoRootWithFallback } from './guard/getRepoRootWithFallback';
import { computeNextStones } from './stones/computeNextStones';
import { getAllStoneDriveArtifacts } from './stones/getAllStoneDriveArtifacts';
import { getAllStones } from './stones/getAllStones';

/**
 * .what = review stone artifacts with change stats and optional editor open
 * .why = enables foremen to quickly scan what needs review
 */
export const stepRouteReview = async (input: {
  route?: string;
  stone?: string;
  open?: string;
}): Promise<{
  opened: boolean;
  artifacts: string[];
  emit: {
    stdout: string;
    stderr?: { reason: string; code: number };
  };
}> => {
  // derive route from input or bound branch
  const bind = input.route
    ? null
    : await getRouteBindByBranch({ branch: null });
  const route = input.route || bind?.route;
  if (!route) {
    return {
      opened: false,
      artifacts: [],
      emit: {
        stdout: '',
        stderr: {
          reason: formatError({ reason: 'no route bound, use --route' }),
          code: 2,
        },
      },
    };
  }

  // get all stones
  const stones = await getAllStones({ route });
  const driveArtifacts = await getAllStoneDriveArtifacts({ route });

  // derive target stone from input or next stone
  const stoneName =
    input.stone ||
    computeNextStones({
      stones,
      artifacts: driveArtifacts,
      query: '@next-one',
    })[0]?.name;
  if (!stoneName) {
    return {
      opened: false,
      artifacts: [],
      emit: {
        stdout: formatNoArtifacts({ route, stone: '(none)' }),
      },
    };
  }

  // validate stone exists
  const stoneFound = stones.find((s) => s.name === stoneName);
  if (!stoneFound) {
    return {
      opened: false,
      artifacts: [],
      emit: {
        stdout: '',
        stderr: {
          reason: formatError({
            reason: `stone '${stoneName}' not found in route`,
          }),
          code: 2,
        },
      },
    };
  }

  // anchor every subprocess, glob, and fs read at the repo root that holds the route
  // .note = rule.forbid.cwd-outside-gitroot; the root is found from the route itself, so a
  //         route in another repo (e.g. an absolute temp route) still finds its own root
  const routeAbsolute = asPathAbsoluteFromCwd({
    path: route,
    cwd: process.cwd(),
  });
  const repoRoot = await getRepoRootWithFallback({ from: routeAbsolute });
  const routeFromRoot = path.relative(repoRoot, routeAbsolute);

  // enumerate artifacts for this stone
  const allArtifactsAbsolute = await enumFilesFromGlob({
    glob: path.join(routeFromRoot, `${stoneName}*.md`),
    cwd: repoRoot,
  });

  // convert to route-relative paths for consistent handling
  const allArtifacts = allArtifactsAbsolute.map((absolutePath) =>
    path.relative(path.join(repoRoot, routeFromRoot), absolutePath),
  );

  // filter out gitignored files
  const artifacts = await filterGitignored({
    files: allArtifacts,
    routeFromRoot,
    repoRoot,
  });

  // handle empty state
  if (artifacts.length === 0) {
    return {
      opened: false,
      artifacts: [],
      emit: {
        stdout: formatNoArtifacts({ route, stone: stoneName }),
      },
    };
  }

  // get diff stats for each artifact
  const artifactStats = artifacts.map((file) => {
    const stats = getGitDiffStats({
      file: path.join(routeFromRoot, file),
      cwd: repoRoot,
    });
    return { file, stats };
  });

  // format treestruct output
  const stdout = formatReviewTreestruct({
    route,
    stone: stoneName,
    artifacts: artifactStats,
    opener: input.open,
  });

  // open artifact if single + opener specified
  let opened = false;
  if (input.open && artifacts.length === 1) {
    const artifactPath = path.join(repoRoot, routeFromRoot, artifacts[0]!);
    try {
      // the opener is the caller's own command; the path rides as argv ($1), never as shell text
      execFileSync('sh', ['-c', `${input.open} "$1"`, 'sh', artifactPath], {
        stdio: 'inherit',
        cwd: repoRoot,
      });
      opened = true;
    } catch {
      // opener failed, but we still show the output
    }
  }

  return {
    opened,
    artifacts,
    emit: { stdout },
  };
};

/**
 * .what = filter out gitignored files from list
 * .why = only show tracked files in review
 */
const filterGitignored = async (input: {
  files: string[];
  routeFromRoot: string;
  repoRoot: string;
}): Promise<string[]> => {
  if (input.files.length === 0) return [];

  try {
    // use git check-ignore from the repo root, over root-relative paths
    // .note = no shell: the paths ride on stdin, nul-separated (-z), so no byte of a
    //         file name is ever parsed as shell syntax or as a line break
    const filePaths = input.files
      .map((file) => path.join(input.routeFromRoot, file))
      .join('\0');
    const ignoredOutput = execFileSync(
      'git',
      ['check-ignore', '--stdin', '-z'],
      {
        cwd: input.repoRoot,
        input: filePaths,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );
    const ignoredSet = new Set(ignoredOutput.split('\0').filter(Boolean));
    return input.files.filter(
      (file) => !ignoredSet.has(path.join(input.routeFromRoot, file)),
    );
  } catch (error) {
    // git check-ignore exits 1 when no file is ignored; every other fault is a defect
    if (isErrorOfNoFileIgnored({ error })) return input.files;
    throw error;
  }
};

/**
 * .what = tells whether a caught execFileSync error is git check-ignore's "no file ignored" exit
 * .why = exit 1 is git's answer "none of these paths is ignored", a fact. any other exit
 *        (128 for a broken or absent repo) or a spawn fault (no status at all) is a defect,
 *        and must surface loud rather than read as "none ignored" (rule.forbid.failhide)
 * .note = read by shape, never `instanceof Error`, so a cross-realm error still passes the gate
 */
const isErrorOfNoFileIgnored = (input: { error: unknown }): boolean =>
  typeof input.error === 'object' &&
  input.error !== null &&
  'status' in input.error &&
  input.error.status === 1;

/**
 * .what = format error output with treestruct
 * .why = consistent error format across route.* skills
 */
const formatError = (input: { reason: string }): string => {
  const lines: string[] = [];
  lines.push(`🦉 look for the light`);
  lines.push('');
  lines.push(`🗿 route.review`);
  lines.push(`   └─ ✗ ${input.reason}`);
  return lines.join('\n');
};

/**
 * .what = format empty state output
 * .why = clear feedback when no artifacts to review
 */
const formatNoArtifacts = (input: { route: string; stone: string }): string => {
  const lines: string[] = [];
  lines.push(`🦉 look for the light`);
  lines.push('');
  lines.push(`🗿 route.review`);
  lines.push(`   ├─ the path leads here`);
  lines.push(`   │  ├─ route = ${input.route}`);
  lines.push(`   │  └─ stone = ${input.stone}`);
  lines.push(`   │`);
  lines.push(`   └─ no artifacts to review`);
  return lines.join('\n');
};

/**
 * .what = format review treestruct with artifact stats
 * .why = provides scannable overview of what needs review
 */
const formatReviewTreestruct = (input: {
  route: string;
  stone: string;
  artifacts: Array<{
    file: string;
    stats: {
      lines: number;
      added: number | null;
      removed: number | null;
      symbol: string;
    };
  }>;
  opener?: string;
}): string => {
  const lines: string[] = [];

  // header
  lines.push(`🦉 look for the light`);
  lines.push('');

  // route.review tree
  lines.push(`🗿 route.review`);
  lines.push(`   ├─ the path leads here`);
  lines.push(`   │  ├─ route = ${input.route}`);
  lines.push(`   │  └─ stone = ${input.stone}`);
  lines.push(`   │`);

  // artifacts section
  const artifactCount = input.artifacts.length;
  const fileWord = artifactCount === 1 ? 'file' : 'files';
  lines.push(`   ├─ and finds these artifacts`);
  lines.push(`   │  ├─ ${artifactCount} ${fileWord} to review`);

  // list each artifact with stats
  for (let i = 0; i < input.artifacts.length; i++) {
    const { file, stats } = input.artifacts[i]!;
    const isLast = i === input.artifacts.length - 1;
    const prefix = isLast ? '└─' : '├─';

    // format stats string
    const linesStr = `${stats.lines} lines`;
    const deltaStr =
      stats.added !== null && stats.removed !== null
        ? `  +${stats.added} -${stats.removed}`
        : '';

    const artifactPath = `${input.route}/${file}`;
    lines.push(
      `   │  ${prefix} ${stats.symbol} ${artifactPath}   ${linesStr}${deltaStr}`,
    );
  }

  lines.push(`   │`);

  // an opener with several files opens none, and the tree says so as a status row — a
  // status is no next move, so it carries no `tip:` label and no hint block
  // (rule.require.coconut-hints)
  if (input.opener && artifactCount > 1) {
    lines.push(`   ├─ when ready, run`);
    lines.push(
      `   │  └─ rhx route.stone.set --stone ${input.stone} --as approved`,
    );
    lines.push(`   │`);
    lines.push(
      `   └─ --open ${input.opener} skipped — it opens one file, and ${artifactCount} matched`,
    );
  } else if (artifactCount === 1 && input.opener) {
    const artifactPath = `${input.route}/${input.artifacts[0]!.file}`;
    lines.push(`   └─ opened ${artifactPath} in ${input.opener}`);
  } else {
    lines.push(`   └─ when ready, run`);
    lines.push(
      `      └─ rhx route.stone.set --stone ${input.stone} --as approved`,
    );
  }

  return lines.join('\n');
};
