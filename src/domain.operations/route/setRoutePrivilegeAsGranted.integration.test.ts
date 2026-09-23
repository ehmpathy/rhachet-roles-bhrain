import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { setRoutePrivilegeAsGranted } from './setRoutePrivilegeAsGranted';

const FLAG_PATH = path.join('.route', '.privilege.mutate.flag');

/**
 * .what = drives BOTH verdicts of the route-mutate privilege grant, against the real filesystem
 * .why = the granted wire — `isTTY === true ⇒ the flag is written` — was provable by no test at
 *        all while the actor was read off `process.stdin.isTTY` inline at the cli. every acceptance
 *        spawn is a pipe, so every spawn is REFUSED by construction, and the suite's positive case
 *        had to write the flag itself with `fs.writeFile` — which proves the test's own arm, never
 *        the product's (raised i002/r002 by `ergo-contract-snapshots`, against
 *        `rule.require.contract-snapshot-exhaustiveness`).
 *
 * 🔴 .it is an INTEGRATION test, and the classification is forced rather than chosen.
 *    the operation writes to disk, and a filesystem is a remote boundary — so a `.test.ts` that
 *    drives it would be a unit test that crosses one (`rule.forbid.unit.remote-boundaries`). the
 *    flag write IS the behavior under proof here, so it cannot be injected away.
 */
describe('setRoutePrivilegeAsGranted.integration', () => {
  given('[case1] a human caller — isTTY true', () => {
    const scene = useBeforeAll(async () => {
      const route = genTempDir({ slug: 'privilege-granted-case1' });
      const result = await setRoutePrivilegeAsGranted(
        { route },
        { isTTY: true },
      );
      return { route, result };
    });

    when('[t0] the grant is invoked', () => {
      then('it reports granted', () => {
        expect(scene.result.granted).toBe(true);
      });

      then(
        'the flag file is WRITTEN — the wire no spawn can drive',
        async () => {
          const flag = await fs.readFile(
            path.join(scene.route, FLAG_PATH),
            'utf-8',
          );
          expect(flag).toEqual('');
        },
      );

      then('the granted render names the route and the flag', () => {
        const rendered = scene.result.emit.lines.join('\n');
        expect(rendered).toContain('🦉 privilege granted');
        expect(rendered).toContain(`route = ${scene.route}`);
        expect(rendered).toContain('.route/.privilege.mutate.flag created');
        expect(rendered).toContain('route mutation now allowed until revoked');
      });

      then('the granted render matches snapshot', () => {
        // the route path is a temp dir, so it varies per run — pin the shape with the one
        // variable row masked, never the bytes of a path no two runs share
        expect(
          scene.result.emit.lines.map((line) =>
            line.includes('route = ') ? '   ├─ route = <temp>' : line,
          ),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case2] a non-human caller — isTTY false', () => {
    const scene = useBeforeAll(async () => {
      const route = genTempDir({ slug: 'privilege-granted-case2' });
      const result = await setRoutePrivilegeAsGranted(
        { route },
        { isTTY: false },
      );
      return { route, result };
    });

    when('[t0] the grant is invoked', () => {
      then('it reports refused', () => {
        expect(scene.result.granted).toBe(false);
      });

      then('NO flag file is written — the bound holds', async () => {
        const found = await fs
          .access(path.join(scene.route, FLAG_PATH))
          .then(() => true)
          .catch(() => false);
        expect(found).toBe(false);
      });

      then('the refusal names the blast radius and the remedy', () => {
        const rendered = scene.result.emit.lines.join('\n');
        expect(rendered).toContain('🦉 privilege refused');
        expect(rendered).toContain('this grant is human only');
        expect(rendered).toContain(
          'lifts every protected write on the route at once',
        );
        expect(rendered).toContain('ask a human to run it from a terminal');
      });
    });
  });

  given('[case3] a human grants twice — the write is idempotent', () => {
    const scene = useBeforeAll(async () => {
      const route = genTempDir({ slug: 'privilege-granted-case3' });
      const first = await setRoutePrivilegeAsGranted(
        { route },
        { isTTY: true },
      );
      const second = await setRoutePrivilegeAsGranted(
        { route },
        { isTTY: true },
      );
      return { route, first, second };
    });

    when('[t0] the grant is re-run against an extant flag', () => {
      then('it reports granted, as the first run did', () => {
        expect(scene.first.granted).toBe(true);
        expect(scene.second.granted).toBe(true);
      });

      then('the render is unchanged — a re-run converges', () => {
        expect(scene.second.emit.lines).toEqual(scene.first.emit.lines);
      });

      then('the flag is still an empty file, never appended to', async () => {
        const flag = await fs.readFile(
          path.join(scene.route, FLAG_PATH),
          'utf-8',
        );
        expect(flag).toEqual('');
      });
    });
  });
});
