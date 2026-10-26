import * as fs from 'fs';
import * as path from 'path';
import {
  genTempDir,
  getError,
  given,
  then,
  useBeforeAll,
  when,
} from 'test-fns';

import { asRouteBindFlagName } from '@src/domain.operations/route/bind/asRouteBindFlagName';

import { getOneRouteStatusLineFingerprint } from './getOneRouteStatusLineFingerprint';

const BRANCH = 'vlad/fingerprint';

/**
 * .what = the fingerprint at its own grain: which writes move it, which do not, and a fault
 * .why = the fingerprint is the whole hit-vs-miss decision; its allowlist and its catch are
 *        clamped here, never only through the orchestrator
 */
describe('getOneRouteStatusLineFingerprint.integration', () => {
  const genRoute = (input: {
    slug: string;
  }): { cwd: string; stateDir: string } => {
    const cwd = fs.realpathSync(genTempDir({ slug: input.slug }));
    const stateDir = path.join(cwd, 'my-route', '.route');
    fs.mkdirSync(stateDir, { recursive: true });
    fs.writeFileSync(
      path.join(stateDir, asRouteBindFlagName({ branch: BRANCH })),
      '',
    );
    return { cwd, stateDir };
  };
  const fingerprintOf = (input: { cwd: string }): string =>
    getOneRouteStatusLineFingerprint({
      cwd: input.cwd,
      branch: BRANCH,
      route: 'my-route',
    });

  given('[case1] an unbound seat', () => {
    when('[t0] the seat is fingerprinted', () => {
      then('it fingerprints on the branch alone', () => {
        expect(
          getOneRouteStatusLineFingerprint({
            cwd: '/any',
            branch: BRANCH,
            route: null,
          }),
        ).toEqual(`branch=${BRANCH}`);
      });
    });
  });

  given('[case2] a bound route', () => {
    const scene = useBeforeAll(async () =>
      genRoute({ slug: 'fingerprint-case2' }),
    );

    when('[t0] a hook writes a file the render never reads', () => {
      then('the fingerprint holds still', () => {
        const before = fingerprintOf(scene);
        fs.writeFileSync(
          path.join(scene.stateDir, '.bouncer.cache.json'),
          '{}',
        );
        fs.writeFileSync(
          path.join(scene.stateDir, '.drive.blockers.latest.json'),
          '{}',
        );
        expect(fingerprintOf(scene)).toEqual(before);
      });
    });

    when('[t1] a passage lands', () => {
      then('the fingerprint moves', () => {
        const before = fingerprintOf(scene);
        fs.appendFileSync(path.join(scene.stateDir, 'passage.jsonl'), '{}\n');
        expect(fingerprintOf(scene)).not.toEqual(before);
      });
    });

    when('[t2] a self-review promise is written', () => {
      then('the fingerprint moves', () => {
        const before = fingerprintOf(scene);
        fs.writeFileSync(
          path.join(scene.stateDir, '1.vision.guard.promise.slug-a.md'),
          '# promised',
        );
        expect(fingerprintOf(scene)).not.toEqual(before);
      });
    });

    when('[t3] the route dir has not been driven (no state dir)', () => {
      then('the absent dir reads as no inputs, never a fault', () => {
        const cwd = fs.realpathSync(
          genTempDir({ slug: 'fingerprint-case2-t3' }),
        );
        fs.mkdirSync(path.join(cwd, 'my-route'));
        expect(fingerprintOf({ cwd }).split('\n')).toHaveLength(2);
      });
    });
  });

  given(
    '[case3] a render input that faults on stat for a cause other than absence',
    () => {
      // the passage ledger is a symlink to itself, so its stat faults ELOOP
      const scene = useBeforeAll(async () => {
        const route = genRoute({ slug: 'fingerprint-case3' });
        const loopPath = path.join(route.stateDir, 'passage.jsonl');
        fs.symlinkSync(loopPath, loopPath);
        return route;
      });

      when('[t0] the route is fingerprinted', () => {
        then(
          'CLAMP: it rethrows the fault, never folds it into a row',
          async () => {
            const error = await getError(async () => fingerprintOf(scene));
            expect(error).toHaveProperty('code', 'ELOOP');
          },
        );
      });
    },
  );
});
