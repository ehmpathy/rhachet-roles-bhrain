import { BadRequestError } from 'helpful-errors';
import * as path from 'path';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { setPassageReport } from '../passage/setPassageReport';
import { findOneStoneByPattern } from '../stones/asStoneGlob';
import { getAllStones } from '../stones/getAllStones';
import { getBlockedChallengeDecision } from './getBlockedChallengeDecision';
import { setBlockedTriggeredReport } from './setBlockedTriggeredReport';

/**
 * .what = attempts to mark a stone as blocked after challenge validation
 * .why = enables robots to signal escalation to humans with forced reflection
 */
export const setStoneAsBlocked = async (input: {
  stone: string;
  route: string;
}): Promise<{
  blocked: boolean;
  challenged: boolean;
  emit: { stdout: string };
}> => {
  // find the stone
  const stones = await getAllStones({ route: input.route });
  const stoneMatched = findOneStoneByPattern({
    stones,
    pattern: input.stone,
  });
  if (!stoneMatched) {
    throw new BadRequestError('stone not found', { stone: input.stone });
  }

  // check challenge decision
  const { decision, articulationPath } = await getBlockedChallengeDecision({
    stone: stoneMatched.name,
    route: input.route,
  });

  // if first attempt, create triggered file and return nudge
  if (decision === 'challenge:first') {
    await setBlockedTriggeredReport({
      stone: stoneMatched.name,
      route: input.route,
    });

    return {
      blocked: false,
      challenged: true,
      emit: {
        stdout: formatBlockedNudge({
          stone: stoneMatched.name,
          articulationPath: path.relative(process.cwd(), articulationPath),
        }),
      },
    };
  }

  // if no articulation, return nudge (already triggered)
  if (decision === 'challenge:absent') {
    return {
      blocked: false,
      challenged: true,
      emit: {
        stdout: formatBlockedNudge({
          stone: stoneMatched.name,
          articulationPath: path.relative(process.cwd(), articulationPath),
        }),
      },
    };
  }

  // allowed: record blocked status in passage.jsonl
  await setPassageReport({
    report: new PassageReport({
      stone: stoneMatched.name,
      status: 'blocked',
    }),
    route: input.route,
  });

  return {
    blocked: true,
    challenged: false,
    emit: {
      stdout: formatBlockedSuccess({
        stone: stoneMatched.name,
        articulationPath: path.relative(process.cwd(), articulationPath),
      }),
    },
  };
};

/**
 * .what = formats blocked nudge stdout with owl vibe
 * .why = guides robot to articulate what blocks them before escalation
 */
const formatBlockedNudge = (input: {
  stone: string;
  articulationPath: string;
}): string => {
  const lines: string[] = [];

  lines.push('🦉 the way speaks for itself');
  lines.push('');
  lines.push('🗿 route.stone.set');
  lines.push(`   ├─ stone = ${input.stone}`);
  lines.push(`   └─ passage = unchanged (articulation required)`);
  lines.push('');
  lines.push('🍂 failure is only the opportunity to begin again');
  lines.push('   │');
  lines.push('   ├─ ...');
  lines.push('   │');
  lines.push('   ├─ what blocks you, grows you 🪷');
  lines.push('   │  ├─');
  lines.push('   │  │');
  lines.push('   │  │  the obstacle is not in the way');
  lines.push('   │  │  the obstacle is the way');
  lines.push('   │  │  have you learned from it yet?');
  lines.push('   │  │');
  lines.push('   │  └─');
  lines.push('   │');
  lines.push('   ├─ before you escalate 🪷');
  lines.push('   │  ├─');
  lines.push('   │  │');
  lines.push('   │  │  have you tried --as passed first?');
  lines.push('   │  │  have you tried to figure it out on your own?');
  lines.push('   │  │  have you been true to the way? skipped no steps?');
  lines.push('   │  │');
  lines.push('   │  └─');
  lines.push('   │');
  lines.push('   ├─ articulate into');
  lines.push(`   │  │  └─ ${input.articulationPath}`);
  lines.push('   │  │');
  lines.push('   │  ├─ what blocks you 🪘');
  lines.push('   │  │  ├─');
  lines.push('   │  │  │');
  lines.push('   │  │  │  describe the obstacle clearly');
  lines.push('   │  │  │  so the human knows where to step in');
  lines.push('   │  │  │');
  lines.push('   │  │  └─');
  lines.push('   │  │');
  lines.push('   │  ├─ what you tried 🪘');
  lines.push('   │  │  ├─');
  lines.push('   │  │  │');
  lines.push('   │  │  │  show your work');
  lines.push('   │  │  │  so the human knows you walked the way');
  lines.push('   │  │  │');
  lines.push('   │  │  └─');
  lines.push('   │  │');
  lines.push('   │  └─ what you need 🪘');
  lines.push('   │     ├─');
  lines.push('   │     │');
  lines.push('   │     │  ask for exactly what would unblock you');
  lines.push('   │     │  so the human can provide it');
  lines.push('   │     │');
  lines.push('   │     └─');
  lines.push('   │');
  lines.push(`   └─ when you've truly reflected, run`);
  lines.push(
    `      └─ rhx route.stone.set --stone ${input.stone} --as blocked`,
  );

  return lines.join('\n');
};

/**
 * .what = formats blocked success stdout with owl vibe
 * .why = confirms block was recorded and shows reason path
 */
const formatBlockedSuccess = (input: {
  stone: string;
  articulationPath: string;
}): string => {
  const lines: string[] = [];

  lines.push('🦉 the way speaks for itself');
  lines.push('');
  lines.push('🗿 route.stone.set');
  lines.push(`   ├─ stone = ${input.stone}`);
  lines.push(`   ├─ passage = blocked`);
  lines.push(`   └─ reason: ${input.articulationPath}`);

  return lines.join('\n');
};
