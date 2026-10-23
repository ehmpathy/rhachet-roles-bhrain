import * as fs from 'fs/promises';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';
import { genTempDir, given, then, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';

import { runStoneGuardJudges } from './runStoneGuardJudges';

/**
 * .what = the paths the prior-judge reads were asked for, in call order, and which call to slow
 * .why = the pour starts each read in enumeration order, so the call order IS the enumeration
 *        order; a slowed call lets the test choose which read completes last. the names carry
 *        the `mock` prefix so the hoisted jest.mock factory below may reference them
 */
const mockJudgeReads: string[] = [];
const mockJudgeReadToSlow: { ordinal: number | null } = { ordinal: null };

/**
 * .mock = the judge artifact communicator, wrapped around its real implementation
 * .why = read completion order is set by the fs and cannot be forced on demand. the wrapper
 *        records each call, holds the chosen call back for a moment, then calls the REAL
 *        communicator on the REAL file — so every artifact is the real read of a real file, and
 *        only WHEN it completes is chosen
 * .real = runStoneGuardJudges.integration.test.ts [case5] runs the same cache with no wrapper
 */
jest.mock('./getOneJudgeArtifactContent', () => {
  const actual = jest.requireActual('./getOneJudgeArtifactContent');
  return {
    getOneJudgeArtifactContent: async (input: { path: string }) => {
      const ordinal = mockJudgeReads.length;
      mockJudgeReads.push(input.path);
      if (ordinal === mockJudgeReadToSlow.ordinal)
        await new Promise((done) => setTimeout(done, 200));
      return actual.getOneJudgeArtifactContent(input);
    },
  };
});

// a fresh route was never rewound, so its guard round sits at generation 0
const noopContext = {
  cliEmit: { onGuardProgress: () => {} },
  guardRound: { generation: 0 },
};

/**
 * .what = a route that holds two PASSED prior judge artifacts for judge index 1, same hashes
 * .why = the cache must pick one of two equal candidates; the rule is the first listed wins
 */
const genRouteWithTwoPriorPasses = async (input: {
  slug: string;
}): Promise<{
  stone: RouteStone;
  guard: RouteStoneGuard;
  route: string;
}> => {
  const route = genTempDir({ slug: input.slug });
  const stone = new RouteStone({
    name: '1.test',
    path: path.join(route, '1.test.stone'),
    guard: null,
  });
  const guard = new RouteStoneGuard({
    path: path.join(route, '1.test.guard'),
    artifacts: ['1.test*.md'],
    reviews: { self: [], peer: [] },
    judges: ['echo "passed: true\\nreason: all checks passed"'],
    protect: [],
  });

  // the first run writes one real passed artifact
  const [judgeFirst] = await runStoneGuardJudges(
    { stone, guard, hash: 'orderhash', iteration: 1, route },
    noopContext,
  );
  const first =
    judgeFirst ??
    UnexpectedCodePathError.throw('the first run wrote no judge artifact', {
      route,
      hint: 'check that the guard declares its echo judge and that runStoneGuardJudges writes the artifact before it returns',
    });

  // a twin at a later judge iteration: same hashes, same index, also passed
  const twinPath = first.path.replace('.i1p1.', '.i1p2.');
  await fs.copyFile(first.path, twinPath);
  return { stone, guard, route };
};

describe('runStoneGuardJudges', () => {
  given('[case1] two passed prior judges share one judge index', () => {
    when('[t0] the first listed read completes LAST', () => {
      then('the first listed prior still wins the cache', async () => {
        const scene = await genRouteWithTwoPriorPasses({
          slug: 'judges-prior-order-slow-first',
        });
        mockJudgeReads.length = 0; // .note = deliberate mutation: reset the module-scope call record per case
        mockJudgeReadToSlow.ordinal = 0;
        const judges = await runStoneGuardJudges(
          { ...scene, hash: 'orderhash', iteration: 1 },
          noopContext,
        );
        mockJudgeReadToSlow.ordinal = null;
        expect(mockJudgeReads).toHaveLength(2);
        expect(judges).toHaveLength(1);
        expect(judges[0]?.path).toEqual(mockJudgeReads[0]);
      });
    });

    when('[t1] the second listed read completes LAST', () => {
      then('the first listed prior still wins the cache', async () => {
        const scene = await genRouteWithTwoPriorPasses({
          slug: 'judges-prior-order-slow-second',
        });
        mockJudgeReads.length = 0; // .note = deliberate mutation: reset the module-scope call record per case
        mockJudgeReadToSlow.ordinal = 1;
        const judges = await runStoneGuardJudges(
          { ...scene, hash: 'orderhash', iteration: 1 },
          noopContext,
        );
        mockJudgeReadToSlow.ordinal = null;
        expect(mockJudgeReads).toHaveLength(2);
        expect(judges).toHaveLength(1);
        expect(judges[0]?.path).toEqual(mockJudgeReads[0]);
      });
    });
  });
});
