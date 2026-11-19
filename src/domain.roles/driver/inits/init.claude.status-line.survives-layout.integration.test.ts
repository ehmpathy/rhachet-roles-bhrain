import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { asRouteStatusLineFilePath } from '@src/domain.operations/route/statusLine/file/asRouteStatusLineFilePath';
import { asRouteStatusLinePointerPath } from '@src/domain.operations/route/statusLine/file/asRouteStatusLinePointerPath';
import { sanitizeBranchName } from '@src/utils/git/sanitizeBranchName';

import { execSync, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * .what = integration clamp: the bind survives rhachet's own brain-dir layout pass
 * .why = the wish's defect: the published init wrote `.claude/settings.json`, a name rhachet
 *        >=1.49 reserves for a link; the next layout pass restored the link and the status line
 *        vanished, in silence. this drives the REAL rhachet cli from node_modules — layout, init,
 *        layout again — so the clamp proves survival against rhachet itself, not a hand-built
 *        layout. the init runs from src; rhachet loads the linked roles' registry from this
 *        package's dist via a selflink, so it reads a built dist, as ci builds before this suite
 */
const INIT_PATH: string = path.join(__dirname, 'init.claude.status-line.sh');
const RHACHET_BIN: string = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'node_modules',
  '.bin',
  'rhachet',
);

/**
 * .what = runs one command in the fixture repo, with HOME at the fixture's own home
 * .why = rhachet links the grove settings layer to $HOME/.claude/settings.json; a temp home
 *        keeps the host's settings out of reach, as input and as a write target
 */
const run = (input: {
  cmd: string;
  args: string[];
  cwd: string;
  home: string;
}): { stdout: string; stderr: string; exitCode: number | null } => {
  const result = spawnSync(input.cmd, input.args, {
    cwd: input.cwd,
    encoding: 'utf-8',
    env: asFixtureEnv({ home: input.home }),
    timeout: TIMEOUT_OF_RUN_MS,
  });
  if (result.error) throw result.error;
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.status,
  };
};
const TIMEOUT_OF_RUN_MS = 120_000;

/**
 * .what = the host env, with HOME at the fixture's home and no CLAUDE_CONFIG_DIR
 * .why = a host CLAUDE_CONFIG_DIR would name the host's brain dir as the init's target
 */
const asFixtureEnv = (input: { home: string }): NodeJS.ProcessEnv => ({
  ...Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key !== 'CLAUDE_CONFIG_DIR'),
  ),
  HOME: input.home,
});

/**
 * .what = runs a setup step, and fails the suite loud if it did not exit 0
 * .why = a setup step whose result is discarded would let a broken fixture pass as a scene
 */
const runSetup = (input: Parameters<typeof run>[0]): ReturnType<typeof run> => {
  const result = run(input);
  if (result.exitCode !== 0)
    throw new Error(
      `fixture setup failed: ${input.cmd} ${input.args.join(' ')} exited ${result.exitCode}; check that pnpm install and npm run build both pass, then rerun\n${result.stdout}${result.stderr}`,
    );
  return result;
};

/**
 * .what = the exact statusLine command the init binds: the bash reader, never node
 * .why = the wish's defect was a node process per repaint; a check for the slug alone passes
 *        for the old `node -e "import('…/route.status.line')"` command too, so the clamp pins
 *        the command whole
 */
const COMMAND_OF_STATUS_LINE =
  "BASH_ENV= bash .agent/repo=bhrain/role=driver/skills/route.status.line.sh || printf '%s\\n' '🗿 status line reader not found, rhx init --roles driver'";

/**
 * .what = the reader path the bound command names, relative to the repo root
 */
const PATH_OF_BOUND_READER =
  '.agent/repo=bhrain/role=driver/skills/route.status.line.sh';

/**
 * .what = stderr with bash's own not-found text masked around the path it names
 * .why = bash words a not-found differently by build (`bash: X: No such file or directory`,
 *        and the like), so the words are masked and the line, the path, and every other
 *        line stay under the snapshot
 */
const asMaskedBashNotFound = (input: { stderr: string }): string =>
  input.stderr
    .split('\n')
    .map((line) =>
      line.includes(PATH_OF_BOUND_READER)
        ? `<bash>: ${PATH_OF_BOUND_READER}: <not found>`
        : line,
    )
    .join('\n');

/**
 * .what = where rhachet's split layout points `.claude/settings.json`: the grove layer
 * .why = the bind survives because it lives in settings.of.repo.json, a real file, while the
 *        name the harness reads is a link rhachet owns; a link to aught else is a layout change
 */
const TARGET_OF_SETTINGS_LINK = 'settings.of.grove.json';

/**
 * .what = reads the brain dir's settings as rhachet left them
 * .why = the clamp asserts on the layout itself: which name is a link, where it points, and
 *        which file holds the bind
 */
const getBrainDirSettings = (input: {
  repo: string;
}): {
  isSettingsLink: boolean;
  settingsLinkTarget: string | null;
  repoLayer: { statusLine?: { command: string } };
} => {
  const claudeDir = path.join(input.repo, '.claude');
  const settingsPath = path.join(claudeDir, 'settings.json');
  const isSettingsLink = fs.lstatSync(settingsPath).isSymbolicLink();
  return {
    isSettingsLink,
    settingsLinkTarget: isSettingsLink ? fs.readlinkSync(settingsPath) : null,
    repoLayer: JSON.parse(
      fs.readFileSync(path.join(claudeDir, 'settings.of.repo.json'), 'utf-8'),
    ),
  };
};

/**
 * .what = rhachet's framed init output, with the bytes that vary per run tokenized
 * .why = the snapshot pins what a human sees through `rhx init`. four bytes vary per run and
 *        no others: the temp repo, the temp home, the host path to this package's dist,
 *        and each backup's timestamp + pid
 */
const asFramedInitBlock = (input: {
  stdout: string;
  scene: { repo: string; home: string };
}): string =>
  input.stdout
    .split(fs.realpathSync(input.scene.repo))
    .join('$REPO')
    .split(input.scene.repo)
    .join('$REPO')
    .split(fs.realpathSync(input.scene.home))
    .join('$HOME')
    .split(input.scene.home)
    .join('$HOME')
    .replace(/(?:\.\.\/)+\S*?\/dist\//g, '$PACKAGE/dist/')
    .replace(/\d{4}-\d\d-\d\dT\d\d-\d\d-\d\dZ\.\d+/g, '$STAMP')
    .replace(/\d+ (brief|skill|init)\(s\)/g, '$N $1(s)');

/**
 * .what = this repo's root, and the role packages a fixture resolves its linked roles from
 * .why = rhachet loads each linked role's package from the fixture's own node_modules; a
 *        selflink serves this package (built dist), and the installed peer serves mechanic
 */
const REPO_ROOT: string = path.join(__dirname, '..', '..', '..', '..');
const ROLE_PACKAGES: Record<string, string> = {
  'rhachet-roles-bhrain': REPO_ROOT,
  'rhachet-roles-ehmpathy': path.join(
    REPO_ROOT,
    'node_modules',
    'rhachet-roles-ehmpathy',
  ),
};

/**
 * .what = a git-backed temp repo with driver linked, plus a temp home that holds an empty grove
 * .why = the init binds only a repo actor that holds driver, and the repo actor's roles are
 *        the linked role dirs; `rolesExtra` links more ehmpathy roles beside it
 */
const genFixture = (input: {
  slug: string;
  rolesExtra?: string[];
  driverLinked?: boolean;
}): { repo: string; home: string } => {
  const repo = genTempDir({ slug: input.slug, git: true });
  const home = genTempDir({ slug: `${input.slug}-home` });
  fs.mkdirSync(path.join(repo, 'node_modules'), { recursive: true });
  for (const [name, target] of Object.entries(ROLE_PACKAGES)) {
    if (!fs.existsSync(path.join(target, 'package.json')))
      throw new Error(
        `fixture role package absent: ${name} at ${target}; run pnpm install, then npm run build`,
      );
    fs.symlinkSync(target, path.join(repo, 'node_modules', name));
  }
  fs.writeFileSync(
    path.join(repo, 'package.json'),
    JSON.stringify({
      name: input.slug,
      private: true,
      devDependencies: Object.fromEntries(
        Object.keys(ROLE_PACKAGES).map((name) => [name, '*']),
      ),
    }),
  );
  if (input.driverLinked !== false)
    fs.mkdirSync(path.join(repo, '.agent', 'repo=bhrain', 'role=driver'), {
      recursive: true,
    });
  for (const role of input.rolesExtra ?? [])
    fs.mkdirSync(path.join(repo, '.agent', 'repo=ehmpathy', `role=${role}`), {
      recursive: true,
    });
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'settings.json'), '{}');
  return { repo, home };
};

describe('init.claude.status-line.survives-layout.integration', () => {
  given(
    '[case1] a repo that rhachet lays out, then the driver init binds',
    () => {
      const scene = useBeforeAll(async () => {
        const fixture = genFixture({
          slug: 'statusline-survives-layout-case1',
        });
        const layout = run({
          cmd: RHACHET_BIN,
          args: ['init', '--hooks'],
          ...fixture,
          cwd: fixture.repo,
        });
        const init = run({
          cmd: '/bin/bash',
          args: [INIT_PATH],
          ...fixture,
          cwd: fixture.repo,
        });
        return {
          ...fixture,
          layout,
          init,
          afterInit: getBrainDirSettings(fixture),
        };
      });

      when('[t0] rhachet lays out the brain dir, then the init binds', () => {
        then('rhachet lays out the split layout', () => {
          expect(scene.layout).toMatchObject({ exitCode: 0 });
          expect(scene.afterInit.isSettingsLink).toEqual(true);
          expect(scene.afterInit.settingsLinkTarget).toEqual(
            TARGET_OF_SETTINGS_LINK,
          );
        });

        then('the init binds settings.of.repo.json', () => {
          expect(scene.init.exitCode).toEqual(0);
          expect(scene.init.stdout).toContain(
            'settings = .claude/settings.of.repo.json',
          );
          expect(scene.afterInit.repoLayer.statusLine?.command).toEqual(
            COMMAND_OF_STATUS_LINE,
          );
        });

        then('the init tree matches the snapshot', () => {
          expect(
            asFramedInitBlock({ stdout: scene.init.stdout, scene }),
          ).toMatchSnapshot('init.claude.status-line - bound after a layout');
        });
      });

      when(
        '[t1] rhachet lays out the brain dir again, as an enroll does',
        () => {
          const out = useBeforeAll(async () => {
            const result = run({
              cmd: RHACHET_BIN,
              args: ['init', '--hooks'],
              cwd: scene.repo,
              home: scene.home,
            });
            return { ...result, after: getBrainDirSettings(scene) };
          });

          then('it exits 0', () => {
            expect(out).toMatchObject({ exitCode: 0 });
          });

          then('settings.json is still a link', () => {
            expect(out.after.isSettingsLink).toEqual(true);
            expect(out.after.settingsLinkTarget).toEqual(
              TARGET_OF_SETTINGS_LINK,
            );
          });

          then('the status line survives in settings.of.repo.json', () => {
            expect(out.after.repoLayer.statusLine?.command).toEqual(
              COMMAND_OF_STATUS_LINE,
            );
          });

          then('the layout pass output matches the snapshot', () => {
            expect(
              asFramedInitBlock({ stdout: out.stdout, scene }),
            ).toMatchSnapshot(
              'rhachet init --hooks - layout again, hooks need no change',
            );
          });
        },
      );
    },
  );

  given(
    '[case2] a statusLine written where the published init wrote it, a real settings.json',
    () => {
      // the defect: a layout pass swaps a real settings.json for its link, and the bind is lost
      const scene = useBeforeAll(async () => {
        const fixture = genFixture({
          slug: 'statusline-survives-layout-case2',
        });
        runSetup({
          cmd: RHACHET_BIN,
          args: ['init', '--hooks'],
          ...fixture,
          cwd: fixture.repo,
        });
        const brain = fs.realpathSync(path.join(fixture.repo, '.claude'));
        fs.unlinkSync(path.join(brain, 'settings.json'));
        fs.writeFileSync(
          path.join(brain, 'settings.json'),
          JSON.stringify({
            statusLine: { type: 'command', command: 'routeStatusLine' },
          }),
        );
        return { ...fixture, brain };
      });

      when('[t0] rhachet lays out the brain dir again', () => {
        const out = useBeforeAll(async () => {
          const result = run({
            cmd: RHACHET_BIN,
            args: ['init', '--hooks'],
            cwd: scene.repo,
            home: scene.home,
          });
          return { ...result, after: getBrainDirSettings(scene) };
        });

        then('the real settings.json is replaced by the link', () => {
          expect(out.after.isSettingsLink).toEqual(true);
          expect(out.after.settingsLinkTarget).toEqual(TARGET_OF_SETTINGS_LINK);
        });

        then('the status line written there is gone', () => {
          expect(out.after.repoLayer.statusLine).toBeUndefined();
        });

        then('the layout pass output matches the snapshot', () => {
          expect(
            asFramedInitBlock({ stdout: out.stdout, scene }),
          ).toMatchSnapshot(
            'rhachet init --hooks - layout pass over a stray real settings.json',
          );
        });
      });
    },
  );

  given(
    '[case3] a driver clone of a peer actor, a hash actor that holds driver',
    () => {
      // a peer clone derives its settings.of.repo.json whole from the repo actor's
      const scene = useBeforeAll(async () => {
        const fixture = genFixture({
          slug: 'statusline-survives-layout-case3',
          rolesExtra: ['mechanic'],
        });
        runSetup({
          cmd: RHACHET_BIN,
          args: ['init', '--hooks'],
          ...fixture,
          cwd: fixture.repo,
        });
        const init = run({
          cmd: '/bin/bash',
          args: [INIT_PATH],
          ...fixture,
          cwd: fixture.repo,
        });
        // a delta actor, as `rhx enroll claude --roles -mechanic` leaves it on disk
        const peerDir = path.join(
          fixture.repo,
          '.agent',
          '.actors',
          'actor.via.hash=0a1b2c3d',
        );
        fs.mkdirSync(peerDir, { recursive: true });
        fs.writeFileSync(
          path.join(peerDir, 'actor.json'),
          JSON.stringify({
            schemaVersion: 1,
            brain: 'claude',
            roles: ['driver'],
            rolesDelta: ['-mechanic'],
          }),
        );
        return { ...fixture, init, peerDir };
      });

      when('[t0] rhachet derives every actor, as rhx init --hooks does', () => {
        const out = useBeforeAll(async () => {
          const result = run({
            cmd: RHACHET_BIN,
            args: ['init', '--hooks'],
            cwd: scene.repo,
            home: scene.home,
          });
          const peerFile = path.join(
            scene.peerDir,
            'brain',
            '.claude',
            'settings.of.repo.json',
          );
          const peerLayer: { statusLine?: { command: string } } = fs.existsSync(
            peerFile,
          )
            ? JSON.parse(fs.readFileSync(peerFile, 'utf-8'))
            : {};
          return { ...result, peerFile, peerLayer };
        });

        then('the init bound the repo actor first', () => {
          expect(scene.init.exitCode).toEqual(0);
          expect(scene.init.stdout).toContain('status = configured');
        });

        then('it exits 0', () => {
          expect(out).toMatchObject({ exitCode: 0 });
        });

        then('the peer actor holds the status line, derived', () => {
          expect(fs.existsSync(out.peerFile)).toEqual(true);
          expect(out.peerLayer.statusLine?.command).toEqual(
            COMMAND_OF_STATUS_LINE,
          );
        });

        then('the sweep output matches the snapshot', () => {
          expect(
            asFramedInitBlock({ stdout: out.stdout, scene }),
          ).toMatchSnapshot(
            'rhachet init --hooks - sweep with a hash actor listed',
          );
        });
      });
    },
  );

  given(
    '[case4] a repo with driver unlinked, driven through the real rhachet init --roles',
    () => {
      // the framed journey a human meets: rhachet links driver, runs its inits, frames output
      const scene = useBeforeAll(async () =>
        genFixture({ slug: 'statusline-journey-case4', driverLinked: false }),
      );

      const linked = useBeforeAll(async () => {
        const result = run({
          cmd: RHACHET_BIN,
          args: ['init', '--roles', 'driver'],
          cwd: scene.repo,
          home: scene.home,
        });
        return { ...result, after: getBrainDirSettings(scene) };
      });

      when('[t0] the human links driver', () => {
        then('it exits 0', () => {
          expect(linked).toMatchObject({ exitCode: 0 });
        });

        then('rhachet linked the driver role', () => {
          expect(
            fs.existsSync(
              path.join(scene.repo, '.agent', 'repo=bhrain', 'role=driver'),
            ),
          ).toEqual(true);
        });

        then('the framed init reports the bind', () => {
          expect(linked.stdout).toContain('init.claude.status-line');
          expect(linked.stdout).toContain('status = configured');
        });

        then('settings.of.repo.json holds the status line', () => {
          expect(linked.after.repoLayer.statusLine?.command).toEqual(
            COMMAND_OF_STATUS_LINE,
          );
        });

        then('the framed init block matches the snapshot', () => {
          expect(
            asFramedInitBlock({ stdout: linked.stdout, scene }),
          ).toMatchSnapshot('rhachet init --roles driver - status line bound');
        });

        // the bound command itself, run as the harness runs it, against the linked dist reader
        const repaint = useBeforeAll(async () => {
          // a branch bound to a route whose writers left a status file and a pointer
          const branch = 'feat/status-line';
          execSync(`git checkout -q -b ${branch}`, { cwd: scene.repo });
          const route = '.behavior/v2026_10_26.feat';
          const flat = sanitizeBranchName({ branch });
          fs.mkdirSync(path.join(scene.repo, route, '.route'), {
            recursive: true,
          });
          fs.writeFileSync(
            path.join(scene.repo, route, '.route', `.bind.${flat}.flag`),
            '',
          );
          fs.writeFileSync(
            asRouteStatusLineFilePath({ cwd: scene.repo, route }),
            '{"route":".behavior/v2026_10_26.feat","line":"🗿 1.vision, yield 🌾"}\n',
          );
          const pointerPath = asRouteStatusLinePointerPath({
            cwd: scene.repo,
            branch,
          });
          fs.mkdirSync(path.dirname(pointerPath), { recursive: true });
          fs.writeFileSync(pointerPath, `${route}\n`);
          // PATH holds only bash's own dir: the bound command names `bash`, as the harness runs it
          const bashPath = execSync('command -v bash').toString().trim();
          const result = spawnSync(bashPath, ['-c', COMMAND_OF_STATUS_LINE], {
            cwd: scene.repo,
            encoding: 'utf-8',
            env: { PATH: path.dirname(bashPath) },
            timeout: TIMEOUT_OF_RUN_MS,
          });
          if (result.error) throw result.error;

          // the same command from a subdir: the relative reader path misses, the fallback speaks
          const subDir = path.join(scene.repo, 'src', 'deep');
          fs.mkdirSync(subDir, { recursive: true });
          const drifted = spawnSync(bashPath, ['-c', COMMAND_OF_STATUS_LINE], {
            cwd: subDir,
            encoding: 'utf-8',
            env: { PATH: path.dirname(bashPath) },
            timeout: TIMEOUT_OF_RUN_MS,
          });
          if (drifted.error) throw drifted.error;
          return {
            exitCode: result.status,
            stdout: result.stdout,
            stderr: result.stderr,
            drifted: {
              exitCode: drifted.status,
              stdout: drifted.stdout,
              stderr: drifted.stderr,
            },
          };
        });

        then(
          'from a subdir, the bound command names its fix, never a silent blank',
          () => {
            expect(repaint.drifted).toMatchObject({
              exitCode: 0,
              stdout:
                '🗿 status line reader not found, rhx init --roles driver\n',
            });
            expect(repaint.drifted.stderr).toContain(PATH_OF_BOUND_READER);
          },
        );

        then('what the subdir repaint shows matches the snapshot', () => {
          expect({
            exitCode: repaint.drifted.exitCode,
            stdout: repaint.drifted.stdout,
            stderr: asMaskedBashNotFound({ stderr: repaint.drifted.stderr }),
          }).toMatchSnapshot(
            'status line repaint after link, from a subdir - the reader path misses',
          );
        });

        then('the bound command prints the line via the linked reader', () => {
          expect(repaint).toMatchObject({
            exitCode: 0,
            stdout: '🗿 1.vision, yield 🌾\n',
            stderr: '',
          });
          expect({
            exitCode: repaint.exitCode,
            stdout: repaint.stdout,
            stderr: repaint.stderr,
          }).toMatchSnapshot(
            'status line repaint after link - the bound command prints the line',
          );
        });
      });

      when('[t1] the human runs it again', () => {
        const rerun = useBeforeAll(async () =>
          run({
            cmd: RHACHET_BIN,
            args: ['init', '--roles', 'driver'],
            cwd: scene.repo,
            home: scene.home,
          }),
        );

        then('it exits 0, and the init reports no change', () => {
          expect(rerun).toMatchObject({ exitCode: 0 });
          expect(rerun.stdout).toContain('already configured');
        });

        then('the framed init block matches the snapshot', () => {
          expect(
            asFramedInitBlock({ stdout: rerun.stdout, scene }),
          ).toMatchSnapshot(
            'rhachet init --roles driver - rerun, the init reports already configured',
          );
        });
      });

      when('[t2] the human unlinks driver', () => {
        // 🟡 pins a gap: rhachet runs no init on unlink (dream: rhachet-unlink-runs-no-role-teardown)
        const unlinked = useBeforeAll(async () => {
          const result = run({
            cmd: RHACHET_BIN,
            args: ['init', '--roles', '-driver'],
            cwd: scene.repo,
            home: scene.home,
          });
          // what the harness runs on the next repaint, from the repo root, as a human sees it
          const repaint = run({
            cmd: '/bin/bash',
            args: ['-c', COMMAND_OF_STATUS_LINE],
            cwd: scene.repo,
            home: scene.home,
          });
          return { ...result, repaint, after: getBrainDirSettings(scene) };
        });

        then('it exits 0, and the driver link is gone', () => {
          expect(unlinked).toMatchObject({ exitCode: 0 });
          expect(
            fs.existsSync(
              path.join(scene.repo, '.agent', 'repo=bhrain', 'role=driver'),
            ),
          ).toEqual(false);
        });

        then('the status line stays in settings.of.repo.json', () => {
          expect(unlinked.after.repoLayer.statusLine?.command).toEqual(
            COMMAND_OF_STATUS_LINE,
          );
        });

        then(
          'the repaint finds no reader, and the line names the fix, never a blank',
          () => {
            expect(unlinked.repaint.stdout).toEqual(
              '🗿 status line reader not found, rhx init --roles driver\n',
            );
            expect(unlinked.repaint.exitCode).toEqual(0);
            // bash names the absent reader on stderr, which the harness does not render
            expect(unlinked.repaint.stderr).toContain(PATH_OF_BOUND_READER);
          },
        );

        then('what the repaint shows matches the snapshot', () => {
          expect({
            exitCode: unlinked.repaint.exitCode,
            stdout: unlinked.repaint.stdout,
            stderr: asMaskedBashNotFound({ stderr: unlinked.repaint.stderr }),
          }).toMatchSnapshot(
            'status line repaint after unlink - the reader is gone',
          );
        });

        then(
          'the framed output matches the snapshot, with no init block',
          () => {
            expect(
              asFramedInitBlock({ stdout: unlinked.stdout, scene }),
            ).toMatchSnapshot(
              'rhachet init --roles -driver - unlink, the init block is absent',
            );
          },
        );
      });
    },
  );

  given(
    '[case5] rhachet init --roles meets a state a human must fix, each time with driver unlinked first',
    () => {
      // each runs the real cli; a human-fixable state warns or skips, and never fails init (S2)
      const cases = useBeforeAll(async () => {
        // a foreign statusLine in the human's grove
        const foreign = genFixture({
          slug: 'statusline-journey-case5-foreign',
          driverLinked: false,
        });
        fs.writeFileSync(
          path.join(foreign.home, '.claude', 'settings.json'),
          JSON.stringify({
            statusLine: { type: 'command', command: 'my-own-line' },
          }),
        );

        // a malformed repo layer, laid out first
        const malformed = genFixture({
          slug: 'statusline-journey-case5-malformed',
          driverLinked: false,
        });
        runSetup({
          cmd: RHACHET_BIN,
          args: ['init', '--hooks'],
          cwd: malformed.repo,
          home: malformed.home,
        });
        fs.writeFileSync(
          path.join(
            fs.realpathSync(path.join(malformed.repo, '.claude')),
            'settings.of.repo.json',
          ),
          '{ "permissions": ',
        );

        // an old layout: a real .claude dir with a real settings.json
        const upgrade = genFixture({
          slug: 'statusline-journey-case5-upgrade',
          driverLinked: false,
        });
        fs.mkdirSync(path.join(upgrade.repo, '.claude'), { recursive: true });
        fs.writeFileSync(
          path.join(upgrade.repo, '.claude', 'settings.json'),
          JSON.stringify({ theme: 'dark' }),
        );

        // a repo layer that is a link, laid out first
        const linked = genFixture({
          slug: 'statusline-journey-case5-linked',
          driverLinked: false,
        });
        runSetup({
          cmd: RHACHET_BIN,
          args: ['init', '--hooks'],
          cwd: linked.repo,
          home: linked.home,
        });
        const linkedLayer = path.join(
          fs.realpathSync(path.join(linked.repo, '.claude')),
          'settings.of.repo.json',
        );
        const linkedTarget = path.join(linked.home, 'elsewhere.json');
        fs.writeFileSync(linkedTarget, '{}');
        fs.rmSync(linkedLayer);
        fs.symlinkSync(linkedTarget, linkedLayer);

        const drive = (fixture: { repo: string; home: string }) =>
          run({
            cmd: RHACHET_BIN,
            args: ['init', '--roles', 'driver'],
            cwd: fixture.repo,
            home: fixture.home,
          });
        return {
          foreign: { fixture: foreign, result: drive(foreign) },
          malformed: { fixture: malformed, result: drive(malformed) },
          linked: {
            fixture: linked,
            target: linkedTarget,
            result: drive(linked),
          },
          upgrade: {
            fixture: upgrade,
            result: drive(upgrade),
          },
        };
      });

      when('[t0] the grove holds the statusLine of the human', () => {
        then('it exits 0 and the init skips, named', () => {
          expect(cases.foreign.result).toMatchObject({ exitCode: 0 });
          expect(cases.foreign.result.stdout).toContain('skipped');
        });

        then('the repo layer holds no status line of ours', () => {
          expect(
            getBrainDirSettings(cases.foreign.fixture).repoLayer.statusLine,
          ).toBeUndefined();
        });

        then('the framed init block matches the snapshot', () => {
          expect(
            asFramedInitBlock({
              stdout: cases.foreign.result.stdout,
              scene: cases.foreign.fixture,
            }),
          ).toMatchSnapshot('rhachet init --roles driver - grove line kept');
        });
      });

      when('[t1] the repo layer is malformed json', () => {
        then('it exits 0 and the init warns, named', () => {
          expect(cases.malformed.result).toMatchObject({ exitCode: 0 });
          expect(
            `${cases.malformed.result.stdout}${cases.malformed.result.stderr}`,
          ).toContain('not configured');
        });

        then('the framed init block matches the snapshot', () => {
          expect(
            asFramedInitBlock({
              stdout: `${cases.malformed.result.stdout}${cases.malformed.result.stderr}`,
              scene: cases.malformed.fixture,
            }),
          ).toMatchSnapshot('rhachet init --roles driver - malformed layer');
        });
      });

      when('[t3] the repo layer is a link', () => {
        then(
          'both inits warn, named, and rhachet then refuses the linked layer itself',
          () => {
            // exit 2 is rhachet's own refusal of a linked layer, after the inits exit 0
            expect(cases.linked.result).toMatchObject({ exitCode: 2 });
            const framed = `${cases.linked.result.stdout}${cases.linked.result.stderr}`;
            expect(framed).toContain('status = not configured');
            expect(framed).toContain('status = not healed');
            expect(framed).toContain('is a link');
            expect(framed).toContain(
              'settings.of.repo.json must be a real file',
            );
          },
        );

        then('it never writes through the link', () => {
          expect(fs.readFileSync(cases.linked.target, 'utf-8')).toEqual('{}');
        });

        then('the framed init block matches the snapshot', () => {
          expect(
            asFramedInitBlock({
              stdout: `${cases.linked.result.stdout}${cases.linked.result.stderr}`,
              scene: cases.linked.fixture,
            }).replace(cases.linked.target, '$LINK'),
          ).toMatchSnapshot('rhachet init --roles driver - linked layer');
        });
      });

      when('[t2] the repo carries an old real .claude dir', () => {
        then('it exits 0', () => {
          expect(cases.upgrade.result).toMatchObject({ exitCode: 0 });
        });

        then('the bind ends in the repo layer, which holds the line', () => {
          const held = getBrainDirSettings(cases.upgrade.fixture).repoLayer;
          expect(held.statusLine?.command).toEqual(COMMAND_OF_STATUS_LINE);
        });

        then('the framed init block matches the snapshot', () => {
          expect(
            asFramedInitBlock({
              stdout: `${cases.upgrade.result.stdout}${cases.upgrade.result.stderr}`,
              scene: cases.upgrade.fixture,
            }),
          ).toMatchSnapshot(
            'rhachet init --roles driver - old real claude dir',
          );
        });
      });
    },
  );
});
