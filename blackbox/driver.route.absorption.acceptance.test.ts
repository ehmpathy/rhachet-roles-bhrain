import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(
  __dirname,
  '.test/assets/route-peer-budget-multilevel',
);

/**
 * .what = acceptance coverage for the CLI usage-error paths of the stance contract —
 *         `route.stone.set --as disputed | conceded` with a malformed or incomplete
 *         invocation exits with a constraint code (2) and writes its guidance to stderr.
 * .why = `--as disputed | conceded` is the centerpiece contract of this whole behavior, and
 *        `blackbox/` held ZERO acceptance coverage of the surface — no `*stance*`, `*dispute*`,
 *        or `*concede*` suite existed (r010 blocker.1). this repo's own
 *        `rule.require.test-coverage-by-grain` grades an un-acceptance-tested CLI contract a
 *        blocker, so the surface owes at least one contract-boundary pin. these paths carry
 *        semantic exit codes and send the error to stderr (`rule.require.exit-code-semantics`
 *        + `rule.forbid.stdout-on-exit-errors`); without a boundary test a future change could
 *        silently regress the exit code, drop a required-flag guard, or leak the error to
 *        stdout (hidden on a non-zero exit).
 *
 * .note = every case here validates and exits BEFORE any review corpus is read — the stance's
 *         required-flag and shape gates fire ahead of `getAllStones` (route.ts:986 resolves the
 *         route, then the guards throw). so the setup needs only a linked driver skill and a
 *         resolvable route dir — no brain keys, no mock reviewers, no driven round. this is the
 *         pin that runs on every machine; the driven happy-path is the credential-gated
 *         journey suites' job (`driver.route.peer-budget-*`).
 *
 * .note = the DISPUTE happy path (a lane goes quiet, the road drives on) and the CONCEDE happy
 *         path (the hold is kept, a top-up is offered) are exercised at unit + integration
 *         grain — `setStoneAsAbsorbed.integration.test.ts` drives the write op end to end
 *         (R1–R5, idempotency), and `formatRouteGuardReviewPeerAbsorptionAck` + `formatGuardTree`
 *         pin the emits. this suite closes the one grain those cannot: the real CLI, invoked
 *         as a driver types it.
 */
describe('driver.route.stance.acceptance', () => {
  const scene = useBeforeAll(async () => {
    const tempDir = genTempDirForRhachet({
      slug: 'stance-usage',
      clone: ASSETS_DIR,
    });
    await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
    await execAsync('git checkout -b vlad/test-stance-usage', { cwd: tempDir });
    return { tempDir };
  });

  given('[case1] --as disputed with no --with', () => {
    when('[t0] the party flag is omitted', () => {
      const result = useThen('the stance is rejected', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1.vision',
            route: '.',
            as: 'disputed',
            about: 'blocker.1',
            why: '.fulcrums/inventory.of=fulcrums.case=F001-x.md',
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint — the caller must name a party)', () => {
        expect(result.code).toEqual(2);
      });

      then('the error names the absent --with, on stderr not stdout', () => {
        expect(result.stderr).toContain('--with is required for --as disputed');
        expect(result.stdout).not.toContain('--with is required');
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot(
          'disputed no --with',
        );
      });
    });
  });

  given('[case2] --as disputed with a party but no --about', () => {
    when('[t0] the concern flag is omitted', () => {
      const result = useThen('the stance is rejected', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1.vision',
            route: '.',
            as: 'disputed',
            with: 'architect',
            why: '.fulcrums/inventory.of=fulcrums.case=F001-x.md',
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint — the caller must name a concern)', () => {
        expect(result.code).toEqual(2);
      });

      then('the error names the absent --about, and shows the shape', () => {
        // a stance keyed to a party alone sheds every concern that party raised
        // (rule.forbid.suppression-of-undeclared-concerns), so --about is required
        expect(result.stderr).toContain('--about is required for --as disputed');
        expect(result.stderr).toContain('--about blocker.1');
        expect(result.stdout).not.toContain('--about is required');
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot(
          'disputed no --about',
        );
      });
    });
  });

  given('[case3] --as disputed with no --why', () => {
    when('[t0] the fulcrum reference is omitted', () => {
      const result = useThen('the stance is rejected', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1.vision',
            route: '.',
            as: 'disputed',
            with: 'architect',
            about: 'blocker.1',
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint — a dispute owes the council its argument)', () => {
        expect(result.code).toEqual(2);
      });

      then('the error names the absent --why', () => {
        // a dispute is a guarantee to the council, so it cites the argument they read
        expect(result.stderr).toContain('--why is required for --as disputed');
        expect(result.stdout).not.toContain('--why is required');
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot(
          'disputed no --why',
        );
      });
    });
  });

  given('[case4] --as conceded with NO --severity', () => {
    when('[t0] a concession omits its harm grade', () => {
      const result = useThen('the stance is rejected', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1.vision',
            route: '.',
            as: 'conceded',
            with: 'architect',
            about: 'blocker.1',
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint — severity is a mandatory invariant)', () => {
        expect(result.code).toEqual(2);
      });

      then('the error names --severity as required for a concede', () => {
        // there is no ungraded concede — every concession is graded by its harm
        expect(result.stderr).toContain('--severity is required for --as conceded');
        expect(result.stdout).not.toContain('--severity is required');
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot(
          'conceded no --severity',
        );
      });
    });
  });

  given('[case5] --as disputed WITH a --severity', () => {
    when('[t0] a dispute grades a harm it has none of', () => {
      const result = useThen('the stance is rejected', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1.vision',
            route: '.',
            as: 'disputed',
            with: 'architect',
            about: 'blocker.1',
            why: '.fulcrums/inventory.of=fulcrums.case=F001-x.md',
            severity: 'urgent',
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint — severity grades a CONCESSION)', () => {
        expect(result.code).toEqual(2);
      });

      then('the error names --severity as forbidden for a dispute (F028/S14)', () => {
        expect(result.stderr).toContain(
          '--severity is not accepted for --as disputed',
        );
        expect(result.stdout).not.toContain('--severity is not accepted');
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot(
          'disputed with --severity',
        );
      });
    });
  });

  given('[case6] --as conceded with a malformed --about', () => {
    when('[t0] the concern does not name <severity>.<ordinal>', () => {
      const result = useThen('the stance is rejected', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1.vision',
            route: '.',
            as: 'conceded',
            with: 'architect',
            about: 'bogus',
            severity: 'better',
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint — the concern address is malformed)', () => {
        expect(result.code).toEqual(2);
      });

      then('the error names the expected shape and the bad value', () => {
        expect(result.stderr).toContain('invalid --about: "bogus"');
        expect(result.stderr).toContain('blocker or nitpick');
        expect(result.stdout).not.toContain('invalid --about');
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot(
          'conceded malformed --about',
        );
      });
    });
  });

  given('[case7] --as conceded with an out-of-set --severity value', () => {
    when('[t0] the grade is neither better nor urgent', () => {
      const result = useThen('the stance is rejected', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1.vision',
            route: '.',
            as: 'conceded',
            with: 'architect',
            about: 'blocker.1',
            severity: 'urgentt',
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint — the grade is a closed set of two)', () => {
        expect(result.code).toEqual(2);
      });

      then('the error names the bad value and the valid set, on stderr not stdout', () => {
        // --severity is a closed set — better | urgent (F028/S14). a typo must fail
        // loud at the boundary, never flow through as-cast to be read as harm.
        expect(result.stderr).toContain('invalid --severity: "urgentt"');
        expect(result.stderr).toContain('better, urgent');
        expect(result.stdout).not.toContain('invalid --severity');
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot(
          'conceded bad --severity value',
        );
      });
    });
  });
});
