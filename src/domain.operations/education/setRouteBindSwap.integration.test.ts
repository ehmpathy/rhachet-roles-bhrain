import { execSync } from 'child_process';
import * as fs from 'fs/promises';
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
import { getRouteBindByBranch } from '@src/domain.operations/route/bind/getRouteBindByBranch';
import { setRouteBind } from '@src/domain.operations/route/bind/setRouteBind';

import { setRouteBindSwap } from './setRouteBindSwap';

describe('setRouteBindSwap', () => {
  given('[case1] a branch bound to a pursuit', () => {
    const scene = useBeforeAll(async () => {
      const repoRoot = genTempDir({ slug: 'test-bind-swap', git: true });
      execSync('git checkout -b human/test-bind-swap', { cwd: repoRoot });
      await fs.mkdir(path.join(repoRoot, 'pursuit'), { recursive: true });
      await fs.mkdir(path.join(repoRoot, 'course'), { recursive: true });
      return { repoRoot };
    });

    /**
     * .what = run a bind operation from the temp repo root, then return to the prior cwd
     */
    const withinRepo = async <T>(logic: () => Promise<T>): Promise<T> => {
      const cwdPrior = process.cwd();
      process.chdir(scene.repoRoot);
      try {
        return await logic();
      } finally {
        process.chdir(cwdPrior);
      }
    };

    when('[t0] the swap targets a route that exists', () => {
      then('the bind moves to the target', async () => {
        const bound = await withinRepo(async () => {
          await setRouteBind({ route: 'pursuit' });
          await setRouteBindSwap({
            route: 'course',
            repoRoot: scene.repoRoot,
          });
          return getRouteBindByBranch({ branch: null });
        });
        expect(bound?.route).toEqual('course');
      });
    });

    when('[t1] the set faults after the del ran', () => {
      then(
        'the prior bind is restored and the fault names both routes',
        async () => {
          const { error, bound } = await withinRepo(async () => {
            await setRouteBindSwap({
              route: 'pursuit',
              repoRoot: scene.repoRoot,
            });
            const error = await getError(
              setRouteBindSwap({
                route: 'route-absent',
                repoRoot: scene.repoRoot,
              }),
            );
            const bound = await getRouteBindByBranch({ branch: null });
            return { error, bound };
          });
          expect(error.message).toContain(
            'bind swap failed; the prior bind was restored',
          );
          expect(error.message).toContain('route-absent');
          expect(bound?.route).toEqual('pursuit');
        },
      );
    });
  });

  given('[case2] a bind flag on a branch where no bind may be set', () => {
    // a flag written by hand on main: the del removes it, then both the set and the restore
    // refuse (main is protected), so the restore faults as the set did
    const scene = useBeforeAll(async () => {
      const repoRoot = genTempDir({ slug: 'test-bind-swap-main', git: true });
      execSync('git checkout -B main', { cwd: repoRoot });
      await fs.mkdir(path.join(repoRoot, 'pursuit', '.route'), {
        recursive: true,
      });
      await fs.mkdir(path.join(repoRoot, 'course'), { recursive: true });
      await fs.writeFile(
        path.join(
          repoRoot,
          'pursuit',
          '.route',
          asRouteBindFlagName({ branch: 'main' }),
        ),
        'branch: main\nbound_by: route.bind skill\n',
      );
      return { repoRoot };
    });

    when('[t0] a swap runs, and the set and the restore both fault', () => {
      then(
        'the fault names both causes, the unbound branch, and the rebind',
        async () => {
          const cwdPrior = process.cwd();
          process.chdir(scene.repoRoot);
          const { error, bound } = await (async () => {
            const error = await getError(
              setRouteBindSwap({ route: 'course', repoRoot: scene.repoRoot }),
            );
            const bound = await getRouteBindByBranch({ branch: null });
            return { error, bound };
          })().finally(() => process.chdir(cwdPrior));
          expect(error.message).toContain(
            'bind swap failed, and so did its restore; the branch is now bound to no route',
          );
          expect(error.message).toContain('causeOfRestore');
          expect(error.message).toContain('rhx route.bind.set --route pursuit');
          expect(bound).toEqual(null);
        },
      );
    });
  });
});
