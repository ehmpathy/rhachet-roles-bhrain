import * as fs from 'fs/promises';

import { getRouteBindByBranch } from './bind/getRouteBindByBranch';
import { computeNextStones } from './stones/computeNextStones';
import { getAllStoneDriveArtifacts } from './stones/getAllStoneDriveArtifacts';
import { getAllStones } from './stones/getAllStones';

/**
 * .what = echoes current stone and pass command for bound route
 * .why = provides GPS-like guidance for clones at session start/end
 */
export const stepRouteDrive = async (input: {
  route?: string;
  mode?: 'hook';
}): Promise<{ emit: { stdout: string } | null }> => {
  // derive route from input or bound branch
  let route = input.route;
  if (!route) {
    const bind = await getRouteBindByBranch({ branch: null });
    if (!bind) {
      // no route bound → silent no-op
      return { emit: null };
    }
    route = bind.route;
  }

  // get all stones and artifacts
  const stones = await getAllStones({ route });
  const artifacts = await getAllStoneDriveArtifacts({ route });

  // compute next stone(s)
  const nextStones = computeNextStones({
    stones,
    artifacts,
    query: '@next-one',
  });

  // no next stones → route complete
  if (nextStones.length === 0) {
    // in hook mode, be silent
    if (input.mode === 'hook') {
      return { emit: null };
    }
    // in direct mode, say route complete
    return {
      emit: {
        stdout: formatRouteDriveComplete(),
      },
    };
  }

  // get first stone and read its content
  const stone = nextStones[0]!;
  const stoneContent = await fs.readFile(stone.path, 'utf-8');

  // format output
  return {
    emit: {
      stdout: formatRouteDrive({
        route,
        stone: stone.name,
        content: stoneContent,
      }),
    },
  };
};

/**
 * .what = formats route.drive output when route is complete
 * .why = consistent output for completed routes
 */
const formatRouteDriveComplete = (): string => {
  const lines: string[] = [];
  lines.push(`🦉 where were we?`);
  lines.push('');
  lines.push(`🗿 route.drive`);
  lines.push(`   └─ route complete! 🎉`);
  return lines.join('\n');
};

/**
 * .what = formats route.drive output with stone content
 * .why = provides GPS-like guidance with full stone context
 */
const formatRouteDrive = (input: {
  route: string;
  stone: string;
  content: string;
}): string => {
  const lines: string[] = [];

  // header
  lines.push(`🦉 where were we?`);
  lines.push('');

  // route.drive tree
  lines.push(`🗿 route.drive`);
  lines.push(`   ├─ where do we go?`);
  lines.push(`   │  ├─ route = ${input.route}`);
  lines.push(`   │  └─ stone = ${input.stone}`);
  lines.push(`   │`);

  // pass command (first instance)
  const passCmd = `rhx route.stone.set --stone ${input.stone} --as passed`;
  lines.push(`   ├─ are we there yet? if so, run`);
  lines.push(`   │  └─ ${passCmd}`);
  lines.push(`   │`);

  // stone content block
  lines.push(`   ├─ here's the stone`);
  lines.push(`   │  ├─`);
  lines.push(`   │  │`);

  // format stone content with proper indentation
  const contentLines = input.content.split('\n');
  for (const contentLine of contentLines) {
    lines.push(`   │  │  ${contentLine}`);
  }

  lines.push(`   │  └─`);
  lines.push(`   │`);

  // pass command (second instance, for easy copy)
  lines.push(`   └─ are we there yet? if so, run`);
  lines.push(`      └─ ${passCmd}`);

  return lines.join('\n');
};
