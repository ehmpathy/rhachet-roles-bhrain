import * as fs from 'node:fs';
import * as path from 'node:path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { genTempDirForRhachet } from './.test/genTempDirForRhachet';
import { asChildEnv, invokeShellCommand } from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-driver');

/**
 * .what = runs one rhx command in the fixture, with HOME pointed at the fixture's own home
 * .why = rhachet's grove settings layer links to $HOME/.claude/settings.json; a temp home keeps
 *        the host's settings out of reach, both as input and as a write target
 */
const runRhx = async (input: { cmd: string; cwd: string; home: string }) =>
  invokeShellCommand({
    cmd: input.cmd,
    cwd: input.cwd,
    // CLAUDE_CONFIG_DIR is unset: an operator's own session would otherwise add a reach note
    env: asChildEnv({
      overrides: { HOME: input.home, CLAUDE_CONFIG_DIR: undefined },
    }),
  });

/**
 * .what = the init's framed output, with the bytes that vary per run tokenized
 * .why = the snapshot pins what a human sees through `rhx init`. four bytes vary per run and
 *        no others: the temp repo, the temp home, the host path to this package's dist, and
 *        each backup's timestamp + pid
 */
const asFramedInitBlock = (input: {
  result: { stdout: string; stderr: string };
  scene: { tempDir: string; home: string };
}): string =>
  `${input.result.stdout}${input.result.stderr}`
    .split(fs.realpathSync(input.scene.tempDir))
    .join('$REPO')
    .split(input.scene.tempDir)
    .join('$REPO')
    .split(fs.realpathSync(input.scene.home))
    .join('$HOME')
    .split(input.scene.home)
    .join('$HOME')
    .replace(/(?:\.\.\/)+\S*?\/dist\//g, '$PACKAGE/dist/')
    .replace(/\d{4}-\d\d-\d\dT\d\d-\d\d-\d\dZ\.\d+/g, '$STAMP')
    .replace(/\d+ (brief|skill|init)\(s\)/g, '$N $1(s)');

/**
 * .what = reads the brain dir's settings files as rhachet left them
 * .why = the clamp asserts on the layout itself: which name is a link, which file holds the bind
 */
const getBrainDirSettings = (input: { tempDir: string }) => {
  const claudeDir = path.join(input.tempDir, '.claude');
  const repoLayer = path.join(claudeDir, 'settings.of.repo.json');
  return {
    isSettingsLink: fs.lstatSync(path.join(claudeDir, 'settings.json')).isSymbolicLink(),
    repoLayer: JSON.parse(fs.readFileSync(repoLayer, 'utf8')) as {
      statusLine?: { type: string; command: string };
    },
  };
};

/**
 * .what = acceptance clamp: the driver's status line survives the layout rhachet enforces
 * .why = the wish's defect: the init wrote `.claude/settings.json`, a name rhachet ≥1.49 reserves
 *        for a link; the next enroll restored the link and the status line vanished, silently.
 *        this drives the REAL cli twice — init, then init again — and asserts the bind holds in
 *        the one real file, `settings.of.repo.json`, while `settings.json` stays a link
 */
describe('driver.init.status-line-survives-enroll.acceptance', () => {
  const scene = useBeforeAll(async () => {
    const tempDir = genTempDirForRhachet({
      slug: 'driver-init-status-line-survives-enroll',
      clone: ASSETS_DIR,
    });
    const home = path.join(tempDir, '.home');
    // the grove layer: rhachet links `settings.json` to it only where the human's file exists
    fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
    fs.writeFileSync(path.join(home, '.claude', 'settings.json'), '{}');
    return { tempDir, home };
  });

  given('[case1] a repo whose repo actor is enrolled with driver', () => {
    when('[t0] rhx init --roles driver --hooks runs', () => {
      const result = useThen('init runs', async () =>
        runRhx({
          cmd: 'npx rhx init --roles driver --hooks',
          cwd: scene.tempDir,
          home: scene.home,
        }),
      );

      then('it exits 0', () => {
        expect(result.code).toEqual(0);
      });

      then('the init reports the bind', () => {
        expect(`${result.stdout}${result.stderr}`).toContain('status = configured');
      });

      then('the framed init block matches the snapshot', () => {
        expect(asFramedInitBlock({ result, scene })).toMatchSnapshot(
          'rhx init --roles driver --hooks - status line bound',
        );
      });

      then('settings.json is a link, per the split layout', () => {
        expect(getBrainDirSettings(scene).isSettingsLink).toEqual(true);
      });

      then('settings.of.repo.json holds the route status line', () => {
        expect(
          getBrainDirSettings(scene).repoLayer.statusLine?.command,
        ).toContain('route.status.line.sh');
      });
    });

    when('[t1] the actor is enrolled again — rhx init --hooks re-runs the layout', () => {
      const result = useThen('re-init runs', async () =>
        runRhx({
          cmd: 'npx rhx init --hooks',
          cwd: scene.tempDir,
          home: scene.home,
        }),
      );

      then('it exits 0', () => {
        expect(result.code).toEqual(0);
      });

      then('the framed re-init block matches the snapshot', () => {
        expect(asFramedInitBlock({ result, scene })).toMatchSnapshot(
          'rhx init --hooks - layout re-run, hooks need no change',
        );
      });

      then('settings.json is still a link', () => {
        expect(getBrainDirSettings(scene).isSettingsLink).toEqual(true);
      });

      then('the status line survives in settings.of.repo.json', () => {
        expect(
          getBrainDirSettings(scene).repoLayer.statusLine?.command,
        ).toContain('route.status.line.sh');
      });
    });
  });

  given('[case2] a repo whose human already set a status line in the grove', () => {
    const sceneForeign = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'driver-init-status-line-foreign-grove',
        clone: ASSETS_DIR,
      });
      const home = path.join(tempDir, '.home');
      fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
      fs.writeFileSync(
        path.join(home, '.claude', 'settings.json'),
        JSON.stringify({
          statusLine: { type: 'command', command: 'my-own-line' },
        }),
      );
      return { tempDir, home };
    });

    when('[t0] rhx init --roles driver runs', () => {
      const result = useThen('init runs', async () =>
        runRhx({
          cmd: 'npx rhx init --roles driver',
          cwd: sceneForeign.tempDir,
          home: sceneForeign.home,
        }),
      );

      then('it exits 0, so rhx init and rhx upgrade carry on', () => {
        expect(result.code).toEqual(0);
      });

      then('the init skips, and names the human line it left intact', () => {
        const framed = asFramedInitBlock({ result, scene: sceneForeign });
        expect(framed).toContain('status = skipped');
        expect(framed).toContain('yours = my-own-line');
      });

      then('the framed init block matches the snapshot', () => {
        expect(
          asFramedInitBlock({ result, scene: sceneForeign }),
        ).toMatchSnapshot('rhx init --roles driver - human grove line kept');
      });

      then('the repo layer holds no status line of ours', () => {
        expect(
          getBrainDirSettings(sceneForeign).repoLayer.statusLine,
        ).toBeUndefined();
      });
    });
  });
});
