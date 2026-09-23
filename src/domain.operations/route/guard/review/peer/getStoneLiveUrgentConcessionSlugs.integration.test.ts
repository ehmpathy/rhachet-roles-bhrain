import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { computeStoneReviewInputHash } from '../computeStoneReviewInputHash';
import { enumRouteGuardReviewPeerFiles } from './enumRouteGuardReviewPeerFiles';
import { getStoneLiveUrgentConcessionSlugs } from './getStoneLiveUrgentConcessionSlugs';

/**
 * .what = the clamp on WHAT LAPSES a warrant — a reviewer run, never a driver edit
 * .why = 🔴 the budget gate reads this as its warrant, and the sanctioned sequence is
 *        concede → fix → grant (S11). so a driver concedes urgent, EDITS the artifact to
 *        fix what it conceded, and only then asks for the round.
 *
 *        were an artifact edit to lapse the stance, that sequence would refuse every driver
 *        who followed it — the warrant would be gone by the time the grant was asked for, and
 *        the only way to hold one would be to ask BEFORE the fix. ⇒ the engine would refuse
 *        the very order it prints.
 *
 * 🔴 .it is an integration test rather than a unit one because the claim is about a file that
 *    is NOT written. a pure fold over `(absorptions, givens)` cannot express "the driver edited
 *    the artifact" at all — the edit's whole signature is that it moves the artifact hash and
 *    mints no given. so the hash is measured before and after, and the stance is read across it.
 */
const genRouteScene = async (input: {
  severity: 'better' | 'urgent';
}): Promise<{
  route: string;
  stone: RouteStone;
  artifact: string;
  hashBefore: string;
}> => {
  const route = await fs.mkdtemp(path.join(os.tmpdir(), 'route-warrant-'));

  const artifact = path.join(route, '1.vision.yield.md');
  await fs.writeFile(artifact, '# vision\n');

  const stone = new RouteStone({
    name: '1.vision',
    path: path.join(route, '1.vision.stone'),
    guard: null,
  });

  const hashBefore = await computeStoneReviewInputHash({ stone, route });

  // the lane's given — the reviewer spoke once, at the artifact's current hash
  const reviewsDir = path.join(route, '.reviews', 'peer');
  await fs.mkdir(reviewsDir, { recursive: true });
  await fs.writeFile(
    path.join(
      reviewsDir,
      `1.vision._.review.i001.${hashBefore}.r001._.given.by_peer.mech.md`,
    ),
    '1 blockers\n0 nitpicks\n',
  );

  // the stance keys on the given's PATH, so it is read back rather than rebuilt —
  // a hand-built path that drifted from the enumerator would pass for the wrong reason
  const [pathGiven] = await enumRouteGuardReviewPeerFiles({
    route,
    stone: '1.vision',
    kind: 'given',
  });

  const routeDir = path.join(route, '.route');
  await fs.mkdir(routeDir, { recursive: true });
  await fs.writeFile(
    path.join(routeDir, 'passage.jsonl'),
    `${JSON.stringify({
      stone: '1.vision',
      status: 'conceded',
      reviewer: 'mech',
      about: 'blocker.1',
      given: pathGiven,
      severity: input.severity,
    })}\n`,
  );

  return { route, stone, artifact, hashBefore };
};

describe('getStoneLiveUrgentConcessionSlugs', () => {
  given(
    '[case1] an urgent concession, then the driver fixes the artifact',
    () => {
      const scene = useBeforeAll(async () =>
        genRouteScene({ severity: 'urgent' }),
      );

      when('[t0] the warrant is read before the fix', () => {
        then('the lane is named', async () => {
          expect(
            await getStoneLiveUrgentConcessionSlugs({
              route: scene.route,
              stone: '1.vision',
            }),
          ).toEqual(['mech']);
        });
      });

      when('[t1] the driver edits the artifact it conceded', () => {
        // an object, never a bare tuple of primitives — `useThen` hands back a proxy
        const result = useThen('the fix lands', async () => {
          await fs.writeFile(
            scene.artifact,
            '# vision\n\nthe harm the driver conceded, now repaired.\n',
          );
          return {
            hashAfter: await computeStoneReviewInputHash({
              stone: scene.stone,
              route: scene.route,
            }),
            givenCount: (
              await enumRouteGuardReviewPeerFiles({
                route: scene.route,
                stone: '1.vision',
                kind: 'given',
              })
            ).length,
            slugs: await getStoneLiveUrgentConcessionSlugs({
              route: scene.route,
              stone: '1.vision',
            }),
          };
        });

        // without this the case could pass on an edit that changed naught, and the clamp
        // would assert a survival it never actually tested
        then('the artifact hash MOVED — the edit was real', () => {
          expect(result.hashAfter).not.toEqual(scene.hashBefore);
        });

        then('no new given was minted — the reviewer did not speak', () => {
          expect(result.givenCount).toEqual(1);
        });

        then('the warrant STANDS — an edit lapses no stance', () => {
          expect(result.slugs).toEqual(['mech']);
        });
      });
    },
  );

  given('[case2] an urgent concession, then the REVIEWER speaks again', () => {
    const scene = useBeforeAll(async () =>
      genRouteScene({ severity: 'urgent' }),
    );

    when('[t0] a later given lands for the same lane', () => {
      const result = useThen('the lane speaks', async () => {
        await fs.writeFile(
          path.join(
            scene.route,
            '.reviews',
            'peer',
            `1.vision._.review.i002.${scene.hashBefore}.r001._.given.by_peer.mech.md`,
          ),
          '1 blockers\n0 nitpicks\n',
        );
        return {
          slugs: await getStoneLiveUrgentConcessionSlugs({
            route: scene.route,
            stone: '1.vision',
          }),
        };
      });

      // the contrast that gives [case1] its teeth: a REVIEWER run DOES lapse the stance,
      // so the clamp pins a rule rather than a predicate that never says no
      then('the warrant has LAPSED', () => {
        expect(result.slugs).toEqual([]);
      });
    });
  });

  given('[case3] a BETTER concession, read as a warrant', () => {
    const scene = useBeforeAll(async () =>
      genRouteScene({ severity: 'better' }),
    );

    when('[t0] the warrant is read', () => {
      then('no lane is named — better never mints a warrant', async () => {
        expect(
          await getStoneLiveUrgentConcessionSlugs({
            route: scene.route,
            stone: '1.vision',
          }),
        ).toEqual([]);
      });
    });
  });
});
