import { MalfunctionError } from 'helpful-errors';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { getDomainTermsPaths } from '@src/domain.operations/learn/getDomainTermsPaths';
import { TERMS_HOOK_DECLARED } from '@src/domain.operations/learn/termsHook/TERMS_HOOK_DECLARED';

import { spawn, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * .what = integration clamps for `rhx learn.terms.hook get | enable | disable`
 * .why = the toggle writes a file rhachet also owns. so each verb is driven through the real
 *        skill wrapper, in a fixture repo that the REAL rhachet cli lays out, re-syncs, and
 *        derives; the clamps prove the entry survives rhachet itself, not a hand-built layout
 *
 * .note = the wrapper imports this package's built cli subpath through a selflink, so this
 *         suite reads a built dist, as ci builds before it
 */
const REPO_ROOT: string = path.join(__dirname, '..', '..', '..');
const WRAPPER: string = path.join(
  REPO_ROOT,
  'src/domain.roles/learner/skills/learn.terms.hook.sh',
);
const RHACHET_BIN: string = path.join(
  REPO_ROOT,
  'node_modules',
  '.bin',
  'rhachet',
);
/**
 * .what = the packages each fixture links into its node_modules
 * .why = rhachet syncs hooks only into a brain an installed `rhachet-brains-*` package supplies
 *        a hooks adapter for; with no brain package, `init --hooks` writes and prunes naught,
 *        and every survival clamp below would pass for want of a sync
 */
const FIXTURE_PACKAGES: Record<string, string> = {
  'rhachet-roles-bhrain': REPO_ROOT,
  'rhachet-brains-anthropic': path.join(
    REPO_ROOT,
    'node_modules',
    'rhachet-brains-anthropic',
  ),
};
const RHX_BIN: string = path.join(REPO_ROOT, 'node_modules', '.bin', 'rhx');
const PATH_TRACKED =
  '.agent/.actors/actor.via.repo=ambient/brain/.claude/settings.of.repo.json';

/**
 * .what = run one command in a fixture, with HOME at the fixture's own home
 * .why = rhachet links the grove layer to $HOME/.claude/settings.json; a temp home keeps the
 *        host's settings out of reach
 */
const run = (input: {
  cmd: string;
  args: string[];
  cwd: string;
  home: string;
  timeoutMs?: number;
}): { stdout: string; stderr: string; exitCode: number | null } => {
  const env: NodeJS.ProcessEnv = { ...process.env, HOME: input.home };
  delete env.CLAUDE_CONFIG_DIR;
  const result = spawnSync(input.cmd, input.args, {
    cwd: input.cwd,
    encoding: 'utf-8',
    env,
    timeout: input.timeoutMs,
  });
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.status,
  };
};

/**
 * .what = an output with its ansi color codes removed
 * .why = the face colors its nudge for a terminal; a snapshot pins the words a human reads,
 *        never the escape bytes around them
 */
const ANSI_COLOR = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');
const asAnsiStripped = (input: { text: string }): string =>
  input.text.replace(ANSI_COLOR, '');

/**
 * .what = run the toggle skill wrapper in a fixture
 */
const runToggle = (input: {
  scene: { repo: string; home: string };
  args: string[];
}) =>
  run({
    cmd: '/bin/bash',
    args: [WRAPPER, ...input.args],
    cwd: input.scene.repo,
    home: input.scene.home,
  });

/**
 * .what = run the toggle skill wrapper in a fixture as a child process, and await its close
 * .why = two toggles at once must truly overlap, which a sync spawn cannot do
 */
const runToggleChild = (input: {
  scene: { repo: string; home: string };
  args: string[];
}): Promise<{ stdout: string; stderr: string; exitCode: number | null }> =>
  new Promise((done) => {
    const child = spawn('/bin/bash', [WRAPPER, ...input.args], {
      cwd: input.scene.repo,
      env: { ...process.env, HOME: input.scene.home },
    });
    const stdout: string[] = [];
    const stderr: string[] = [];
    child.stdout.on('data', (chunk) => stdout.push(String(chunk)));
    child.stderr.on('data', (chunk) => stderr.push(String(chunk)));
    child.on('close', (code) =>
      done({
        stdout: stdout.join(''),
        stderr: stderr.join(''),
        exitCode: code,
      }),
    );
  });

/**
 * .what = a git-backed temp repo with the learner linked, plus a temp home with an empty grove
 * .why = the shape `init.claude.status-line.survives-layout` proved: a role dir under
 *        `.agent/` makes rhachet treat the role as linked, and a selflink serves this package
 */
const genFixture = (input: {
  slug: string;
  layout: 'split' | 'old' | 'none';
}): { repo: string; home: string } => {
  const repo = genTempDir({ slug: input.slug, git: true });
  const home = genTempDir({ slug: `${input.slug}-home` });
  fs.mkdirSync(path.join(repo, 'node_modules'), { recursive: true });
  for (const [name, target] of Object.entries(FIXTURE_PACKAGES))
    fs.symlinkSync(target, path.join(repo, 'node_modules', name));
  fs.writeFileSync(
    path.join(repo, 'package.json'),
    JSON.stringify({
      name: input.slug,
      private: true,
      devDependencies: Object.fromEntries(
        Object.keys(FIXTURE_PACKAGES).map((name) => [name, '*']),
      ),
    }),
  );
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'settings.json'), '{}');

  // the split layout is rhachet's own, laid out by the real cli, with real role links. the
  // driver rides along because it declares hooks: rhachet prunes and syncs only when some
  // linked role declares one, so a fixture without it would prove naught about either
  if (input.layout === 'split') {
    const layout = run({
      cmd: RHACHET_BIN,
      args: ['init', '--roles', 'learner', 'driver', '--hooks'],
      cwd: repo,
      home,
    });
    const isHookSyncReal = !layout.stdout.includes('no changes needed');
    if (layout.exitCode === 0 && !isHookSyncReal)
      throw new MalfunctionError(
        'rhachet init --hooks synced no hook into the fixture, so no clamp here would test a sync',
        {
          slug: input.slug,
          hint: 'check that rhachet-brains-anthropic is installed; its hooks adapter is what syncs',
        },
      );
    if (layout.exitCode !== 0)
      throw new MalfunctionError('rhachet init --hooks failed in the fixture', {
        slug: input.slug,
        stderr: layout.stderr,
        hint: 'run npm run build, then rerun the suite',
      });
  }

  // the other layouts need no rhachet: a bare role dir stands in for the learner link
  if (input.layout !== 'split')
    fs.mkdirSync(path.join(repo, '.agent', 'repo=bhrain', 'role=learner'), {
      recursive: true,
    });

  // the old layout is a real .claude/settings.json
  if (input.layout === 'old') {
    fs.mkdirSync(path.join(repo, '.claude'), { recursive: true });
    fs.writeFileSync(
      path.join(repo, '.claude', 'settings.json'),
      JSON.stringify({ permissions: { allow: ['Bash(echo:*)'] } }, null, 2),
    );
  }
  return { repo, home };
};

/**
 * .what = the shape of a settings file, as far as these assertions read it
 */
type SettingsRead = {
  hooks?: Record<
    string,
    {
      matcher?: string;
      hooks: { command?: string; author?: string; [key: string]: unknown }[];
    }[]
  >;
  [key: string]: unknown;
};

/**
 * .what = a settings file of the fixture, parsed
 */
const getSettings = (input: {
  repo: string;
  file: 'settings.of.repo.json' | 'settings.json';
}): SettingsRead =>
  JSON.parse(
    fs.readFileSync(path.join(input.repo, '.claude', input.file), 'utf-8'),
  );

/**
 * .what = every inner Stop hook that runs the term hook
 */
const getTermsHooks = (input: {
  settings: SettingsRead;
}): { command?: string; author?: string }[] =>
  (input.settings.hooks?.Stop ?? [])
    .flatMap((block) => block.hooks)
    .filter((hook) => hook.command?.includes(TERMS_HOOK_DECLARED.fragment));

/**
 * .what = the raw bytes of the split-layout target
 */
const getSettingsRaw = (input: { repo: string }): string =>
  fs.readFileSync(
    path.join(input.repo, '.claude', 'settings.of.repo.json'),
    'utf-8',
  );

/**
 * .what = the line diff between two texts, as a reviewer reads it, with no path headers
 * .why = the toggle's promise is a diff of its own block alone; the clamp reads the diff git
 *        itself computes, never a parsed compare that cannot see a reformat
 */
const getLineDiff = (input: {
  before: string;
  after: string;
  dir: string;
}): string => {
  const pathBefore = path.join(input.dir, 'diff.before.json');
  const pathAfter = path.join(input.dir, 'diff.after.json');
  fs.writeFileSync(pathBefore, input.before);
  fs.writeFileSync(pathAfter, input.after);
  const result = spawnSync(
    'git',
    ['diff', '--no-index', '--no-color', '-U1', pathBefore, pathAfter],
    { encoding: 'utf-8' },
  );
  return result.stdout
    .split('\n')
    .filter((line) => !/^(diff |index |--- |\+\+\+ )/.test(line))
    .join('\n');
};

/**
 * .what = whether a line diff only inserts lines, where the one edit json allows is a comma
 * .why = a new element after the last one in a json list turns that line `}` into `},`; any
 *        other removed line means the write reformatted bytes the toggle does not own
 */
const isDiffAnInsertAlone = (input: { diff: string }): boolean => {
  const lines = input.diff.split('\n');
  const removed = lines.filter((line) => /^-/.test(line));
  const added = lines.filter((line) => /^\+/.test(line));
  return removed.every((line) => added.includes(`+${line.slice(1)},`));
};

/**
 * .what = rhachet's own withRepoMutex, so a clamp can hold rhachet's key from outside
 * .why = rhachet's `exports` map hides its lock, so it is loaded by its file path; a rhachet
 *        restructure that moves it fails here by name, never as a bare module fault
 */
const getRhachetRepoMutex = (): (<T>(
  input: { repoPath: string; path: string },
  logic: () => Promise<T>,
) => Promise<T>) => {
  const lockPath = path.join(
    REPO_ROOT,
    'node_modules/rhachet/dist/infra/lock/withRepoMutex.js',
  );
  if (!fs.existsSync(lockPath))
    throw new MalfunctionError(
      'rhachet no longer ships withRepoMutex at the path this clamp loads',
      {
        lockPath,
        hint: 'find where rhachet now keeps withRepoMutex (or its export, per dream v2026_11_07.reseed.rhachet-export-with-repo-mutex), then repoint this clamp and withTermsHookSettingsHold',
      },
    );
  return require(lockPath).withRepoMutex;
};

/**
 * .what = start the toggle as a child while rhachet holds its key on one file, act, then release
 * .why = the two hold clamps share this shape: the child must wait on the key, so what it does
 *        once the key frees is what the clamp reads
 */
const runToggleUnderRhachetHold = async (input: {
  scene: { repo: string; home: string };
  file: string;
  args: string[];
  whileHeld: () => unknown;
  holdMs: number;
}): Promise<{
  whileHeld: unknown;
  stdoutWhileHeld: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
}> => {
  const withRepoMutex = getRhachetRepoMutex();
  const held = await withRepoMutex(
    { repoPath: input.scene.repo, path: input.file },
    async () => {
      const child = spawn('/bin/bash', [WRAPPER, ...input.args], {
        cwd: input.scene.repo,
        env: { ...process.env, HOME: input.scene.home },
      });
      const chunksOut: string[] = [];
      const chunks: string[] = [];
      child.stdout.on('data', (chunk) => chunksOut.push(String(chunk)));
      child.stderr.on('data', (chunk) => chunks.push(String(chunk)));
      const exited = new Promise<number | null>((done) =>
        child.on('close', (code) => done(code)),
      );
      await new Promise((done) => setTimeout(done, input.holdMs));
      return {
        whileHeld: input.whileHeld(),
        stdoutWhileHeld: chunksOut.join(''),
        exited,
        chunksOut,
        chunks,
      };
    },
  );
  // bound the wait: a child that hangs past the release fails loud, never stalls the suite
  let timer: NodeJS.Timeout | undefined; // .note = deliberate mutation, so the bound is cleared
  const exitCode = await Promise.race([
    held.exited,
    new Promise<never>((_, fail) => {
      timer = setTimeout(
        () =>
          fail(
            new MalfunctionError(
              'the toggle did not exit within 60s of the release',
              {
                args: input.args,
                hint: 'a hang here means the hold never freed; read the stderr',
              },
            ),
          ),
        60000,
      );
    }),
  ]).finally(() => clearTimeout(timer));
  return {
    whileHeld: held.whileHeld,
    stdoutWhileHeld: held.stdoutWhileHeld,
    exitCode,
    stdout: held.chunksOut.join(''),
    stderr: held.chunks.join(''),
  };
};

describe('learn.terms.hook.integration', () => {
  given('[case1] a split-layout repo with the learner linked', () => {
    const scene = useBeforeAll(async () =>
      genFixture({ slug: 'terms-hook-case1', layout: 'split' }),
    );

    when('[t0] get runs before any enable', () => {
      const out = useBeforeAll(async () => {
        const before = getSettingsRaw(scene);
        const result = runToggle({ scene, args: ['get'] });
        return { ...result, before, after: getSettingsRaw(scene) };
      });

      then('it exits 0 and reports disabled', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stdout).toContain('status = disabled');
        expect(out.stdout).toContain('rhx learn.terms.hook enable');
      });

      then('the settings file is byte-identical', () => {
        expect(out.after).toEqual(out.before);
      });

      then('the stdout matches the snapshot', () => {
        expect(out.stdout).toMatchSnapshot('get - disabled');
      });
    });

    when('[t1] enable runs', () => {
      const out = useBeforeAll(async () => {
        const before = getSettings({
          repo: scene.repo,
          file: 'settings.of.repo.json',
        });
        const beforeRaw = getSettingsRaw(scene);
        const result = runToggle({ scene, args: ['enable'] });
        const after = getSettings({
          repo: scene.repo,
          file: 'settings.of.repo.json',
        });
        const diff = getLineDiff({
          before: beforeRaw,
          after: getSettingsRaw(scene),
          dir: scene.home,
        });
        return { ...result, before, after, diff };
      });

      then('the file diff is the one hook block alone', () => {
        expect(isDiffAnInsertAlone({ diff: out.diff })).toEqual(true);
        expect(out.diff).toMatchSnapshot('enable - the diff, split layout');
      });

      then('it exits 0 and reports enabled (added)', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stdout).toContain('status = enabled (added)');
      });

      then(
        'the settings hold one guarded term hook under the toggle author',
        () => {
          const found = getTermsHooks({ settings: out.after });
          expect(found).toHaveLength(1);
          expect(found[0]).toMatchObject({
            type: 'command',
            command: TERMS_HOOK_DECLARED.command,
            timeout: TERMS_HOOK_DECLARED.timeoutSeconds,
            author: 'toggle=learn.terms.hook/role=learner',
          });
        },
      );

      then('every other key and hook is unchanged', () => {
        const { hooks: hooksBefore, ...restBefore } = out.before;
        const { hooks: hooksAfter, ...restAfter } = out.after;
        expect(restAfter).toEqual(restBefore);
        expect({ ...hooksAfter, Stop: undefined }).toEqual({
          ...hooksBefore,
          Stop: undefined,
        });
        const stopBefore = hooksBefore?.Stop ?? [];
        expect(stopBefore.length).toBeGreaterThan(0); // the driver's own Stop hooks
        expect(hooksAfter?.Stop?.slice(0, stopBefore.length)).toEqual(
          stopBefore,
        );
      });

      then(
        'the share leaf names a path git can add, past the .claude link',
        () => {
          expect(out.stdout).toContain(`share it: commit ${PATH_TRACKED}`);
          const added = spawnSync('git', ['add', PATH_TRACKED], {
            cwd: scene.repo,
            encoding: 'utf-8',
          });
          expect(added.status).toEqual(0);
          const listed = spawnSync('git', ['ls-files', PATH_TRACKED], {
            cwd: scene.repo,
            encoding: 'utf-8',
          });
          expect(listed.stdout.trim()).toEqual(PATH_TRACKED);
        },
      );

      then('the stdout matches the snapshot', () => {
        expect(out.stdout).toMatchSnapshot('enable - added');
      });
    });

    when('[t2] get runs after enable', () => {
      const out = useBeforeAll(async () => runToggle({ scene, args: ['get'] }));

      then('it reports enabled, the hook, and whose stops it reaches', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stdout).toContain('status = enabled');
        expect(out.stdout).toContain(
          'reaches = sessions enrolled via rhx enroll that hold the learner',
        );
        expect(out.stdout).toContain(
          'plain claude = not reached; with .claude split per actor, it reads no repo settings',
        );
        expect(out.stdout).toContain(
          "takes effect = at each session's next start",
        );
        expect(out.stdout).not.toContain('drift');
      });

      then('the stdout matches the snapshot', () => {
        expect(out.stdout).toMatchSnapshot('get - enabled');
      });
    });

    when('[t3] enable runs again', () => {
      const out = useBeforeAll(async () => {
        const before = getSettingsRaw(scene);
        const result = runToggle({ scene, args: ['enable'] });
        return { ...result, before, after: getSettingsRaw(scene) };
      });

      then('it reports already enabled and writes naught', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stdout).toContain('status = already enabled');
        expect(out.after).toEqual(out.before);
      });

      then('the stdout matches the snapshot', () => {
        expect(out.stdout).toMatchSnapshot('enable - already enabled');
      });
    });

    when('[t4] disable runs', () => {
      const out = useBeforeAll(async () => {
        const result = runToggle({ scene, args: ['disable'] });
        return {
          ...result,
          after: getSettings({
            repo: scene.repo,
            file: 'settings.of.repo.json',
          }),
        };
      });

      then(
        'it reports disabled (removed) and no Stop entry runs the term hook',
        () => {
          expect(out.exitCode).toEqual(0);
          expect(out.stdout).toContain('status = disabled (removed)');
          expect(getTermsHooks({ settings: out.after })).toEqual([]);
        },
      );

      then('the stdout matches the snapshot', () => {
        expect(out.stdout).toMatchSnapshot('disable - removed');
      });
    });

    when('[t5] disable runs again', () => {
      const out = useBeforeAll(async () => {
        const before = getSettingsRaw(scene);
        const result = runToggle({ scene, args: ['disable'] });
        return { ...result, before, after: getSettingsRaw(scene) };
      });

      then('it reports already disabled and writes naught', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stdout).toContain('status = already disabled');
        expect(out.after).toEqual(out.before);
      });

      then('the stdout matches the snapshot', () => {
        expect(out.stdout).toMatchSnapshot('disable - already disabled');
      });
    });

    when('[t6] get runs through the documented entry, rhx', () => {
      // the other steps exec the wrapper; this one proves rhx finds and dispatches the skill
      // in a repo where rhachet linked the learner
      const out = useBeforeAll(async () =>
        run({
          cmd: RHX_BIN,
          args: ['learn.terms.hook', 'get'],
          cwd: scene.repo,
          home: scene.home,
        }),
      );

      then('it exits 0 and reports disabled', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stdout).toContain('📜 learn.terms.hook get');
        expect(out.stdout).toContain('status = disabled');
      });

      then('the stdout matches the snapshot', () => {
        expect(out.stdout).toMatchSnapshot('get - via rhx');
      });
    });
  });

  given('[case2] a repo with the learner linked and no .claude dir', () => {
    // the key derive once realpathed a dir that was not there: enable crashed, exit 1
    const scene = useBeforeAll(async () =>
      genFixture({ slug: 'terms-hook-case2', layout: 'none' }),
    );

    when('[t0] get runs on a repo that never asked (vision case=8)', () => {
      const out = useBeforeAll(async () => ({
        ...runToggle({ scene, args: ['get'] }),
        claudeDirFound: fs.existsSync(path.join(scene.repo, '.claude')),
      }));

      then('it exits 0, disabled, and creates naught', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stdout).toContain('status = disabled');
        expect(out.claudeDirFound).toEqual(false);
      });

      then('the stdout matches the snapshot', () => {
        expect(out.stdout).toMatchSnapshot('get - disabled, no file');
      });
    });

    when('[t1] disable runs', () => {
      const out = useBeforeAll(async () => ({
        ...runToggle({ scene, args: ['disable'] }),
        claudeDirFound: fs.existsSync(path.join(scene.repo, '.claude')),
        locksDirFound: fs.existsSync(
          path.join(scene.repo, '.agent', '.actors', '.locks'),
        ),
      }));

      then('it exits 0, already disabled, and creates naught', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stdout).toContain('status = already disabled');
        expect(out.claudeDirFound).toEqual(false);
      });

      then('the no-op takes no lock, so no lock dir appears', () => {
        expect(out.locksDirFound).toEqual(false);
      });

      then('the stdout matches the snapshot', () => {
        expect(out.stdout).toMatchSnapshot(
          'disable - already disabled, no file',
        );
      });
    });

    when('[t2] enable runs', () => {
      const out = useBeforeAll(async () => {
        const result = runToggle({ scene, args: ['enable'] });
        return {
          ...result,
          after: getSettings({ repo: scene.repo, file: 'settings.json' }),
        };
      });

      then('it exits 0 and reports added', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stderr).toEqual('');
        expect(out.stdout).toContain('status = enabled (added)');
      });

      then('it creates the file with exactly the one declared entry', () => {
        expect(out.after).toEqual({
          hooks: {
            Stop: [
              {
                matcher: '*',
                hooks: [{ ...TERMS_HOOK_DECLARED.hook }],
              },
            ],
          },
        });
      });

      then('the stdout matches the snapshot', () => {
        expect(out.stdout).toMatchSnapshot('enable - added, file created');
      });
    });
  });

  given('[case4] enable over a drifted file', () => {
    const scene = useBeforeAll(async () => {
      const fixture = genFixture({ slug: 'terms-hook-case4', layout: 'old' });
      const file = path.join(fixture.repo, '.claude', 'settings.json');
      const settings: SettingsRead = JSON.parse(fs.readFileSync(file, 'utf-8'));
      fs.writeFileSync(
        file,
        JSON.stringify(
          {
            ...settings,
            hooks: {
              Stop: [
                {
                  matcher: '*',
                  hooks: [
                    {
                      type: 'command',
                      command:
                        './node_modules/.bin/rhx learn.domain.terms --when hook.onStop',
                      timeout: 5,
                      author: 'repo=bhrain/role=learner',
                    },
                    {
                      type: 'command',
                      command:
                        './node_modules/.bin/rhx route.drive --when hook.onStop',
                      timeout: 60,
                      author: 'repo=bhrain/role=driver',
                    },
                  ],
                },
                {
                  matcher: '*',
                  hooks: [
                    {
                      type: 'command',
                      command: TERMS_HOOK_DECLARED.command,
                      timeout: 30,
                      author: TERMS_HOOK_DECLARED.author,
                    },
                  ],
                },
              ],
            },
          },
          null,
          2,
        ),
      );
      return fixture;
    });

    when('[t0] enable runs', () => {
      const out = useBeforeAll(async () => {
        const result = runToggle({ scene, args: ['enable'] });
        return {
          ...result,
          after: getSettings({ repo: scene.repo, file: 'settings.json' }),
        };
      });

      then('it exits 0 and reports updated', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stdout).toContain(
          'status = enabled (updated to the declared entry)',
        );
      });

      then('exactly the one declared entry remains', () => {
        expect(getTermsHooks({ settings: out.after })).toEqual([
          { ...TERMS_HOOK_DECLARED.hook },
        ]);
      });

      then('the peer Stop hook and the other keys are kept', () => {
        const authors = (out.after.hooks?.Stop ?? [])
          .flatMap((block) => block.hooks)
          .map((hook) => hook.author);
        expect(authors.includes('repo=bhrain/role=driver')).toEqual(true);
        expect(out.after.permissions).toEqual({ allow: ['Bash(echo:*)'] });
      });

      then('stdout names the foreign entry it replaced', () => {
        expect(out.stdout).toContain(
          [
            'also removed = an entry the toggle did not write',
            '   │  └─ by repo=bhrain/role=learner',
          ].join('\n'),
        );
      });

      then('the stdout matches the snapshot', () => {
        expect(out.stdout).toMatchSnapshot(
          'enable - updated, a hand copy replaced',
        );
      });
    });

    when('[t1] get runs after the repair', () => {
      const out = useBeforeAll(async () => runToggle({ scene, args: ['get'] }));

      then('it reports enabled with no drift', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stdout).toContain('status = enabled');
        expect(out.stdout).not.toContain('drift');
      });

      then(
        'on the old layout it reaches every session, plain claude too',
        () => {
          expect(out.stdout).toContain(
            'reaches = every claude session in this repo, while the learner is linked',
          );
          expect(out.stdout).not.toContain('plain claude = not reached');
        },
      );

      then('the stdout matches the snapshot', () => {
        expect(out.stdout).toMatchSnapshot('get - enabled, after an update');
      });
    });
  });

  given('[case3] an enabled repo that rhachet re-syncs and derives', () => {
    // the toggle's whole bet: rhachet's per-role sync, orphan prune, and peer-actor derive all
    // leave the entry be for an actor that holds the learner. revert the author to
    // `repo=bhrain/role=learner` and t0 turns red; revert it to a bare toggle author and t1 does
    const scene = useBeforeAll(async () => {
      const fixture = genFixture({ slug: 'terms-hook-case3', layout: 'split' });
      const enable = runToggle({ scene: fixture, args: ['enable'] });
      if (enable.exitCode !== 0)
        throw new MalfunctionError('enable failed in the case3 fixture', {
          stderr: enable.stderr,
          hint: 'run npm run build, then rerun the suite',
        });

      // the control: the same command under the learner's own role author, beside the toggle's
      // entry. rhachet's orphan prune drops every `repo=…/role=…` author no linked role with
      // hooks claims, so this copy must go while the toggle's entry stays
      const file = path.join(fixture.repo, '.claude', 'settings.of.repo.json');
      const settings: SettingsRead = JSON.parse(fs.readFileSync(file, 'utf-8'));
      const settingsWithControl: SettingsRead = {
        ...settings,
        hooks: {
          ...settings.hooks,
          Stop: [
            ...(settings.hooks?.Stop ?? []),
            {
              matcher: '*',
              hooks: [
                {
                  type: 'command',
                  command: TERMS_HOOK_DECLARED.command,
                  timeout: TERMS_HOOK_DECLARED.timeoutSeconds,
                  author: 'repo=bhrain/role=learner',
                },
              ],
            },
          ],
        },
      };
      fs.writeFileSync(file, JSON.stringify(settingsWithControl, null, 2));

      // two peer actors, as `rhx enroll` leaves them on disk: one holds the learner, one not
      const asPeerDir = (hash: string): string =>
        path.join(fixture.repo, '.agent', '.actors', `actor.via.hash=${hash}`);
      for (const [hash, roles] of [
        ['1a1a1a1a', ['learner']],
        ['2b2b2b2b', ['driver']],
      ] as const) {
        fs.mkdirSync(asPeerDir(hash), { recursive: true });
        fs.writeFileSync(
          path.join(asPeerDir(hash), 'actor.json'),
          JSON.stringify({ schemaVersion: 1, brain: 'claude', roles }),
        );
      }
      // a local rhx, as an installed consumer has one, so the derived Stop command can run whole.
      // a shim and not a link: pnpm's own bin shim finds its package from its own dir
      const rhxLocal = path.join(fixture.repo, 'node_modules', '.bin', 'rhx');
      fs.mkdirSync(path.dirname(rhxLocal), { recursive: true });
      fs.writeFileSync(rhxLocal, `#!/bin/sh\nexec "${RHX_BIN}" "$@"\n`, {
        mode: 0o755,
      });

      // the derived settings of one peer, as its sessions read them
      const getPeerSettings = (input: { hash: string }): SettingsRead =>
        JSON.parse(
          fs.readFileSync(
            path.join(
              asPeerDir(input.hash),
              'brain',
              '.claude',
              'settings.of.repo.json',
            ),
            'utf-8',
          ),
        );
      return { ...fixture, asPeerDir, getPeerSettings };
    });

    /**
     * .what = run the Stop command a peer's derived settings hold, as its session's stop does
     * .why = the wish's promise is about sessions: a stale stop is held, a fresh one rests. so
     *        the command is read out of the derived file, never out of the constant
     */
    const runPeerStop = (input: { hash: string }) => {
      const [hook] = getTermsHooks({
        settings: scene.getPeerSettings({ hash: input.hash }),
      });
      if (!hook?.command)
        throw new MalfunctionError('the peer holds no term hook entry to run', {
          hash: input.hash,
          hint: 'case3 [t1] must hold first',
        });
      // bound the run at the hook's own timeout, as claude bounds it: a stop slower than the
      //   bound is killed, so it would rest silent, and the clamp must go red, not green
      return run({
        cmd: '/bin/bash',
        args: ['-c', hook.command],
        cwd: scene.repo,
        home: scene.home,
        timeoutMs: TERMS_HOOK_DECLARED.timeoutSeconds * 1000,
      });
    };

    when(
      '[t0] rhachet init --hooks re-syncs the roles and prunes orphans',
      () => {
        const out = useBeforeAll(async () => {
          const result = run({
            cmd: RHACHET_BIN,
            args: ['init', '--hooks'],
            cwd: scene.repo,
            home: scene.home,
          });
          return {
            ...result,
            after: getSettings({
              repo: scene.repo,
              file: 'settings.of.repo.json',
            }),
            get: runToggle({ scene, args: ['get'] }),
          };
        });

        then('it exits 0', () => {
          expect(out.exitCode).toEqual(0);
        });

        then(
          'the toggle entry survives and the learner-authored control is pruned',
          () => {
            // exactly one left, and it is the toggle's: the same init kept one and dropped the other
            const authors = getTermsHooks({ settings: out.after }).map(
              (hook) => hook.author,
            );
            expect(authors).toEqual(['toggle=learn.terms.hook/role=learner']);
          },
        );

        then('the driver hooks the sync owns are still present', () => {
          const authors = (out.after.hooks?.Stop ?? [])
            .flatMap((block) => block.hooks)
            .map((hook) => hook.author);
          expect(authors.includes('repo=bhrain/role=driver')).toEqual(true);
        });

        then('get still reports enabled', () => {
          expect(out.get.stdout).toContain('status = enabled');
        });

        then('the get stdout matches the snapshot', () => {
          expect(out.get.stdout).toMatchSnapshot(
            'get - enabled, after a re-sync',
          );
        });
      },
    );

    when('[t1] a peer actor that holds the learner is derived', () => {
      const out = useBeforeAll(
        async (): Promise<SettingsRead> =>
          JSON.parse(
            fs.readFileSync(
              path.join(
                scene.asPeerDir('1a1a1a1a'),
                'brain',
                '.claude',
                'settings.of.repo.json',
              ),
              'utf-8',
            ),
          ),
      );

      then('its derived settings hold the term hook entry', () => {
        expect(getTermsHooks({ settings: out })).toHaveLength(1);
      });

      then('the derived term hooks match the snapshot', () => {
        expect(getTermsHooks({ settings: out })).toMatchSnapshot(
          'derived - a peer that holds the learner',
        );
      });
    });

    when('[t2] a peer actor without the learner is derived', () => {
      const out = useBeforeAll(
        async (): Promise<SettingsRead> =>
          JSON.parse(
            fs.readFileSync(
              path.join(
                scene.asPeerDir('2b2b2b2b'),
                'brain',
                '.claude',
                'settings.of.repo.json',
              ),
              'utf-8',
            ),
          ),
      );

      then('its derived settings hold no term hook entry', () => {
        expect(getTermsHooks({ settings: out })).toEqual([]);
      });

      then('the derived term hooks match the snapshot', () => {
        expect(getTermsHooks({ settings: out })).toMatchSnapshot(
          'derived - a peer without the learner',
        );
      });
    });

    when('[t3] the learner peer stops with a stale distillation', () => {
      // the nudge is what the held session sees, so it is snapped here, words only: a copy
      //   edit to the face moves this snap too, and the reviewer of that edit sees it land
      const out = useBeforeAll(async () => ({
        first: runPeerStop({ hash: '1a1a1a1a' }),
        second: runPeerStop({ hash: '1a1a1a1a' }),
      }));

      then('its stop is held, exit 2, with the term nudge', () => {
        expect(out.first.exitCode).toEqual(2);
        expect(out.first.stderr).toContain('time again, to tend the terms');
      });

      then(
        'the hold has no bound: each stop with no fresh distill is held again',
        () => {
          expect(out.second.exitCode).toEqual(2);
          expect(out.second.stderr).toContain('time again, to tend the terms');
        },
      );

      then('the held stop matches the snapshot', () => {
        expect({
          stdout: asAnsiStripped({ text: out.first.stdout }),
          stderr: asAnsiStripped({ text: out.first.stderr }),
        }).toMatchSnapshot('peer stop - stale, held');
      });
    });

    when('[t4] the learner peer stops with a fresh distillation', () => {
      const out = useBeforeAll(async () => {
        const sentinel = path.join(
          scene.repo,
          getDomainTermsPaths().progressPath,
        );
        fs.mkdirSync(path.dirname(sentinel), { recursive: true });
        fs.writeFileSync(
          sentinel,
          '## round\n\nno new terms this round — all names decomposed to sanctioned verbs.',
        );
        return runPeerStop({ hash: '1a1a1a1a' });
      });

      then('its stop rests, exit 0, silent', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stderr).toEqual('');
      });

      then('the rested stop matches the snapshot, an empty frame', () => {
        expect({
          stdout: asAnsiStripped({ text: out.stdout }),
          stderr: asAnsiStripped({ text: out.stderr }),
        }).toMatchSnapshot('peer stop - fresh, rests');
      });
    });

    when('[t5] disable runs, then rhachet re-derives the peers', () => {
      const out = useBeforeAll(async () => {
        const disable = runToggle({ scene, args: ['disable'] });
        const derive = run({
          cmd: RHACHET_BIN,
          args: ['init', '--hooks'],
          cwd: scene.repo,
          home: scene.home,
        });
        return {
          disable,
          derive,
          peer: scene.getPeerSettings({ hash: '1a1a1a1a' }),
        };
      });

      then('both exit 0', () => {
        expect(out.disable.exitCode).toEqual(0);
        expect(out.derive.exitCode).toEqual(0);
      });

      then(
        'the learner peer no longer holds the entry, so no stop runs it',
        () => {
          expect(getTermsHooks({ settings: out.peer })).toEqual([]);
        },
      );

      then('the derived term hooks match the snapshot', () => {
        expect(getTermsHooks({ settings: out.peer })).toMatchSnapshot(
          'derived - a learner peer after disable',
        );
      });
    });
  });

  given('[case5] hand copies of the withdrawn hook and an older body', () => {
    const scene = useBeforeAll(async () => {
      const fixture = genFixture({ slug: 'terms-hook-case5', layout: 'old' });
      const file = path.join(fixture.repo, '.claude', 'settings.json');
      const settings: SettingsRead = JSON.parse(fs.readFileSync(file, 'utf-8'));
      const settingsWithCopies: SettingsRead = {
        ...settings,
        hooks: {
          Stop: [
            {
              matcher: '*',
              hooks: [
                {
                  type: 'command',
                  command:
                    './node_modules/.bin/rhx learn.domain.terms --when hook.onStop',
                  timeout: 5,
                  author: 'repo=bhrain/role=learner',
                },
                {
                  type: 'command',
                  command:
                    './node_modules/.bin/rhx route.drive --when hook.onStop',
                  timeout: 60,
                  author: 'repo=bhrain/role=driver',
                },
              ],
            },
            {
              matcher: '*',
              hooks: [
                {
                  type: 'command',
                  command: TERMS_HOOK_DECLARED.command,
                  timeout: 30,
                  author: 'toggle=learn.terms.hook/role=learner',
                },
              ],
            },
            {
              matcher: '*',
              hooks: [
                {
                  type: 'command',
                  command: 'npx rhx learn.domain.terms --when hook.onStop',
                },
              ],
            },
          ],
        },
      };
      fs.writeFileSync(file, JSON.stringify(settingsWithCopies, null, 2));
      return fixture;
    });

    when('[t0] get runs', () => {
      const out = useBeforeAll(async () => runToggle({ scene, args: ['get'] }));

      then('it reports enabled and names the drift', () => {
        expect(out.stdout).toContain('status = enabled');
        expect(out.stdout).toContain('drift = 3 entries');
      });

      then('the stdout matches the snapshot', () => {
        expect(out.stdout).toMatchSnapshot('get - enabled, with drift');
      });
    });

    when('[t1] disable runs', () => {
      const out = useBeforeAll(async () => {
        const result = runToggle({ scene, args: ['disable'] });
        return {
          ...result,
          after: getSettings({ repo: scene.repo, file: 'settings.json' }),
        };
      });

      then(
        'every copy is removed, by the command, whatever the author or body',
        () => {
          expect(out.exitCode).toEqual(0);
          expect(getTermsHooks({ settings: out.after })).toEqual([]);
        },
      );

      then('the peer Stop hook and the other keys are kept', () => {
        expect(out.after.hooks?.Stop).toEqual([
          {
            matcher: '*',
            hooks: [
              expect.objectContaining({ author: 'repo=bhrain/role=driver' }),
            ],
          },
        ]);
        expect(out.after.permissions).toEqual({ allow: ['Bash(echo:*)'] });
      });

      then(
        'stdout counts the entries the toggle did not write and names each author once, an absent one in words',
        () => {
          expect(out.stdout).toContain(
            [
              'also removed = 2 entries the toggle did not write',
              '   │  ├─ by repo=bhrain/role=learner',
              '   │  └─ with no author',
            ].join('\n'),
          );
        },
      );

      then('the stdout matches the snapshot', () => {
        expect(out.stdout).toMatchSnapshot(
          'disable - removed, a hand copy too',
        );
      });
    });
  });

  given('[case6] a settings target it cannot safely touch', () => {
    when('[t0] the target is a link', () => {
      const out = useBeforeAll(async () => {
        const fixture = genFixture({
          slug: 'terms-hook-case6-link',
          layout: 'none',
        });
        const elsewhere = path.join(fixture.home, 'elsewhere.json');
        fs.writeFileSync(elsewhere, '{}');
        fs.mkdirSync(path.join(fixture.repo, '.claude'), { recursive: true });
        fs.symlinkSync(
          elsewhere,
          path.join(fixture.repo, '.claude', 'settings.of.repo.json'),
        );
        return {
          enable: runToggle({ scene: fixture, args: ['enable'] }),
          disable: runToggle({ scene: fixture, args: ['disable'] }),
          get: runToggle({ scene: fixture, args: ['get'] }),
          elsewhere: fs.readFileSync(elsewhere, 'utf-8'),
        };
      });

      then('each verb exits 2 with the qualified header and the fix', () => {
        for (const result of [out.enable, out.disable, out.get]) {
          expect(result.exitCode).toEqual(2);
          expect(result.stdout).toEqual('');
          expect(result.stderr).toContain(
            '✋ ConstraintError: the settings target is a link',
          );
          expect(result.stderr).toContain(
            'fix: replace the link with a real file',
          );
        }
      });

      then('the file behind the link is untouched', () => {
        expect(out.elsewhere).toEqual('{}');
      });

      then('the stderr of each verb matches the snapshot', () => {
        expect(out.enable.stderr).toMatchSnapshot('enable - refused, a link');
        expect(out.disable.stderr).toMatchSnapshot('disable - refused, a link');
        expect(out.get.stderr).toMatchSnapshot('get - refused, a link');
      });
    });

    when('[t1] the target is not valid json', () => {
      const out = useBeforeAll(async () => {
        const fixture = genFixture({
          slug: 'terms-hook-case6-bad',
          layout: 'none',
        });
        const file = path.join(fixture.repo, '.claude', 'settings.json');
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, '{ "hooks": {}, }');
        return {
          enable: runToggle({ scene: fixture, args: ['enable'] }),
          disable: runToggle({ scene: fixture, args: ['disable'] }),
          get: runToggle({ scene: fixture, args: ['get'] }),
          after: fs.readFileSync(file, 'utf-8'),
        };
      });

      then('each verb exits 2 with the qualified header and the fix', () => {
        for (const result of [out.enable, out.disable, out.get]) {
          expect(result.exitCode).toEqual(2);
          expect(result.stdout).toEqual('');
          expect(result.stderr).toContain(
            '✋ ConstraintError: the settings target is not valid json',
          );
          expect(result.stderr).toContain('├─ parse = ');
          expect(result.stderr).toContain('fix: repair the json, then rerun');
        }
      });

      then('the file is byte-identical', () => {
        expect(out.after).toEqual('{ "hooks": {}, }');
      });

      then('the stderr matches the snapshot', () => {
        expect(out.get.stderr).toMatchSnapshot('get - refused, not valid json');
      });
    });

    when(
      '[t2] the target parses but holds a hooks shape no verb can walk',
      () => {
        const body = '{ "hooks": { "Stop": "x" } }';
        const out = useBeforeAll(async () => {
          const fixture = genFixture({
            slug: 'terms-hook-case6-shape',
            layout: 'none',
          });
          const file = path.join(fixture.repo, '.claude', 'settings.json');
          fs.mkdirSync(path.dirname(file), { recursive: true });
          fs.writeFileSync(file, body);
          return {
            enable: runToggle({ scene: fixture, args: ['enable'] }),
            disable: runToggle({ scene: fixture, args: ['disable'] }),
            get: runToggle({ scene: fixture, args: ['get'] }),
            after: fs.readFileSync(file, 'utf-8'),
          };
        });

        then('each verb refuses with exit 2, never a crash', () => {
          for (const result of [out.enable, out.disable, out.get]) {
            expect(result.exitCode).toEqual(2);
            expect(result.stdout).toEqual('');
            expect(result.stderr).toContain(
              '✋ ConstraintError: the settings target holds a shape learn.terms.hook cannot walk',
            );
            expect(result.stderr).not.toContain('parse = ');
            expect(result.stderr).toContain(
              '├─ found = hooks.Stop is a string, not a list',
            );
          }
        });

        then('the file is byte-identical', () => {
          expect(out.after).toEqual(body);
        });

        then('the stderr matches the snapshot', () => {
          expect(out.enable.stderr).toMatchSnapshot(
            'enable - refused, a hooks shape no verb can walk',
          );
        });
      },
    );

    when('[t3] the target is a dir', () => {
      const out = useBeforeAll(async () => {
        const fixture = genFixture({
          slug: 'terms-hook-case6-dir',
          layout: 'none',
        });
        fs.mkdirSync(path.join(fixture.repo, '.claude', 'settings.json'), {
          recursive: true,
        });
        return {
          enable: runToggle({ scene: fixture, args: ['enable'] }),
          disable: runToggle({ scene: fixture, args: ['disable'] }),
          get: runToggle({ scene: fixture, args: ['get'] }),
        };
      });

      then('each verb refuses with exit 2, never a crash', () => {
        for (const result of [out.enable, out.disable, out.get]) {
          expect(result.exitCode).toEqual(2);
          expect(result.stdout).toEqual('');
          expect(result.stderr).toContain(
            '✋ ConstraintError: the settings target is a dir',
          );
        }
      });

      then('the stderr matches the snapshot', () => {
        expect(out.get.stderr).toMatchSnapshot('get - refused, a dir');
      });
    });

    when('[t4] .claude links to a dir outside the repo', () => {
      const out = useBeforeAll(async () => {
        const fixture = genFixture({
          slug: 'terms-hook-case6-outside',
          layout: 'none',
        });
        const outside = path.join(fixture.home, 'claude-outside');
        fs.mkdirSync(outside, { recursive: true });
        fs.symlinkSync(outside, path.join(fixture.repo, '.claude'));
        return {
          enable: runToggle({ scene: fixture, args: ['enable'] }),
          disable: runToggle({ scene: fixture, args: ['disable'] }),
          get: runToggle({ scene: fixture, args: ['get'] }),
          outsideEntries: fs.readdirSync(outside),
        };
      });

      then('each verb refuses with exit 2', () => {
        for (const result of [out.enable, out.disable, out.get]) {
          expect(result.exitCode).toEqual(2);
          expect(result.stdout).toEqual('');
          expect(result.stderr).toContain(
            '✋ ConstraintError: the settings target resolves outside the repo',
          );
        }
      });

      then('naught is written outside the repo', () => {
        expect(out.outsideEntries).toEqual([]);
      });

      then('the stderr matches the snapshot', () => {
        expect(out.enable.stderr).toMatchSnapshot(
          'enable - refused, a target outside the repo',
        );
      });
    });
  });

  given('[case7] a bad verb', () => {
    const scene = useBeforeAll(async () =>
      genFixture({ slug: 'terms-hook-case7', layout: 'none' }),
    );

    when('[t0] an unknown verb, no verb, two verbs, and --help run', () => {
      const out = useBeforeAll(async () => ({
        unknown: runToggle({ scene, args: ['on'] }),
        absent: runToggle({ scene, args: [] }),
        extra: runToggle({ scene, args: ['get', 'enable'] }),
        flagged: runToggle({ scene, args: ['enable', '--mode', 'apply'] }),
        help: runToggle({ scene, args: ['--help'] }),
        helpShort: runToggle({ scene, args: ['-h'] }),
        helpOfVerb: runToggle({ scene, args: ['enable', '--help'] }),
        claudeDirFound: fs.existsSync(path.join(scene.repo, '.claude')),
      }));

      then('no refusal prints to stdout', () => {
        for (const result of [out.unknown, out.absent, out.extra, out.flagged])
          expect(result.stdout).toEqual('');
      });

      then(
        '-h and a verb with --help each print the same help, and write naught',
        () => {
          for (const result of [out.helpShort, out.helpOfVerb]) {
            expect(result.exitCode).toEqual(0);
            expect(result.stdout).toEqual(out.help.stdout);
          }
          expect(out.claudeDirFound).toEqual(false);
        },
      );

      then('an unknown verb exits 2 and names the three verbs', () => {
        expect(out.unknown.exitCode).toEqual(2);
        expect(out.unknown.stderr).toContain(
          '✋ ConstraintError: unknown verb `on`',
        );
        for (const verb of ['get', 'enable', 'disable'])
          expect(out.unknown.stderr).toContain(verb);
      });

      then('no verb exits 2 and names that no verb was given', () => {
        expect(out.absent.exitCode).toEqual(2);
        expect(out.absent.stderr).toContain(
          '✋ ConstraintError: no verb given',
        );
      });

      then('two verbs exit 2 and name the extra args', () => {
        expect(out.extra.exitCode).toEqual(2);
        expect(out.extra.stderr).toContain(
          '✋ ConstraintError: unexpected arg(s): get enable',
        );
        expect(out.extra.stderr).toContain('help: rhx learn.terms.hook --help');
      });

      then(
        'a verb with a flag it does not take exits 2 and writes naught',
        () => {
          expect(out.flagged.exitCode).toEqual(2);
          expect(out.flagged.stderr).toContain(
            '✋ ConstraintError: unexpected arg(s): enable --mode apply',
          );
        },
      );

      then('no refusal writes a file', () => {
        expect(out.claudeDirFound).toEqual(false);
      });

      then('--help exits 0 with usage, the verbs, and the default', () => {
        expect(out.help.exitCode).toEqual(0);
        expect(out.help.stdout).toContain(
          'usage = rhx learn.terms.hook <verb>',
        );
        expect(out.help.stdout).toContain('default = disabled');
      });

      then('the outputs match the snapshot', () => {
        expect(out.unknown.stderr).toMatchSnapshot('unknown verb');
        expect(out.absent.stderr).toMatchSnapshot('no verb given');
        expect(out.extra.stderr).toMatchSnapshot('unexpected args');
        expect(out.flagged.stderr).toMatchSnapshot(
          'unexpected args, a verb with a flag',
        );
        expect(out.help.stdout).toMatchSnapshot('help');
      });
    });
  });

  given('[case9] the hook command, once the learner is unlinked', () => {
    // the guard keeps a leftover entry free: drop it from the command and t0 turns red
    const scene = useBeforeAll(async () => ({
      repo: genTempDir({ slug: 'terms-hook-case9', git: true }),
    }));

    when('[t0] the command runs with no learner link and no rhx', () => {
      const out = useBeforeAll(async () =>
        spawnSync('/bin/bash', ['-c', TERMS_HOOK_DECLARED.command], {
          cwd: scene.repo,
          encoding: 'utf-8',
        }),
      );

      then(
        'it exits 0 with no stderr, so the stop is neither held nor errored',
        () => {
          expect(out.status).toEqual(0);
          expect(out.stderr).toEqual('');
        },
      );

      then('the quiet stop matches the snapshot, an empty frame', () => {
        expect({ stdout: out.stdout, stderr: out.stderr }).toMatchSnapshot(
          'hook command - no learner link, quiet',
        );
      });
    });

    when('[t1] the learner link is present', () => {
      // a stub rhx that names its own args stands in for the face, so the snap shows what the
      //   guard let through, and a guard that blocked would leave the stub unreached
      const out = useBeforeAll(async () => {
        fs.mkdirSync(
          path.join(scene.repo, '.agent', 'repo=bhrain', 'role=learner'),
          { recursive: true },
        );
        const stub = path.join(scene.repo, 'node_modules', '.bin', 'rhx');
        fs.mkdirSync(path.dirname(stub), { recursive: true });
        fs.writeFileSync(
          stub,
          '#!/usr/bin/env bash\necho "rhx reached: $*"\n',
          { mode: 0o755 },
        );
        return spawnSync('/bin/bash', ['-c', TERMS_HOOK_DECLARED.command], {
          cwd: scene.repo,
          encoding: 'utf-8',
        });
      });

      then('the guard passes through to the term hook face', () => {
        expect(out.status).toEqual(0);
        expect(out.stdout).toEqual(
          'rhx reached: learn.domain.terms --when hook.onStop\n',
        );
        expect(out.stderr).toEqual('');
      });

      then('the pass-through matches the snapshot', () => {
        expect({ stdout: out.stdout, stderr: out.stderr }).toMatchSnapshot(
          'hook command - the guard passes through',
        );
      });
    });
  });

  given(
    '[case10] a toggle while rhachet holds its own lock on the settings file',
    () => {
      // the toggle must take turns with rhachet's settings writers. hold rhachet's own
      // withRepoMutex on the file from outside, and assert the toggle waits for its release
      const scene = useBeforeAll(async () =>
        genFixture({ slug: 'terms-hook-case10', layout: 'split' }),
      );

      when(
        '[t0] enable starts while the key is held, then the hold ends',
        () => {
          const out = useBeforeAll(async () => {
            const held = await runToggleUnderRhachetHold({
              scene,
              file: path.join(scene.repo, '.claude', 'settings.of.repo.json'),
              args: ['enable'],
              whileHeld: () =>
                getTermsHooks({
                  settings: getSettings({
                    repo: scene.repo,
                    file: 'settings.of.repo.json',
                  }),
                }).length,
              holdMs: 4000,
            });
            return {
              foundWhileHeld: held.whileHeld,
              stdoutWhileHeld: held.stdoutWhileHeld,
              exitCode: held.exitCode,
              stdout: held.stdout,
              stderr: held.stderr,
              foundAfter: getTermsHooks({
                settings: getSettings({
                  repo: scene.repo,
                  file: 'settings.of.repo.json',
                }),
              }).length,
            };
          });

          then('the toggle writes naught while rhachet holds the key', () => {
            expect(out.foundWhileHeld).toEqual(0);
          });

          then('the toggle prints naught to stdout while it waits', () => {
            expect(out.stdoutWhileHeld).toEqual('');
          });

          then('stderr says, once, that it waits on another writer', () => {
            expect(out.stderr).toEqual(
              '⏳ another settings write holds .claude/settings.of.repo.json; learn.terms.hook waits for it, up to 2 min\n',
            );
          });

          then('the toggle writes once the hold ends', () => {
            expect(out.exitCode).toEqual(0);
            expect(out.foundAfter).toEqual(1);
            expect(out.stdout).toContain('status = enabled (added)');
          });

          then('the frame after the release matches the snapshot', () => {
            expect({ stdout: out.stdout, stderr: out.stderr }).toMatchSnapshot(
              'enable - after the rhachet hold ends',
            );
          });
        },
      );
    },
  );

  given('[case12] enable on a file a human formatted', () => {
    // four-space indent and no trailer newline: a write in rhachet's own form would reformat
    // every line, and the hook block would hide inside it
    const scene = useBeforeAll(async () => {
      const fixture = genFixture({ slug: 'terms-hook-case12', layout: 'old' });
      const file = path.join(fixture.repo, '.claude', 'settings.json');
      fs.writeFileSync(
        file,
        JSON.stringify(
          { permissions: { allow: ['Bash(echo:*)'] }, env: { A: '1' } },
          null,
          4,
        ),
      );
      return { ...fixture, file };
    });

    when('[t0] enable runs', () => {
      const out = useBeforeAll(async () => {
        const before = fs.readFileSync(scene.file, 'utf-8');
        const result = runToggle({ scene, args: ['enable'] });
        const after = fs.readFileSync(scene.file, 'utf-8');
        return {
          ...result,
          after,
          diff: getLineDiff({ before, after, dir: scene.home }),
        };
      });

      then('it exits 0 and reports added', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stdout).toContain('status = enabled (added)');
      });

      then(
        'the diff only inserts the hook block, in the form the file had',
        () => {
          expect(isDiffAnInsertAlone({ diff: out.diff })).toEqual(true);
          expect(out.after).toContain('\n    "hooks": {');
          expect(out.after.endsWith('\n')).toEqual(false);
        },
      );

      then('the diff matches the snapshot', () => {
        expect(out.diff).toMatchSnapshot(
          'enable - the diff, a hand-formatted file',
        );
      });
    });
  });

  given('[case13] two enables run at once', () => {
    // both may pass the lock-free look before either writes, so the second must settle as a
    // no-op under the hold. without the re-read under the hold, a run whose look overlapped
    // the other's would report `updated` over a write it did not make
    const scene = useBeforeAll(async () =>
      genFixture({ slug: 'terms-hook-case13', layout: 'split' }),
    );

    when('[t0] two enables start together', () => {
      const out = useBeforeAll(async () => {
        const runs = await Promise.all([
          runToggleChild({ scene, args: ['enable'] }),
          runToggleChild({ scene, args: ['enable'] }),
        ]);
        return {
          runs,
          found: getTermsHooks({
            settings: getSettings({
              repo: scene.repo,
              file: 'settings.of.repo.json',
            }),
          }).length,
        };
      });

      then('both exit 0', () => {
        expect(out.runs.map((one) => one.exitCode)).toEqual([0, 0]);
      });

      then(
        'one adds the entry and the other settles as already enabled',
        () => {
          const statuses = out.runs
            .map((one) =>
              one.stdout.includes('status = enabled (added)')
                ? 'added'
                : one.stdout.includes('status = already enabled')
                  ? 'already'
                  : 'other',
            )
            .sort();
          expect(statuses).toEqual(['added', 'already']);
        },
      );

      then('the file holds exactly one entry', () => {
        expect(out.found).toEqual(1);
      });

      then('the two frames match the snapshot, in a fixed order', () => {
        // which run wins the key varies per run, so the frames are sorted before the snap
        const frames = out.runs.map((one) => one.stdout).sort();
        expect(frames).toMatchSnapshot('enable - two at once, one adds');
      });
    });
  });

  given(
    '[case14] one hand copy of the withdrawn hook, and no declared entry',
    () => {
      // the drift leaf reads `an entry` for one and `N entries` for more; case5 drives the
      //   plural, so this case drives the singular through the cli
      const scene = useBeforeAll(async () => {
        const fixture = genFixture({
          slug: 'terms-hook-case14',
          layout: 'old',
        });
        const file = path.join(fixture.repo, '.claude', 'settings.json');
        const settings: SettingsRead = JSON.parse(
          fs.readFileSync(file, 'utf-8'),
        );
        fs.writeFileSync(
          file,
          JSON.stringify(
            {
              ...settings,
              hooks: {
                Stop: [
                  {
                    matcher: '*',
                    hooks: [
                      {
                        type: 'command',
                        command:
                          './node_modules/.bin/rhx learn.domain.terms --when hook.onStop',
                        timeout: 5,
                        author: 'repo=bhrain/role=learner',
                      },
                    ],
                  },
                ],
              },
            },
            null,
            2,
          ),
        );
        return fixture;
      });

      when('[t0] get runs', () => {
        const out = useBeforeAll(async () =>
          runToggle({ scene, args: ['get'] }),
        );

        then('it reports enabled, with a drift of one entry', () => {
          expect(out.exitCode).toEqual(0);
          expect(out.stdout).toContain('status = enabled');
          expect(out.stdout).toContain('drift = an entry to replace or remove');
        });

        then('the stdout matches the snapshot', () => {
          expect(out.stdout).toMatchSnapshot('get - enabled, a drift of one');
        });
      });
    },
  );

  given("[case15] the toggle's own entry, with an older body", () => {
    const scene = useBeforeAll(async () => {
      const fixture = genFixture({ slug: 'terms-hook-case15', layout: 'old' });
      const file = path.join(fixture.repo, '.claude', 'settings.json');
      const settings: SettingsRead = JSON.parse(fs.readFileSync(file, 'utf-8'));
      fs.writeFileSync(
        file,
        JSON.stringify(
          {
            ...settings,
            hooks: {
              Stop: [
                {
                  matcher: '*',
                  hooks: [{ ...TERMS_HOOK_DECLARED.hook, timeout: 30 }],
                },
              ],
            },
          },
          null,
          2,
        ),
      );
      return fixture;
    });

    when('[t0] enable runs', () => {
      const out = useBeforeAll(async () => {
        const result = runToggle({ scene, args: ['enable'] });
        return {
          ...result,
          after: getSettings({ repo: scene.repo, file: 'settings.json' }),
        };
      });

      then('it exits 0, reports updated, and names no foreign author', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stdout).toContain(
          'status = enabled (updated to the declared entry)',
        );
        expect(out.stdout).not.toContain('also removed');
      });

      then('the entry is rewritten in place to the declared body', () => {
        expect(getTermsHooks({ settings: out.after })).toEqual([
          { ...TERMS_HOOK_DECLARED.hook },
        ]);
      });

      then('the stdout matches the snapshot', () => {
        expect(out.stdout).toMatchSnapshot(
          'enable - updated, its own older body',
        );
      });
    });
  });

  given('[case16] a settings file the caller may not read', () => {
    // a denied read is a state the caller fixes with a chmod, so it is refused by name, exit 2,
    //   with that fix; a raw EACCES stack would name the fault and never the cure
    const scene = useBeforeAll(async () => {
      const fixture = genFixture({ slug: 'terms-hook-case16', layout: 'old' });
      fs.chmodSync(path.join(fixture.repo, '.claude', 'settings.json'), 0o000);
      return fixture;
    });

    when('[t0] get runs', () => {
      const out = useBeforeAll(async () => runToggle({ scene, args: ['get'] }));

      then('it refuses with exit 2 and names the chmod that fixes it', () => {
        expect(out.exitCode).toEqual(2);
        expect(out.stderr).toContain(
          '✋ ConstraintError: the settings target cannot be read, so learn.terms.hook will not read or rewrite it',
        );
        expect(out.stderr).toContain(
          'fix: grant read and write on it (chmod u+rw .claude/settings.json), then rerun the command',
        );
      });

      then('it prints naught on stdout', () => {
        expect(out.stdout).toEqual('');
      });

      then('the stderr matches the snapshot', () => {
        expect(out.stderr).toMatchSnapshot('get - refused, an unreadable file');
      });
    });
  });

  given('[case11] the layout splits while the toggle waits on the key', () => {
    // the toggle picks the target to choose its key, then picks it again under the hold.
    // drop the re-pick and t0 turns red: the write lands on the old file rhachet no longer reads
    const scene = useBeforeAll(async () =>
      genFixture({ slug: 'terms-hook-case11', layout: 'old' }),
    );

    when(
      '[t0] enable waits on the old-layout key, and the split file appears',
      () => {
        const out = useBeforeAll(async () => {
          const fileOld = path.join(scene.repo, '.claude', 'settings.json');
          const fileSplit = path.join(
            scene.repo,
            '.claude',
            'settings.of.repo.json',
          );
          const before = fs.readFileSync(fileOld, 'utf-8');
          const held = await runToggleUnderRhachetHold({
            scene,
            file: fileOld,
            args: ['enable'],
            whileHeld: () => fs.writeFileSync(fileSplit, '{}'),
            holdMs: 4000,
          });
          return {
            ...held,
            before,
            afterOld: fs.readFileSync(fileOld, 'utf-8'),
            afterSplit: fs.readFileSync(fileSplit, 'utf-8'),
          };
        });

        then('it refuses with exit 2 and names the layout change', () => {
          expect(out.exitCode).toEqual(2);
          expect(out.stderr).toContain(
            '✋ ConstraintError: the settings file moved to a new path while learn.terms.hook waited, so it changed no file',
          );
          expect(out.stderr).toContain(
            'fix: rerun the command; it will write the new path',
          );
        });

        then('neither file is written', () => {
          expect(out.afterOld).toEqual(out.before);
          expect(out.afterSplit).toEqual('{}');
        });

        then('the stderr matches the snapshot', () => {
          expect(out.stderr).toMatchSnapshot(
            'enable - refused, the layout changed under the hold',
          );
        });
      },
    );
  });

  given('[case18] a .claude that is a plain file, not a dir', () => {
    // no refusal names this state, so a write under it faults in the fs and surfaces as a
    //   malfunction, exit 1, under the qualified header the wrapper renders
    const scene = useBeforeAll(async () => {
      const fixture = genFixture({ slug: 'terms-hook-case18', layout: 'none' });
      fs.writeFileSync(path.join(fixture.repo, '.claude'), 'not a dir');
      return fixture;
    });

    when('[t0] enable runs', () => {
      const out = useBeforeAll(async () => ({
        ...runToggle({ scene, args: ['enable'] }),
        after: fs.readFileSync(path.join(scene.repo, '.claude'), 'utf-8'),
      }));

      then('it exits 1 under the malfunction header, stdout empty', () => {
        expect(out.exitCode).toEqual(1);
        expect(out.stderr.startsWith('💥 MalfunctionError: ')).toEqual(true);
        expect(out.stdout).toEqual('');
      });

      then('the plain file is untouched', () => {
        expect(out.after).toEqual('not a dir');
      });

      then(
        'the header line matches the snapshot; the stack beneath carries host paths',
        () => {
          const header = (out.stderr.split('\n')[0] ?? '')
            .split(fs.realpathSync(scene.repo))
            .join('$REPO')
            .split(scene.repo)
            .join('$REPO');
          expect(header).toMatchSnapshot(
            'enable - malfunction, .claude is a plain file',
          );
        },
      );
    });
  });

  given('[case17] a toggle that waits past its bound on rhachet’s key', () => {
    // the toggle's wait bound is two minutes, with no seam, so the clamp holds rhachet's key
    //   from outside for longer than that. rhachet's own lease (five minutes) outlives the wait,
    //   so the hold stands the whole time and the toggle's acquire times out for real
    // .note = this one hold runs past the file's 90s default, so the bound is raised here
    jest.setTimeout(240000);
    const scene = useBeforeAll(async () =>
      genFixture({ slug: 'terms-hook-case17', layout: 'split' }),
    );

    when('[t0] enable runs while the key stays held past the wait', () => {
      const out = useBeforeAll(async () => {
        const file = path.join(scene.repo, '.claude', 'settings.of.repo.json');
        const before = fs.readFileSync(file, 'utf-8');
        const held = await runToggleUnderRhachetHold({
          scene,
          file,
          args: ['enable'],
          whileHeld: () => undefined,
          holdMs: 130000,
        });
        return { ...held, before, after: fs.readFileSync(file, 'utf-8') };
      });

      then('it refuses with exit 2 and names the busy file', () => {
        expect(out.exitCode).toEqual(2);
        expect(out.stderr).toContain(
          '✋ ConstraintError: another process held the settings file past a 2 min wait, so learn.terms.hook changed no file',
        );
        expect(out.stderr).toContain(
          'settings = .claude/settings.of.repo.json',
        );
      });

      then('it prints naught on stdout and writes naught', () => {
        expect(out.stdout).toEqual('');
        expect(out.after).toEqual(out.before);
      });

      then('the stderr matches the snapshot', () => {
        expect(out.stderr).toMatchSnapshot(
          'enable - refused, the settings file stays held',
        );
      });
    });
  });
});
