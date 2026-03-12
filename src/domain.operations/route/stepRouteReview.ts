import { execSync } from 'child_process';
import * as path from 'path';

import { getGitDiffStats } from '@src/infra/git/getGitDiffStats';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

import { getRouteBindByBranch } from './bind/getRouteBindByBranch';
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
  let route = input.route;
  if (!route) {
    const bind = await getRouteBindByBranch({ branch: null });
    if (!bind) {
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
    route = bind.route;
  }

  // get all stones
  const stones = await getAllStones({ route });
  const driveArtifacts = await getAllStoneDriveArtifacts({ route });

  // derive target stone from input or next stone
  let stoneName = input.stone;
  if (!stoneName) {
    const nextStones = computeNextStones({
      stones,
      artifacts: driveArtifacts,
      query: '@next-one',
    });
    if (nextStones.length === 0) {
      return {
        opened: false,
        artifacts: [],
        emit: {
          stdout: formatNoArtifacts({ route, stone: '(none)' }),
        },
      };
    }
    stoneName = nextStones[0]!.name;
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

  // enumerate artifacts for this stone
  const artifactGlob = `${stoneName}*.md`;
  const allArtifactsAbsolute = await enumFilesFromGlob({
    glob: artifactGlob,
    cwd: route,
  });

  // convert to relative paths for consistent handling
  const allArtifacts = allArtifactsAbsolute.map((absolutePath) =>
    path.relative(route, absolutePath),
  );

  // filter out gitignored files
  const artifacts = await filterGitignored({ files: allArtifacts, cwd: route });

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
    const stats = getGitDiffStats({ file, cwd: route });
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
    const artifactPath = path.join(route, artifacts[0]!);
    try {
      execSync(`${input.open} "${artifactPath}"`, { stdio: 'inherit' });
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
  cwd: string;
}): Promise<string[]> => {
  if (input.files.length === 0) return [];

  try {
    // use git check-ignore to filter
    const filePaths = input.files.join('\n');
    const ignoredOutput = execSync(
      `echo "${filePaths}" | git check-ignore --stdin`,
      {
        cwd: input.cwd,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );
    const ignoredSet = new Set(
      ignoredOutput.trim().split('\n').filter(Boolean),
    );
    return input.files.filter((f) => !ignoredSet.has(f));
  } catch {
    // git check-ignore returns exit 1 if no files are ignored
    return input.files;
  }
};

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

  // tip for multiple files with opener
  if (input.opener && artifactCount > 1) {
    lines.push(`   ├─ when ready, run`);
    lines.push(
      `   │  └─ rhx route.stone.set --stone ${input.stone} --as approved`,
    );
    lines.push(`   │`);
    lines.push(
      `   └─ tip: --open ${input.opener} ignored, due to multiple files matched`,
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
