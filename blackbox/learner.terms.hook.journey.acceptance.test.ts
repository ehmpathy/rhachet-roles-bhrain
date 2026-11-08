import * as fs from 'node:fs';
import * as path from 'node:path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { genTempDirForRhachet } from './.test/genTempDirForRhachet';
import { asChildEnv, invokeShellCommand } from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-driver');
const AUTHOR = 'toggle=learn.terms.hook/role=learner';

/**
 * .what = runs one shell command in the fixture, with HOME pointed at the fixture's own home
 * .why = rhachet's grove settings layer links to $HOME/.claude/settings.json; a temp home keeps
 *        the host's settings out of reach, both as input and as a write target
 */
const runRhx = async (input: { cmd: string; cwd: string; home: string }) =>
  invokeShellCommand({
    cmd: input.cmd,
    cwd: input.cwd,
    env: asChildEnv({
      overrides: { HOME: input.home, CLAUDE_CONFIG_DIR: undefined },
    }),
  });

const ANSI_COLOR = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

/**
 * .what = one stream of a command's output, with the bytes that vary per run tokenized
 * .why = the snapshot pins what a human sees. the color codes rhachet wraps a refusal in are
 *        stripped, so the frame reads as the terminal renders it; the temp repo, the temp home,
 *        the host path to this package's dist, each backup's stamp, and rhachet's link counts
 *        vary per run, and no other byte does
 */
const asFramedOutput = (input: {
  text: string;
  scene: { tempDir: string; home: string };
}): string =>
  input.text
    .replace(ANSI_COLOR, '')
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
 * .what = a fresh temp repo rhachet laid out, with its own temp home
 * .why = each given owns its repo, so a refusal scene never inherits the journey's file
 */
const genScene = (input: { slug: string }) => {
  const tempDir = genTempDirForRhachet({ slug: input.slug, clone: ASSETS_DIR });
  const home = path.join(tempDir, '.home');
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'settings.json'), '{}');
  return { tempDir, home };
};

/**
 * .what = the repo layer path a session reads on the split layout
 * .why = every scene asserts on, or tampers with, this one file
 */
const asRepoLayerPath = (input: { tempDir: string }): string =>
  path.join(input.tempDir, '.claude', 'settings.of.repo.json');

/**
 * .what = the Stop entries the toggle authored, as the repo layer holds them
 * .why = the clamp asserts on the file a session reads, not only on what the cli says
 */
const getTermsHookEntries = (input: { tempDir: string }) => {
  const settings = JSON.parse(fs.readFileSync(asRepoLayerPath(input), 'utf8')) as {
    hooks?: Record<string, { hooks?: { author?: string; command?: string }[] }[]>;
  };
  return (settings.hooks?.Stop ?? [])
    .flatMap((block) => block.hooks ?? [])
    .filter((hook) => hook.author === AUTHOR);
};

/**
 * .what = every Stop command in the repo layer that runs the term hook, under any author
 * .why = "no term hook" is a claim about every author: a toggle-author filter alone would pass
 *        a restored role `onStop`, or a hand copy, as off
 */
const getTermsHookCommandsAnyAuthor = (input: { tempDir: string }): string[] => {
  const settings = JSON.parse(fs.readFileSync(asRepoLayerPath(input), 'utf8')) as {
    hooks?: Record<string, { hooks?: { command?: string }[] }[]>;
  };
  return (settings.hooks?.Stop ?? [])
    .flatMap((block) => block.hooks ?? [])
    .map((hook) => hook.command ?? '')
    .filter((command) => command.includes('learn.domain.terms'));
};

/**
 * .what = acceptance journey: the learner's term hook toggle, through the published cli
 * .why = the wish: `rhx learn.terms.hook get | enable | disable`, default off, each verb
 *        idempotent. this drives the real `npx rhx` in a repo rhachet laid out, so skill
 *        discovery, the cli subpath, and the write to the committed settings file are all real
 * .note = the layout flip under the hold (case=11) is clamped only at the integration grain:
 *         it needs an outside actor to hold rhachet's own lock while the split file appears,
 *         a race the published cli gives no seam to stage. every other refusal runs here too
 * .note = every scene runs on the split layout `rhx init` lays out; the old layout (a real
 *         `.claude/settings.json`) is clamped at integration through the same cli (F24)
 */
describe('learner.terms.hook.journey.acceptance', () => {
  given('[case1] a repo that links the learner', () => {
    const scene = useBeforeAll(async () =>
      genScene({ slug: 'learner-terms-hook-journey' }),
    );

    when('[t0] rhx init --roles learner --hooks runs', () => {
      const result = useThen('init runs', async () =>
        runRhx({
          cmd: 'npx rhx init --roles learner --hooks',
          cwd: scene.tempDir,
          home: scene.home,
        }),
      );

      then('it exits 0', () => {
        expect(result.code).toEqual(0);
      });

      then('the repo layer holds no term hook under any author: the default is off', () => {
        expect(getTermsHookCommandsAnyAuthor(scene)).toEqual([]);
      });

      then('the framed init block matches the snapshot', () => {
        expect(
          asFramedOutput({ text: `${result.stdout}${result.stderr}`, scene }),
        ).toMatchSnapshot('rhx init --roles learner --hooks - no term hook');
      });
    });

    when('[t1] get runs before any enable', () => {
      const result = useThen('get runs', async () =>
        runRhx({
          cmd: 'npx rhx learn.terms.hook get',
          cwd: scene.tempDir,
          home: scene.home,
        }),
      );

      then('it exits 0 and reports disabled', () => {
        expect(result.code).toEqual(0);
        expect(result.stdout).toContain('status = disabled');
      });

      then('the output matches the snapshot', () => {
        expect(
          asFramedOutput({ text: `${result.stdout}${result.stderr}`, scene }),
        ).toMatchSnapshot('get - disabled');
      });
    });

    when('[t2] enable runs', () => {
      const result = useThen('enable runs', async () =>
        runRhx({
          cmd: 'npx rhx learn.terms.hook enable',
          cwd: scene.tempDir,
          home: scene.home,
        }),
      );

      then('it exits 0 and reports added', () => {
        expect(result.code).toEqual(0);
        expect(result.stdout).toContain('status = enabled (added)');
      });

      then('the repo layer holds exactly one term hook entry', () => {
        const entries = getTermsHookEntries(scene);
        expect(entries).toHaveLength(1);
        expect(entries[0]?.command).toContain('learn.domain.terms --when hook.onStop');
      });

      then('the output matches the snapshot', () => {
        expect(
          asFramedOutput({ text: `${result.stdout}${result.stderr}`, scene }),
        ).toMatchSnapshot('enable - added');
      });
    });

    when('[t3] enable runs again', () => {
      const result = useThen('enable runs again', async () =>
        runRhx({
          cmd: 'npx rhx learn.terms.hook enable',
          cwd: scene.tempDir,
          home: scene.home,
        }),
      );

      then('it exits 0, reports already enabled, and writes no second copy', () => {
        expect(result.code).toEqual(0);
        expect(result.stdout).toContain('status = already enabled');
        expect(getTermsHookEntries(scene)).toHaveLength(1);
      });

      then('the output matches the snapshot', () => {
        expect(
          asFramedOutput({ text: `${result.stdout}${result.stderr}`, scene }),
        ).toMatchSnapshot('enable - already enabled');
      });
    });

    when('[t4] rhx init --hooks re-syncs the roles', () => {
      const out = useThen('re-init runs, then get', async () => {
        const resync = await runRhx({
          cmd: 'npx rhx init --hooks',
          cwd: scene.tempDir,
          home: scene.home,
        });
        const entries = getTermsHookEntries(scene);
        const get = await runRhx({
          cmd: 'npx rhx learn.terms.hook get',
          cwd: scene.tempDir,
          home: scene.home,
        });
        return { resync, entries, get };
      });

      then('it exits 0 and the entry survives the re-sync', () => {
        expect(out.resync.code).toEqual(0);
        expect(out.entries).toHaveLength(1);
      });

      then('get still reports enabled', () => {
        expect(out.get.code).toEqual(0);
        expect(out.get.stdout).toContain('status = enabled');
      });

      then('the framed re-init block matches the snapshot', () => {
        expect(
          asFramedOutput({
            text: `${out.resync.stdout}${out.resync.stderr}`,
            scene,
          }),
        ).toMatchSnapshot('rhx init --hooks - re-sync, hooks need no change');
      });

      then('the get output matches the snapshot', () => {
        expect(
          asFramedOutput({ text: `${out.get.stdout}${out.get.stderr}`, scene }),
        ).toMatchSnapshot('get - enabled');
      });
    });

    when('[t5] disable runs', () => {
      const result = useThen('disable runs', async () =>
        runRhx({
          cmd: 'npx rhx learn.terms.hook disable',
          cwd: scene.tempDir,
          home: scene.home,
        }),
      );

      then('it exits 0, reports removed, and the entry is gone', () => {
        expect(result.code).toEqual(0);
        expect(result.stdout).toContain('status = disabled (removed)');
        expect(getTermsHookEntries(scene)).toEqual([]);
      });

      then('the output matches the snapshot', () => {
        expect(
          asFramedOutput({ text: `${result.stdout}${result.stderr}`, scene }),
        ).toMatchSnapshot('disable - removed');
      });
    });

    when('[t6] disable runs again', () => {
      const result = useThen('disable runs again', async () =>
        runRhx({
          cmd: 'npx rhx learn.terms.hook disable',
          cwd: scene.tempDir,
          home: scene.home,
        }),
      );

      then('it exits 0 and reports already disabled', () => {
        expect(result.code).toEqual(0);
        expect(result.stdout).toContain('status = already disabled');
      });

      then('the output matches the snapshot', () => {
        expect(
          asFramedOutput({ text: `${result.stdout}${result.stderr}`, scene }),
        ).toMatchSnapshot('disable - already disabled');
      });
    });

    when('[t7] an unknown verb runs', () => {
      const result = useThen('a bad verb runs', async () =>
        runRhx({
          cmd: 'npx rhx learn.terms.hook toggle',
          cwd: scene.tempDir,
          home: scene.home,
        }),
      );

      then('it exits 2 and names the three verbs', () => {
        // each verb is matched as its own row of the tree, so a word that merely holds
        //   the verb (`target`, `disabled`) cannot pass for it
        expect(result.code).toEqual(2);
        expect(result.stderr).toContain('unknown verb `toggle`');
        expect(result.stderr).toMatch(/─ get\s+report/);
        expect(result.stderr).toMatch(/─ enable\s+add/);
        expect(result.stderr).toMatch(/─ disable\s+remove/);
      });

      then('the stderr matches the snapshot, its banner shown once', () => {
        // stdout holds only rhachet's run banner, which stderr repeats above the refusal
        expect(asFramedOutput({ text: result.stderr, scene })).toMatchSnapshot(
          'unknown verb',
        );
      });
    });

    when('[t8] --help runs', () => {
      const result = useThen('help runs', async () =>
        runRhx({
          cmd: 'npx rhx learn.terms.hook --help',
          cwd: scene.tempDir,
          home: scene.home,
        }),
      );

      then('it exits 0 and states what it does, the usage, the verbs, an example, and the default', () => {
        expect(result.code).toEqual(0);
        expect(result.stdout).toContain('what = turn the learner');
        expect(result.stdout).toContain('usage = rhx learn.terms.hook <verb>');
        expect(result.stdout).toMatch(/─ rhx learn\.terms\.hook enable\s+#/);
        expect(result.stdout).toMatch(/─ get\s+report/);
        expect(result.stdout).toContain('default = disabled');
      });

      then('the output matches the snapshot', () => {
        expect(
          asFramedOutput({ text: `${result.stdout}${result.stderr}`, scene }),
        ).toMatchSnapshot('help');
      });
    });
  });

  given('[case2] an enabled repo whose learner is later unlinked', () => {
    const scene = useBeforeAll(async () =>
      genScene({ slug: 'learner-terms-hook-unlinked' }),
    );

    when('[t0] the hook command a session would run fires, with no learner link', () => {
      const out = useThen('init, enable, unlink, then the hook fires', async () => {
        const init = await runRhx({
          cmd: 'npx rhx init --roles learner --hooks',
          cwd: scene.tempDir,
          home: scene.home,
        });
        const enable = await runRhx({
          cmd: 'npx rhx learn.terms.hook enable',
          cwd: scene.tempDir,
          home: scene.home,
        });
        const command = getTermsHookEntries(scene)[0]?.command ?? '';
        // rm on a link removes the link itself, never the role dir it points at
        fs.rmSync(path.join(scene.tempDir, '.agent', 'repo=bhrain', 'role=learner'), {
          recursive: true,
        });
        const fired = await runRhx({ cmd: command, cwd: scene.tempDir, home: scene.home });
        return { init, enable, command, fired };
      });

      then('the setup ran clean and the entry holds the guarded command', () => {
        expect(out.init.code).toEqual(0);
        expect(out.enable.code).toEqual(0);
        expect(out.command).toContain('[ ! -e .agent/repo=bhrain/role=learner ] ||');
      });

      then('the hook exits 0 and says naught: no stop is held', () => {
        expect(out.fired.code).toEqual(0);
        expect(out.fired.stdout).toEqual('');
        expect(out.fired.stderr).toEqual('');
      });

      then('the quiet stop matches the snapshot, an empty frame', () => {
        expect({
          stdout: asFramedOutput({ text: out.fired.stdout, scene }),
          stderr: asFramedOutput({ text: out.fired.stderr, scene }),
        }).toMatchSnapshot('hook command - learner unlinked, quiet');
      });
    });
  });

  given('[case3] a repo layer that is not valid json', () => {
    const scene = useBeforeAll(async () =>
      genScene({ slug: 'learner-terms-hook-bad-json' }),
    );
    const BODY_BAD = '{ "hooks": {}, }';

    when('[t0] enable runs over the broken file', () => {
      const out = useThen('init, break the file, then enable', async () => {
        const init = await runRhx({
          cmd: 'npx rhx init --roles learner --hooks',
          cwd: scene.tempDir,
          home: scene.home,
        });
        fs.writeFileSync(asRepoLayerPath(scene), BODY_BAD);
        const enable = await runRhx({
          cmd: 'npx rhx learn.terms.hook enable',
          cwd: scene.tempDir,
          home: scene.home,
        });
        return { init, enable, after: fs.readFileSync(asRepoLayerPath(scene), 'utf8') };
      });

      then('it exits 2 with the qualified header and the fix', () => {
        expect(out.init.code).toEqual(0);
        expect(out.enable.code).toEqual(2);
        expect(out.enable.stderr).toContain(
          '✋ ConstraintError: the settings target is not valid json',
        );
        expect(out.enable.stderr).toContain('├─ parse = ');
        expect(out.enable.stderr).toContain('fix: repair the json, then rerun');
      });

      then('the file is byte-identical', () => {
        expect(out.after).toEqual(BODY_BAD);
      });

      then('the stderr matches the snapshot', () => {
        expect(asFramedOutput({ text: out.enable.stderr, scene })).toMatchSnapshot(
          'enable - refused, not valid json',
        );
      });
    });
  });

  given('[case4] a repo layer that is a link', () => {
    const scene = useBeforeAll(async () =>
      genScene({ slug: 'learner-terms-hook-link' }),
    );

    when('[t0] enable runs over the link', () => {
      const out = useThen('init, swap the file for a link, then enable', async () => {
        const init = await runRhx({
          cmd: 'npx rhx init --roles learner --hooks',
          cwd: scene.tempDir,
          home: scene.home,
        });
        const elsewhere = path.join(scene.home, 'elsewhere.json');
        fs.writeFileSync(elsewhere, '{}');
        fs.rmSync(asRepoLayerPath(scene));
        fs.symlinkSync(elsewhere, asRepoLayerPath(scene));
        const enable = await runRhx({
          cmd: 'npx rhx learn.terms.hook enable',
          cwd: scene.tempDir,
          home: scene.home,
        });
        return { init, enable, elsewhere: fs.readFileSync(elsewhere, 'utf8') };
      });

      then('it exits 2 with the qualified header and the fix', () => {
        expect(out.init.code).toEqual(0);
        expect(out.enable.code).toEqual(2);
        expect(out.enable.stderr).toContain(
          '✋ ConstraintError: the settings target is a link',
        );
        expect(out.enable.stderr).toContain('fix: replace the link with a real file');
      });

      then('the file behind the link is untouched', () => {
        expect(out.elsewhere).toEqual('{}');
      });

      then('the stderr matches the snapshot', () => {
        expect(asFramedOutput({ text: out.enable.stderr, scene })).toMatchSnapshot(
          'enable - refused, a link',
        );
      });
    });
  });

  // the other target shapes a verb refuses, each over its own repo, each through `npx rhx`
  const REFUSALS: {
    slug: string;
    scenario: string;
    tamper: (input: { tempDir: string; home: string }) => void;
    header: string;
    fix: string;
  }[] = [
    {
      slug: 'unwalkable',
      scenario: 'a repo layer whose hooks shape no verb can walk',
      tamper: (scene) =>
        fs.writeFileSync(asRepoLayerPath(scene), '{ "hooks": { "Stop": "x" } }'),
      header: '✋ ConstraintError: the settings target holds a shape learn.terms.hook cannot walk',
      fix: 'fix: make hooks map each event to a list of { matcher, hooks }',
    },
    {
      slug: 'dir',
      scenario: 'a dir at the repo layer path',
      tamper: (scene) => {
        fs.rmSync(asRepoLayerPath(scene));
        fs.mkdirSync(asRepoLayerPath(scene));
      },
      header: '✋ ConstraintError: the settings target is a dir',
      fix: 'fix: replace the dir with a settings json file',
    },
    {
      slug: 'outside-repo',
      scenario: 'a .claude dir that resolves outside the repo',
      tamper: (scene) => {
        // the temp home sits inside the temp repo, so the outside dir is a temp dir of its own
        const outside = genTempDir({ slug: 'learner-terms-hook-outside' });
        fs.rmSync(path.join(scene.tempDir, '.claude'));
        fs.symlinkSync(outside, path.join(scene.tempDir, '.claude'));
      },
      header: '✋ ConstraintError: the settings target resolves outside the repo',
      fix: 'fix: point .claude at a dir inside the repo',
    },
  ];

  REFUSALS.forEach((refusal, index) =>
    given(`[case${5 + index}] ${refusal.scenario}`, () => {
      const scene = useBeforeAll(async () =>
        genScene({ slug: `learner-terms-hook-${refusal.slug}` }),
      );

      when('[t0] enable runs over it', () => {
        const out = useThen('init, tamper, then enable', async () => {
          const init = await runRhx({
            cmd: 'npx rhx init --roles learner --hooks',
            cwd: scene.tempDir,
            home: scene.home,
          });
          refusal.tamper(scene);
          const enable = await runRhx({
            cmd: 'npx rhx learn.terms.hook enable',
            cwd: scene.tempDir,
            home: scene.home,
          });
          return { init, enable };
        });

        then('it exits 2 with the qualified header and the fix', () => {
          expect(out.init.code).toEqual(0);
          expect(out.enable.code).toEqual(2);
          expect(out.enable.stderr).toContain(refusal.header);
          expect(out.enable.stderr).toContain(refusal.fix);
        });

        then('stdout holds no toggle output, only rhachet’s run banner', () => {
          expect(out.enable.stdout).not.toContain('learn.terms.hook enable');
          expect(out.enable.stdout).not.toContain('status =');
        });

        then('the stderr matches the snapshot', () => {
          expect(asFramedOutput({ text: out.enable.stderr, scene })).toMatchSnapshot(
            `enable - refused, ${refusal.slug}`,
          );
        });
      });
    }),
  );

  given('[case8] an enabled repo whose learner stays linked', () => {
    const scene = useBeforeAll(async () =>
      genScene({ slug: 'learner-terms-hook-held' }),
    );

    when('[t0] a stop fires the entry with no fresh distillation on file', () => {
      const out = useThen('init, enable, then the hook fires', async () => {
        const init = await runRhx({
          cmd: 'npx rhx init --roles learner --hooks',
          cwd: scene.tempDir,
          home: scene.home,
        });
        const enable = await runRhx({
          cmd: 'npx rhx learn.terms.hook enable',
          cwd: scene.tempDir,
          home: scene.home,
        });
        const command = getTermsHookEntries(scene)[0]?.command ?? '';
        const fired = await runRhx({ cmd: command, cwd: scene.tempDir, home: scene.home });
        return { init, enable, fired };
      });

      then('the setup ran clean', () => {
        expect(out.init.code).toEqual(0);
        expect(out.enable.code).toEqual(0);
      });

      then('the stop is held, exit 2, with the term nudge', () => {
        expect(out.fired.code).toEqual(2);
        expect(out.fired.stderr).toContain('time again, to tend the terms');
      });

      then('the held stop matches the snapshot', () => {
        expect(asFramedOutput({ text: out.fired.stderr, scene })).toMatchSnapshot(
          'hook command - learner linked, stale, held',
        );
      });
    });

    when('[t1] disable runs, then the Stop commands left in the repo layer are read', () => {
      const out = useThen('disable, then collect every Stop command that runs it', async () => {
        const disable = await runRhx({
          cmd: 'npx rhx learn.terms.hook disable',
          cwd: scene.tempDir,
          home: scene.home,
        });
        return { disable, commandsLeft: getTermsHookCommandsAnyAuthor(scene) };
      });

      then('disable exits 0 and no Stop command runs the term hook, under any author', () => {
        expect(out.disable.code).toEqual(0);
        expect(out.commandsLeft).toEqual([]);
      });

      then('the term hook commands left match the snapshot, an empty list', () => {
        expect(out.commandsLeft).toMatchSnapshot(
          'stop commands after disable - none runs the term hook',
        );
      });
    });
  });

  given('[case9] an enabled repo with a hand copy of the withdrawn hook', () => {
    const scene = useBeforeAll(async () =>
      genScene({ slug: 'learner-terms-hook-hand-copy' }),
    );

    when('[t0] get, then disable, run over the hand copy', () => {
      const out = useThen('init, enable, paste a hand copy, then get and disable', async () => {
        const init = await runRhx({
          cmd: 'npx rhx init --roles learner --hooks',
          cwd: scene.tempDir,
          home: scene.home,
        });
        const enable = await runRhx({
          cmd: 'npx rhx learn.terms.hook enable',
          cwd: scene.tempDir,
          home: scene.home,
        });

        // a human pastes the withdrawn hook back in, under the learner's own author
        const settings = JSON.parse(fs.readFileSync(asRepoLayerPath(scene), 'utf8')) as {
          hooks?: Record<string, unknown[]>;
        };
        const handCopy = {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: './node_modules/.bin/rhx learn.domain.terms --when hook.onStop',
              timeout: 5,
              author: 'repo=bhrain/role=learner',
            },
          ],
        };
        fs.writeFileSync(
          asRepoLayerPath(scene),
          JSON.stringify(
            {
              ...settings,
              hooks: {
                ...settings.hooks,
                Stop: [...(settings.hooks?.Stop ?? []), handCopy],
              },
            },
            null,
            2,
          ),
        );

        const get = await runRhx({
          cmd: 'npx rhx learn.terms.hook get',
          cwd: scene.tempDir,
          home: scene.home,
        });
        const disable = await runRhx({
          cmd: 'npx rhx learn.terms.hook disable',
          cwd: scene.tempDir,
          home: scene.home,
        });
        return {
          init,
          enable,
          get,
          disable,
          commandsLeft: getTermsHookCommandsAnyAuthor(scene),
        };
      });

      then('the setup ran clean', () => {
        expect(out.init.code).toEqual(0);
        expect(out.enable.code).toEqual(0);
      });

      then('get reports enabled and names the hand copy as drift, with its repair', () => {
        expect(out.get.code).toEqual(0);
        expect(out.get.stdout).toContain('status = enabled');
        expect(out.get.stdout).toContain('drift = an entry');
      });

      then('disable removes both entries and names the one it did not write', () => {
        expect(out.disable.code).toEqual(0);
        expect(out.disable.stdout).toContain('status = disabled (removed)');
        expect(out.disable.stdout).toContain(
          'also removed = an entry the toggle did not write',
        );
        expect(out.disable.stdout).toContain('└─ by repo=bhrain/role=learner');
        expect(out.commandsLeft).toEqual([]);
      });

      then('the get output matches the snapshot', () => {
        expect(
          asFramedOutput({ text: `${out.get.stdout}${out.get.stderr}`, scene }),
        ).toMatchSnapshot('get - enabled, a hand copy as drift');
      });

      then('the disable output matches the snapshot', () => {
        expect(
          asFramedOutput({ text: `${out.disable.stdout}${out.disable.stderr}`, scene }),
        ).toMatchSnapshot('disable - removed, a hand copy too');
      });
    });
  });
});
