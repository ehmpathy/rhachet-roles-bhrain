import { spawnSync } from 'child_process';
import { ConstraintError } from 'helpful-errors';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

const REPO_ROOT = path.join(__dirname, '..');
const RHACHET_BIN = path.join(REPO_ROOT, 'node_modules/.bin/rhachet');

/**
 * .what = one row of the firewall's json report
 * .why = an absent row carries `slug` + `fix`; a granted row nests its slug under `grant`
 *        and carries the secret, so a granted row is masked before it is printed or snapped
 */
type FirewallRow = {
  status: string;
  slug?: string;
  fix?: string;
  grant?: { slug?: string };
};

/**
 * .what = runs the CI credential step — `keyrack firewall --env test` — with the given secrets
 * .why = the workflow pipes the actions secrets into this command as json on stdin; `{}` is the
 *        state of a repo whose actions secrets lack every key. the child env holds only PATH and
 *        an empty HOME, as a CI runner does, so no host env var or host keyrack can supply a key
 *        beyond what the json carries
 */
const invokeFirewall = (input: {
  home: string;
  secrets: Record<string, string>;
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
      input: JSON.stringify(input.secrets),
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
  // .why ConstraintError = the row is absent because the repo's keyrack manifest does not declare
  //      the key — the caller fixes the manifest, never the firewall
  const rowsSeen = rows.map(
    (thisRow) => `${thisRow.status} ${thisRow.slug ?? thisRow.grant?.slug}`,
  );
  throw new ConstraintError('no OPENROUTER_API_KEY row in firewall report', {
    rowsSeen,
    hint: '.agent/keyrack.yml must declare OPENROUTER_API_KEY under env.test — check the manifest and its extends',
  });
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
        invokeFirewall({ home: scene.home, secrets: {} }),
      );

      then('CLAMP: the report names OPENROUTER_API_KEY as absent', () => {
        const row = asOpenrouterRow({ stdout: result.stdout });
        expect(row.status).toEqual('absent');
      });

      then('CLAMP: the report names the command that sets the key', () => {
        const row = asOpenrouterRow({ stdout: result.stdout });
        // the fix hint is rendered by rhachet's keyrack, which names `--vault <vault>` as of the
        // rhachet 1.49.2 → 1.50.1 bump (package.json); the vault is a required choice to set a key
        expect(row.fix).toEqual(
          'rhx keyrack set --key OPENROUTER_API_KEY --env test --vault <vault>',
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
        // .why = status, slug, and fix are the absent row's whole contract (case2 snaps the
        //        granted row, its secret masked)
        const row = asOpenrouterRow({ stdout: result.stdout });
        expect({
          status: row.status,
          slug: row.slug,
          fix: row.fix,
        }).toMatchSnapshot();
      });
    });
  });

  given('[case2] this repo keyrack manifest, and actions secrets that carry the real key', () => {
    // .why = the positive twin of case1 (rule.require.external-contract-integration-tests): the
    //        real OPENROUTER_API_KEY, as the test run's keyrack unlock supplies it, goes through
    //        the same CI step. an absent key fails loud, never skips.
    // .note = the firewall grants on presence; it never calls openrouter, so this case proves
    //        the keyrack contract (key present → granted row), not that the key is live. the live
    //        provider call is proven by the brain-backed review acceptance suites, which send
    //        this same granted key to openrouter and parse its reply
    const secrets = useBeforeAll(async () => {
      const key = process.env.OPENROUTER_API_KEY;
      if (!key)
        throw new ConstraintError('OPENROUTER_API_KEY is required for this case', {
          hint: 'run: rhx keyrack unlock --owner ehmpath --env test',
        });
      return { OPENROUTER_API_KEY: key };
    });

    when('[t0] the CI credential step runs', () => {
      const result = useThen('the firewall reports', async () =>
        invokeFirewall({
          home: scene.home,
          secrets: { OPENROUTER_API_KEY: secrets.OPENROUTER_API_KEY },
        }),
      );

      then('CLAMP: the report grants OPENROUTER_API_KEY', () => {
        const row = asOpenrouterRow({ stdout: result.stdout });
        expect(row.status).toEqual('granted');
        expect(row.grant?.slug).toEqual('ehmpathy.test.OPENROUTER_API_KEY');
      });

      then('the firewall exits 0', () => {
        expect(result.code).toEqual(0);
      });

      then('the granted row is pinned, its secret masked', () => {
        // .why = the granted variant is snapped whole, never carved out
        //        (rule.require.contract-snapshot-exhaustiveness): the secret's bytes are replaced
        //        with `<secret>` before the parse, wherever the row carries them
        const stdoutParts = result.stdout.split(secrets.OPENROUTER_API_KEY);
        // the raw row carries the secret exactly once — the mask replaced a real value, in one place
        expect(stdoutParts.length - 1).toEqual(1);
        const stdoutMasked = stdoutParts.join('<secret>');
        const row = asOpenrouterRow({ stdout: stdoutMasked });
        expect(row).toMatchSnapshot();
      });
    });
  });
});
