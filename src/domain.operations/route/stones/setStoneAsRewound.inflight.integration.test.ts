import * as fs from 'fs/promises';
import { ConstraintError, UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';
import {
  genTempDir,
  getError,
  given,
  then,
  useBeforeAll,
  when,
} from 'test-fns';

import type { ContextCliEmit } from '@src/domain.objects/Driver/ContextCliEmit';

import { genContextReviewBrainSupplyDemo } from '../__test_assets__/genContextReviewBrainSupplyDemo';
import { enumRouteGuardReviewPeerFiles } from '../guard/review/peer/enumRouteGuardReviewPeerFiles';
import { getOneStoneRewindGeneration } from '../guard/round/getOneStoneRewindGeneration';
import { setStoneAsPassed } from './setStoneAsPassed';
import { setStoneAsRewound } from './setStoneAsRewound';

const passContext = genContextReviewBrainSupplyDemo();
const emitContext: ContextCliEmit = {
  cliEmit: { onGuardProgress: () => {} },
};

/**
 * .what = a temp route whose stone carries a guard with one fast lane and one slow lane
 * .why = the slow lane holds the round aloft for seconds after the fast lane already
 *        wrote its given — the exact window the defect lived in
 */
const genRouteWithSlowLane = async (input: { slug: string }) => {
  const route = genTempDir({ slug: input.slug, git: true });
  await fs.writeFile(path.join(route, '1.test.stone'), '# test stone');
  await fs.writeFile(path.join(route, '1.test.md'), '# test artifact');
  await fs.writeFile(
    path.join(route, '1.test.guard'),
    [
      'artifacts:',
      '  - "$route/1.test*.md"',
      'reviews:',
      '  peer:',
      '    - slug: fast',
      '      run: echo "blockers: 1\\nnitpicks: 0\\nfast review"',
      '      budget: 5',
      '      level: 1',
      '    - slug: slow',
      '      run: sleep 6; echo "blockers: 1\\nnitpicks: 0\\nslow review"',
      '      budget: 5',
      '      level: 1',
      'judges:',
      '  - echo "passed: false\\nreason: blockers found"',
    ].join('\n'),
  );
  return route;
};

/**
 * .what = waits until the stone's guard round has written at least one given
 * .why = the rewind must land AFTER a lane spoke and BEFORE the round ended; a poll on
 *        the real artifact pins that moment, never a guess at the clock
 */
const waitForOneGiven = async (input: { route: string }): Promise<string[]> => {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const givens = await enumRouteGuardReviewPeerFiles({
      route: input.route,
      stone: '1.test',
    });
    if (givens.length > 0) return givens;
    await new Promise((done) => setTimeout(done, 100));
  }
  throw new UnexpectedCodePathError('no given was written within 20s', {
    route: input.route,
    hint: 'the fast lane must write its given before the slow lane ends; check the guard round began and its lanes ran',
  });
};

/**
 * .what = clamps that a guard round a rewind superseded writes naught after the rewind
 * .why = the dogfood defect (2026-10-06): two `--as rewound` ran while a 5.1 round was
 *        aloft. the rewind deleted the givens the round had already written, and later
 *        lanes wrote after it, so the stone read lanes that "have not spoken" which the
 *        driver could not answer. now the rewind bumps the stone's generation, and every
 *        round write checks it under a short hold (rule.require.clamp-edge-cases)
 */
describe('setStoneAsRewound.inflight', () => {
  given('[case1] a guard round in flight, one lane already spoke', () => {
    const scene = useBeforeAll(async () => {
      const route = await genRouteWithSlowLane({ slug: 'rewind-inflight' });

      // start the round, and hold it aloft
      const round = setStoneAsPassed({ stone: '1.test', route }, passContext);

      // rewind once the fast lane spoke, while the slow lane still sleeps
      const givensBefore = await waitForOneGiven({ route });
      const generationBefore = await getOneStoneRewindGeneration({
        route,
        stone: '1.test',
      });
      const rewound = await setStoneAsRewound(
        { stone: '1.test', route },
        emitContext,
      );
      const generationAfter = await getOneStoneRewindGeneration({
        route,
        stone: '1.test',
      });
      const givensAfterRewind = await enumRouteGuardReviewPeerFiles({
        route,
        stone: '1.test',
      });

      // let the round land: the slow lane finishes after the rewind
      const roundError = await getError(round);
      const givensAfterRound = await enumRouteGuardReviewPeerFiles({
        route,
        stone: '1.test',
      });

      return {
        givensBefore,
        generationBefore,
        rewound,
        generationAfter,
        givensAfterRewind,
        roundError,
        givensAfterRound,
      };
    });

    when('[t0] the rewind runs mid-round', () => {
      then('it proceeds — a live round no longer blocks a rewind', () => {
        expect(scene.rewound.rewound).toBe(true);
      });

      then('it bumps the stone generation by one', () => {
        expect(scene.generationAfter).toEqual(scene.generationBefore + 1);
      });

      then('it clears the given the round already wrote', () => {
        expect(scene.givensBefore.length).toBeGreaterThan(0);
        expect(scene.givensAfterRewind).toEqual([]);
      });
    });

    when('[t1] the superseded round lands after the rewind', () => {
      then('it ends as a ConstraintError that names the supersession', () => {
        expect(scene.roundError).toBeInstanceOf(ConstraintError);
        expect(scene.roundError.message).toContain(
          'a rewind superseded this guard round of stone 1.test',
        );
        expect(scene.roundError.message).toContain(
          'rhx route.stone.set --stone 1.test --as arrived',
        );
      });

      then('the refusal a driver reads is pinned whole', () => {
        expect(scene.roundError.message).toMatchSnapshot();
      });

      then('it writes no given after the rewind', () => {
        expect(scene.givensAfterRound).toEqual([]);
      });
    });
  });

  given('[case2] no guard round has ever run', () => {
    const scene = useBeforeAll(async () => {
      const route = await genRouteWithSlowLane({ slug: 'rewind-idle' });
      const rewound = await setStoneAsRewound(
        { stone: '1.test', route },
        emitContext,
      );
      const generation = await getOneStoneRewindGeneration({
        route,
        stone: '1.test',
      });
      return { rewound, generation };
    });

    when('[t0] the rewind runs', () => {
      then('it proceeds, unchanged', () => {
        expect(scene.rewound.rewound).toBe(true);
      });

      then('the stone sits at generation 1', () => {
        expect(scene.generation).toEqual(1);
      });
    });
  });
});
