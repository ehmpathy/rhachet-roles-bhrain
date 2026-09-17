import * as fs from 'fs/promises';
import { getError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { assertFulcrumPathExists } from './assertFulcrumPathExists';

/**
 * .what = integration test for the --why fulcrum existence check
 * .why = it reads the filesystem, so it is an integration test by grain
 *        (rule.forbid.unit.remote-boundaries)
 *
 * 🔴 the defect it clamps (r10 blocker.4) — the refusal named only the raw path the
 *    driver typed, and never that a relative --why is read against the ROUTE dir.
 *    a driver at the repo root reads "no fulcrum entry at X", sees X on disk, and
 *    loops on the same error with no way to learn why.
 *
 * 🟡 case3 clamps the RELAXATION — a repo-root-relative --why once refused outright
 *    (the exact driver slip r10 b4 diagnosed) and now resolves, since the check tries
 *    both bases before it refuses.
 */
const genScene = async (): Promise<{
  repoRoot: string;
  route: string;
}> => {
  const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'fulcrum-repo-'));
  const route = '.behavior/v2026_01_01.demo';
  await fs.mkdir(path.join(repoRoot, route, '.fulcrums'), { recursive: true });
  await fs.writeFile(
    path.join(
      repoRoot,
      route,
      '.fulcrums',
      'inventory.of=fulcrums.case=F001-the-demo.md',
    ),
    '# F001\n',
  );
  return { repoRoot, route };
};

/**
 * .what = runs the assert and hands back the refusal it threw
 * .why = the assert is sync, so the error is read inline — one flat call per then
 */
const asRefusal = (input: {
  why: string;
  route: string;
  repoRoot: string;
}): Error => getError(() => assertFulcrumPathExists(input)) as Error;

const WHY_ABSENT = '.fulcrums/inventory.of=fulcrums.case=F404-absent.md';
const WHY_PRESENT = '.fulcrums/inventory.of=fulcrums.case=F001-the-demo.md';

describe('assertFulcrumPathExists', () => {
  given('[case1] a route-relative --why that names a real entry', () => {
    const scene = useBeforeAll(async () => genScene());

    when('[t0] asserted', () => {
      then('it passes — the path is read against the route dir', () => {
        expect(() =>
          assertFulcrumPathExists({
            why: WHY_PRESENT,
            route: scene.route,
            repoRoot: scene.repoRoot,
          }),
        ).not.toThrow();
      });
    });
  });

  given('[case2] a --why that names no entry', () => {
    const scene = useBeforeAll(async () => genScene());

    when('[t0] asserted', () => {
      then('it throws, and names the path the driver typed', () => {
        const error = asRefusal({
          why: WHY_ABSENT,
          route: scene.route,
          repoRoot: scene.repoRoot,
        });
        expect(error.message).toContain(`no fulcrum entry at "${WHY_ABSENT}"`);
      });

      then('it states that a relative --why is checked two ways', () => {
        const error = asRefusal({
          why: WHY_ABSENT,
          route: scene.route,
          repoRoot: scene.repoRoot,
        });
        expect(error.message).toContain('checked two ways');
        expect(error.message).toContain('route-relative');
        expect(error.message).toContain('repo-root-relative');
      });

      then('it names both absolute paths it looked at', () => {
        const error = asRefusal({
          why: WHY_ABSENT,
          route: scene.route,
          repoRoot: scene.repoRoot,
        });
        expect(error.message).toContain(
          path.join(scene.repoRoot, scene.route, WHY_ABSENT),
        );
        expect(error.message).toContain(path.join(scene.repoRoot, WHY_ABSENT));
      });

      then('it names where to write the entry, route-prefixed', () => {
        const error = asRefusal({
          why: WHY_ABSENT,
          route: scene.route,
          repoRoot: scene.repoRoot,
        });
        expect(error.message).toContain(
          `${scene.route}/.fulcrums/inventory.of=fulcrums.case=F00N-<slug>.md`,
        );
      });

      // r009 blocker.1 — the fragments above are asserted with `toContain` alone, so a
      // reword that keeps the fragments but wrecks the shape passes. repoRoot is a fresh
      // mkdtemp path per run, so it is normalized to a stable placeholder before the pin
      then('the bytes a driver reads are pinned', () => {
        const error = asRefusal({
          why: WHY_ABSENT,
          route: scene.route,
          repoRoot: scene.repoRoot,
        });
        expect(
          error.message.split(scene.repoRoot).join('<repoRoot>'),
        ).toMatchSnapshot();
      });
    });
  });

  given(
    '[case3] a REPO-ROOT-relative --why — the exact driver slip (r10 b4)',
    () => {
      const scene = useBeforeAll(async () => genScene());

      when('[t0] the driver passes the path as seen from the repo root', () => {
        then(
          'it passes — the route-relative check misses, so the repo-root fallback catches it',
          () => {
            expect(() =>
              assertFulcrumPathExists({
                why: `${scene.route}/${WHY_PRESENT}`,
                route: scene.route,
                repoRoot: scene.repoRoot,
              }),
            ).not.toThrow();
          },
        );
      });
    },
  );
});
