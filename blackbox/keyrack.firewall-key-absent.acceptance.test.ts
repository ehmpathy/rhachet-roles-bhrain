import { spawnSync } from 'child_process';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

const REPO_ROOT = path.join(__dirname, '..');
const RHACHET_BIN = path.join(REPO_ROOT, 'node_modules/.bin/rhachet');

/**
 * .what = one row of the firewall's json report
 * .why = an absent row carries `slug` + `fix`; a granted row nests its slug under `grant`
 *        and carries the secret, so a granted row is never printed
 */
type FirewallRow = {
  status: string;
  slug?: string;
  fix?: string;
  grant?: { slug?: string };
};

/**
 * .what = runs the CI credential step — `keyrack firewall --env test` — with no secrets supplied
 * .why = the workflow pipes the actions secrets into this command; `{}` is the state of a repo
 *        whose actions secrets lack every key. the child env holds only PATH and an empty HOME,
 *        as a CI runner does, so no host env var or host keyrack can supply a key
 */
const invokeFirewallWithNoSecrets = (input: {
  home: string;
}): { stdout: string; code: number | null } => {
  const result = spawnSync(
    RHACHET_BIN,
    [
      'keyrack',
      'firewall',
      '--env',
      'test',
      '--from',
      'json(stdin://*)',
      '--into',
      'json',
    ],
    {
      cwd: REPO_ROOT,
      input: '{}',
      encoding: 'utf-8',
      env: { PATH: process.env.PATH, HOME: input.home },
    },
  );
  return { stdout: result.stdout, code: result.status };
};

/**
 * .what = the firewall's report row for OPENROUTER_API_KEY
 * .why = fails loud where the row is absent. the error lists only status + slug per row,
 *        never a grant, so a failure cannot leak a secret into a log
 */
const asOpenrouterRow = (input: { stdout: string }): FirewallRow => {
  const rows: FirewallRow[] = JSON.parse(input.stdout);
  const row = rows.find((thisRow) =>
    (thisRow.slug ?? thisRow.grant?.slug ?? '').endsWith(
      '.test.OPENROUTER_API_KEY',
    ),
  );
  if (row) return row;

  // name each row by status + slug alone, so the error carries no secret
  const summary = rows
    .map((thisRow) => `${thisRow.status} ${thisRow.slug ?? thisRow.grant?.slug}`)
    .join('\n');
  throw new Error(
    `no OPENROUTER_API_KEY row in firewall report:\n${summary}\nhint: .agent/keyrack.yml must declare OPENROUTER_API_KEY under env.test — check the manifest and its extends`,
  );
};

/**
 * .what = acceptance clamp on the CI credential step when the openrouter secret is absent
 * .why = vision case 4 (`key-absent-in-ci`, a critipath): a maintainer pushes before anyone
 *        added the actions secret. the credential step must name OPENROUTER_API_KEY as absent,
 *        so the failure teaches the grant rather than hide behind opaque suite errors
 */
describe('keyrack.firewall-key-absent.acceptance', () => {
  const scene = useBeforeAll(async () => ({
    home: genTempDir({ slug: 'keyrack-firewall-home-empty' }),
  }));

  given('[case1] this repo keyrack manifest, and actions secrets that lack every key', () => {
    when('[t0] the CI credential step runs', () => {
      const result = useThen('the firewall reports', async () =>
        invokeFirewallWithNoSecrets({ home: scene.home }),
      );

      then('CLAMP: the report names OPENROUTER_API_KEY as absent', () => {
        const row = asOpenrouterRow({ stdout: result.stdout });
        expect(row.status).toEqual('absent');
      });

      then('CLAMP: the report names the command that sets the key', () => {
        const row = asOpenrouterRow({ stdout: result.stdout });
        expect(row.fix).toEqual(
          'rhx keyrack set --key OPENROUTER_API_KEY --env test',
        );
      });

      then('the firewall exits 0 on an absent key — upstream rhachet behavior', () => {
        // .why = pins the measured fact case 4 depends on: the step does NOT halt, so each
        //        suite then fails on its own with the case 3 refusal. when rhachet's firewall
        //        halts on a declared-but-absent key (dream: firewall-halts-on-absent-key),
        //        this goes red — flip it to 2, and case 4 gains its single early failure
        expect(result.code).toEqual(0);
      });

      then('the openrouter row is pinned', () => {
        // .why = only status, slug, and fix are pinned — a granted row would carry its secret
        const row = asOpenrouterRow({ stdout: result.stdout });
        expect({
          status: row.status,
          slug: row.slug,
          fix: row.fix,
        }).toMatchSnapshot();
      });
    });
  });
});
