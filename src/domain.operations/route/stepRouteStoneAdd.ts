import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';

import { formatRouteStoneEmit } from './formatRouteStoneEmit';
import { setRouteStatusLineFileOrWarn } from './statusLine/file/setRouteStatusLineFileOrWarn';
import { assertRouteFound } from './stones/assertRouteFound';
import { getAllStones } from './stones/getAllStones';
import { getContentFromSource } from './stones/getContentFromSource';
import { isValidStoneName } from './stones/isValidStoneName';
import { setOneStoneFileExclusive } from './stones/setOneStoneFileExclusive';

/**
 * .what = orchestrates stone creation in a route
 * .why = enables drivers to add stones on the fly
 */
export const stepRouteStoneAdd = async (input: {
  stone: string;
  source: string;
  stdin: string | null;
  route: string;
  mode: 'plan' | 'apply';
}): Promise<{
  stone: string;
  content: string;
  path: string;
  created: boolean;
  emit: { stdout: string } | null;
}> => {
  // validate route exists
  await assertRouteFound({ route: input.route });

  // validate stone name format
  const validation = isValidStoneName({ name: input.stone });
  if (!validation.valid) {
    throw new BadRequestError(validation.reason!, { stone: input.stone });
  }

  // extract content from source
  const { content } = await getContentFromSource({
    source: input.source,
    stdin: input.stdin,
    route: input.route,
  });

  // check collision: stone already exists (findsert semantics)
  const stones = await getAllStones({ route: input.route });
  const collision = stones.find((s) => s.name === input.stone);
  if (collision) {
    const contentFound = await fs.readFile(collision.path, 'utf-8');
    if (contentFound === content) {
      // idempotent: same content, no-op
      return {
        stone: input.stone,
        content,
        path: collision.path,
        created: false,
        emit: null,
      };
    }
    throw new BadRequestError(
      `stone already exists with different content: ${input.stone}; use \`route.stone.del\` first`,
      { path: collision.path },
    );
  }

  // compute stone file path
  const stonePath = path.join(input.route, `${input.stone}.stone`);

  // branch on mode
  if (input.mode === 'plan') {
    const stdout = formatRouteStoneEmit({
      operation: 'route.stone.add',
      mode: 'plan',
      stone: input.stone,
      route: input.route,
      source: input.source,
      content,
      path: stonePath,
    });

    return {
      stone: input.stone,
      content,
      path: stonePath,
      created: false,
      emit: { stdout },
    };
  }

  // apply mode: create stone file, exclusive, so a concurrent add of the same stone that
  // passed the collision check above refuses here rather than overwrite the first
  await setOneStoneFileExclusive({ stone: input.stone, stonePath, content });

  // refresh the status file the status line reads: a new stone may be the next one
  await setRouteStatusLineFileOrWarn({
    route: input.route,
    pointerAuthority: 'flag',
  });

  const stdout = formatRouteStoneEmit({
    operation: 'route.stone.add',
    mode: 'apply',
    stone: input.stone,
    route: input.route,
    source: input.source,
    content,
    path: stonePath,
  });

  return {
    stone: input.stone,
    content,
    path: stonePath,
    created: true,
    emit: { stdout },
  };
};
