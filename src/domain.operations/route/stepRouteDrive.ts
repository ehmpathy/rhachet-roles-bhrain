import * as fs from 'fs/promises';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getRouteBindByBranch } from './bind/getRouteBindByBranch';
import { setDriveBlockerState } from './drive/setDriveBlockerState';
import { getOneStoneGuardApproval } from './judges/getOneStoneGuardApproval';
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
}): Promise<{
  emit: {
    stdout?: string;
    stderr?: { reason: string; code: number };
  } | null;
}> => {
  // derive route from input or bound branch
  let route = input.route;
  if (!route) {
    const bind = await getRouteBindByBranch({ branch: null });
    if (!bind) {
      // no route bound = not our concern, don't block
      return {
        emit: { stdout: formatRouteDriveUnbound() },
      };
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

  // no next stones → route complete, ok to stop
  if (nextStones.length === 0) {
    // in hook mode, silent exit when route complete
    if (input.mode === 'hook') {
      return { emit: null };
    }
    return {
      emit: { stdout: formatRouteDriveComplete() },
    };
  }

  // get first stone and read its content
  const stone = nextStones[0]!;
  const stoneContent = await fs.readFile(stone.path, 'utf-8');

  // format output
  const stdout = formatRouteDrive({
    route,
    stone: stone.name,
    content: stoneContent,
  });

  // in hook mode, track and potentially block stop
  if (input.mode === 'hook') {
    // check if stone needs human approval and that's the only blocker
    // if so, allow stop (agent can't proceed without human)
    const needsApproval = await checkNeedsHumanApproval({ stone, route });
    if (needsApproval) {
      // allow stop with informative output
      return {
        emit: {
          stdout: formatRouteDriveNeedsApproval({
            route,
            stone: stone.name,
          }),
        },
      };
    }

    // track this block attempt
    const { state } = await setDriveBlockerState({ route, stone: stone.name });

    // check if we've exceeded max consecutive blocks (cutoff: 21)
    const maxBlocks = 21;
    if (state.count > maxBlocks) {
      // stop block exhausted, exit 3 = tell human about stuck state
      return {
        emit: {
          stdout: formatRouteDriveExhausted({
            route,
            stone: stone.name,
            count: state.count,
            max: maxBlocks,
          }),
          stderr: {
            reason: formatRouteDriveEscalate({
              route,
              stone: stone.name,
              count: state.count,
            }),
            code: 3,
          },
        },
      };
    }

    // block stop
    return {
      emit: {
        stdout,
        stderr: {
          reason: formatRouteDriveBlockReason({
            route,
            stone: stone.name,
            count: state.count,
          }),
          code: 2,
        },
      },
    };
  }

  // direct mode, just show output
  return {
    emit: { stdout },
  };
};

/**
 * .what = formats route.drive output when no route is bound
 * .why = friendly feedback instead of silence
 */
const formatRouteDriveUnbound = (): string => {
  const lines: string[] = [];
  lines.push(`🦉 where were we?`);
  lines.push('');
  lines.push(`🗿 route.drive`);
  lines.push(`   └─ dunno, route not bound`);
  return lines.join('\n');
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
 * .what = formats reason for block in hook mode
 * .why = provides clear instruction to Claude on what to do next
 */
const formatRouteDriveBlockReason = (input: {
  route: string;
  stone: string;
  count: number;
}): string => {
  const passCmd = `rhx route.stone.set --stone ${input.stone} --as passed`;
  return `route not complete (block ${input.count}/21). next stone: ${input.stone}. when done, run: ${passCmd}`;
};

/**
 * .what = formats output when block limit exhausted
 * .why = signals need for human intervention
 */
const formatRouteDriveExhausted = (input: {
  route: string;
  stone: string;
  count: number;
  max: number;
}): string => {
  const lines: string[] = [];
  lines.push(`🦉 where were we?`);
  lines.push('');
  lines.push(`🗿 route.drive`);
  lines.push(`   ├─ where do we go?`);
  lines.push(`   │  ├─ route = ${input.route}`);
  lines.push(`   │  └─ stone = ${input.stone}`);
  lines.push(`   │`);
  lines.push(`   └─ ⚠️ stuck! blocked ${input.count}x (max: ${input.max})`);
  lines.push(`      └─ please tell a human what you saw and where`);
  return lines.join('\n');
};

/**
 * .what = formats escalation message for stderr when stuck
 * .why = provides context for human intervention
 */
const formatRouteDriveEscalate = (input: {
  route: string;
  stone: string;
  count: number;
}): string => {
  return `stuck on stone ${input.stone} after ${input.count} attempts. please tell a human what you saw, where you got stuck, and what you tried.`;
};

/**
 * .what = checks if stone is blocked specifically on human approval
 * .why = enables agent to stop when blocked on approval (can't proceed without human)
 *
 * returns true when:
 * - stone has a guard with an approved? judge mechanism
 * - approval marker hasn't been granted yet
 */
const checkNeedsHumanApproval = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<boolean> => {
  // no guard = no approval requirement
  if (!input.stone.guard) return false;

  // check if guard has approved? judge mechanism
  const hasApprovalJudge = input.stone.guard.judges.some((judge) =>
    judge.includes('--mechanism approved?'),
  );
  if (!hasApprovalJudge) return false;

  // check if approval has been granted
  const approval = await getOneStoneGuardApproval({
    stone: input.stone,
    route: input.route,
  });

  // needs approval if: has approval judge AND approval not yet granted
  return approval === null;
};

/**
 * .what = formats route.drive output when stone needs human approval
 * .why = allows agent to stop gracefully when blocked on human approval
 */
const formatRouteDriveNeedsApproval = (input: {
  route: string;
  stone: string;
}): string => {
  const approveCmd = `rhx route.stone.set --stone ${input.stone} --as approved`;
  const lines: string[] = [];
  lines.push(`🦉 where were we?`);
  lines.push('');
  lines.push(`🗿 route.drive`);
  lines.push(`   ├─ where do we go?`);
  lines.push(`   │  ├─ route = ${input.route}`);
  lines.push(`   │  └─ stone = ${input.stone}`);
  lines.push(`   │`);
  lines.push(`   └─ halted, human approval required`);
  lines.push(`      ├─ please ask your human to`);
  lines.push(`      └─ ${approveCmd}`);
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
