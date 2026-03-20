import * as fs from 'fs/promises';

import { getRouteBindByBranch } from './bind/getRouteBindByBranch';
import { computeRouteBouncerCache } from './bouncer/computeRouteBouncerCache';
import { setRouteBouncerCache } from './bouncer/setRouteBouncerCache';
import { getStoneGuardBlockerReport } from './drive/getStoneGuardBlockerReport';
import { setDriveBlockerState } from './drive/setDriveBlockerState';
import { getOneStoneGuardApproval } from './judges/getOneStoneGuardApproval';
import { getAllPassageReports } from './passage/getAllPassageReports';
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

  // precompute bouncer cache for artifact gate enforcement
  const bouncerCache = await computeRouteBouncerCache({
    cwd: process.cwd(),
    route,
  });
  await setRouteBouncerCache({ cache: bouncerCache, route });

  // in hook mode, check for malfunction or blocked status immediately
  // .note = getAllPassageReports returns latest per stone (last entry wins)
  //         a subsequent 'passed' status resolves the malfunction or blocked state
  if (input.mode === 'hook') {
    const passageReports = await getAllPassageReports({ route });

    // check for malfunction
    const malfunctionReport = passageReports.find(
      (r) => r.status === 'malfunction',
    );
    if (malfunctionReport) {
      return {
        emit: {
          stdout: formatRouteDriveMalfunction({
            route,
            stone: malfunctionReport.stone,
          }),
          stderr: {
            reason: formatRouteDriveMalfunctionEscalate({
              stone: malfunctionReport.stone,
            }),
            code: 3,
          },
        },
      };
    }

    // check for blocked status (agent explicitly marked stone as blocked via --as blocked)
    // note: must check that blocked is the LATEST status for that stone
    // since passage.jsonl is append-only, later entries supersede earlier ones
    // note: guard-initiated blocks have a `blocker` field (e.g., 'approval', 'review.self')
    //       while agent-initiated blocks do not - only show this path for agent-initiated
    const blockedReport = passageReports.find((r) => r.status === 'blocked');
    if (blockedReport) {
      // find the latest report for this stone
      const latestForStone = passageReports
        .filter((r) => r.stone === blockedReport.stone)
        .pop();
      // only report blocked if it's still the latest status AND it's agent-initiated (no blocker field)
      if (latestForStone?.status === 'blocked' && !latestForStone.blocker) {
        return {
          emit: {
            stdout: formatRouteDriveBlocked({
              route,
              stone: blockedReport.stone,
            }),
          },
        };
      }
    }
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

  // in hook mode, track and potentially block stop
  if (input.mode === 'hook') {
    // check blocker report to see if agent is blocked on human approval
    // this is set by route.stone.set --as passed when it fails
    const blockerReport = await getStoneGuardBlockerReport({
      stone: stone.name,
      route,
    });

    // if blocked on approval, check if approval was already granted
    if (blockerReport?.blocker === 'approval') {
      const approvalArtifact = await getOneStoneGuardApproval({
        stone,
        route,
      });

      // approval granted means agent CAN proceed (run pass again)
      // so we should NOT allow stop - fall through to block logic below
      if (!approvalArtifact) {
        // approval NOT granted yet - allow stop (agent must wait for human)
        return {
          emit: {
            stdout: formatRouteDriveNeedsApproval({
              route,
              stone: stone.name,
            }),
          },
        };
      }
      // fall through to block logic when approval was granted
    }

    // track this block attempt
    // .note = state.count tracks hooks without passage attempt; used for nudge threshold
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

    // format output with nudge threshold and blocked suggestion
    const stdout = formatRouteDrive({
      route,
      stone: stone.name,
      content: stoneContent,
      count: state.count,
      suggestBlocked: state.count > 5,
    });

    // block stop - same content in stdout AND stderr (for visibility), exit code 2 to signal
    return {
      emit: {
        stdout,
        stderr: { reason: stdout, code: 2 },
      },
    };
  }

  // direct mode, just show output (no nudge, no blocked suggestion)
  const stdout = formatRouteDrive({
    route,
    stone: stone.name,
    content: stoneContent,
    count: 0,
    suggestBlocked: false,
  });
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
 * .what = formats route.drive output when stone needs human approval
 * .why = allows agent to stop gracefully when blocked on human approval
 */
const formatRouteDriveNeedsApproval = (input: {
  route: string;
  stone: string;
}): string => {
  const approveCmd = `rhx route.stone.set --stone ${input.stone} --as approved`;
  const passCmd = `rhx route.stone.set --stone ${input.stone} --as passed`;
  const lines: string[] = [];
  lines.push(`🦉 where were we?`);
  lines.push('');
  lines.push(`🗿 route.drive`);
  lines.push(`   ├─ where do we go?`);
  lines.push(`   │  ├─ route = ${input.route}`);
  lines.push(`   │  └─ stone = ${input.stone}`);
  lines.push(`   │`);
  lines.push(`   └─ halted, human approval required`);
  lines.push(`      ├─ please ask a human to`);
  lines.push(`      │  └─ ${approveCmd}`);
  lines.push(`      │`);
  lines.push(`      └─ once they do, run`);
  lines.push(`         └─ ${passCmd}`);
  return lines.join('\n');
};

/**
 * .what = formats route.drive output when reviewer/judge malfunctioned
 * .why = immediate halt with escalation to human
 */
const formatRouteDriveMalfunction = (input: {
  route: string;
  stone: string;
}): string => {
  const lines: string[] = [];
  lines.push(`🦉 where were we?`);
  lines.push('');
  lines.push(`🗿 route.drive`);
  lines.push(`   ├─ where do we go?`);
  lines.push(`   │  ├─ route = ${input.route}`);
  lines.push(`   │  └─ stone = ${input.stone}`);
  lines.push(`   │`);
  lines.push(`   └─ 💥 halted, guard malfunction`);
  lines.push(
    `      └─ please tell a human this needs to be fixed before you can continue`,
  );
  return lines.join('\n');
};

/**
 * .what = formats escalation message for stderr when malfunction detected
 * .why = provides context for human intervention
 */
const formatRouteDriveMalfunctionEscalate = (input: {
  stone: string;
}): string => {
  return `reviewer or judge malfunctioned on stone ${input.stone}. a human must fix the malfunction before the route can proceed.`;
};

/**
 * .what = formats route.drive output when stone is blocked
 * .why = allows agent to stop gracefully when stone marked as blocked
 */
const formatRouteDriveBlocked = (input: {
  route: string;
  stone: string;
}): string => {
  const articulationPath = `${input.route}/.route/blocker/${input.stone}.md`;
  const lines: string[] = [];
  lines.push(`🦉 where were we?`);
  lines.push('');
  lines.push(`🗿 route.drive`);
  lines.push(`   ├─ where do we go?`);
  lines.push(`   │  ├─ route = ${input.route}`);
  lines.push(`   │  └─ stone = ${input.stone}`);
  lines.push(`   │`);
  lines.push(`   └─ halted, stone marked blocked`);
  lines.push(`      └─ reason: ${articulationPath}`);
  return lines.join('\n');
};

/**
 * .what = returns drum nudge tree bucket for stuck clones
 * .why = gentle reminder after 7+ hooks without passage attempt
 */
const formatRouteDriveNudge = (): string[] => {
  return [
    `   ├─ 🪘 walk the way`,
    `   │  ├─`,
    `   │  │`,
    `   │  │  do your work, then step back`,
    `   │  │  the only path to serenity`,
    `   │  │`,
    `   │  │  — tao te ching`,
    `   │  │`,
    `   │  └─`,
    `   │`,
  ];
};

/**
 * .what = formats route.drive output with stone content
 * .why = provides GPS-like guidance with full stone context
 *
 * .note = count tracks hooks without passage attempt (via setDriveBlockerState)
 *         if count >= 7, includes drum nudge to encourage action
 */
const formatRouteDrive = (input: {
  route: string;
  stone: string;
  content: string;
  count: number;
  suggestBlocked: boolean;
}): string => {
  const lines: string[] = [];

  // header
  lines.push(`🦉 where were we?`);
  lines.push('');

  // tea pause for stuck drivers (same trigger as suggestBlocked)
  if (input.suggestBlocked) {
    const arrivedCmd = `rhx route.stone.set --stone ${input.stone} --as arrived`;
    const passedCmd = `rhx route.stone.set --stone ${input.stone} --as passed`;
    const blockedCmd = `rhx route.stone.set --stone ${input.stone} --as blocked`;
    lines.push(`🍵 tea first. then, choose your path.`);
    lines.push(`   │`);
    lines.push(`   ├─ you must choose one`);
    lines.push(`   │  ├─ ready for review?`);
    lines.push(`   │  │  └─ ${arrivedCmd}`);
    lines.push(`   │  │`);
    lines.push(`   │  ├─ ready to continue?`);
    lines.push(`   │  │  └─ ${passedCmd}`);
    lines.push(`   │  │`);
    lines.push(`   │  └─ blocked and need help?`);
    lines.push(`   │     └─ ${blockedCmd}`);
    lines.push(`   │`);
    lines.push(`   └─ ⚠️ to refuse is not an option.`);
    lines.push(`      work on the stone, or mark your status.`);
    lines.push('');
  }

  // route.drive tree
  lines.push(`🗿 route.drive`);
  lines.push(`   ├─ where do we go?`);
  lines.push(`   │  ├─ route = ${input.route}`);
  lines.push(`   │  └─ stone = ${input.stone}`);
  lines.push(`   │`);

  // command prompt with both options
  const arrivedCmd = `rhx route.stone.set --stone ${input.stone} --as arrived`;
  const passedCmd = `rhx route.stone.set --stone ${input.stone} --as passed`;
  lines.push(`   ├─ are you here?`);
  lines.push(`   │  ├─ when ready for review, run:`);
  lines.push(`   │  │  └─ ${arrivedCmd}`);
  lines.push(`   │  └─ when ready to continue, run:`);
  lines.push(`   │     └─ ${passedCmd}`);
  lines.push(`   │`);

  // drum nudge for stuck clones (7+ hooks without passage attempt)
  if (input.count >= 7) {
    lines.push(...formatRouteDriveNudge());
  }

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

  // command prompt at bottom (easy copy after you read the stone)
  if (input.suggestBlocked) {
    // show blocked option when stuck
    const blockedCmd = `rhx route.stone.set --stone ${input.stone} --as blocked`;
    lines.push(`   ├─ are you here?`);
    lines.push(`   │  ├─ when ready for review, run:`);
    lines.push(`   │  │  └─ ${arrivedCmd}`);
    lines.push(`   │  └─ when ready to continue, run:`);
    lines.push(`   │     └─ ${passedCmd}`);
    lines.push(`   │`);
    lines.push(`   └─ are you blocked? if so, run`);
    lines.push(`      └─ ${blockedCmd}`);
  } else {
    lines.push(`   └─ are you here?`);
    lines.push(`      ├─ when ready for review, run:`);
    lines.push(`      │  └─ ${arrivedCmd}`);
    lines.push(`      └─ when ready to continue, run:`);
    lines.push(`         └─ ${passedCmd}`);
  }

  return lines.join('\n');
};
