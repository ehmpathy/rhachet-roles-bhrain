import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

/**
 * .what = acceptance coverage for the `gen.consumer-patch` skill's hermetic paths, through
 *         the entrypoint a human types
 * .why = its help and each refusal are contract surfaces a human meets; each is clamped and
 *        snapped so drift in the text or the exit code is visible in review
 *
 * .note = every case past the hermetic refusals calls the real npm registry and the
 *         published 0.42.1 base. the happy path runs over a one-file `dist/`, so its patch is
 *         small and stable. `no patch owed` runs over an empty `dist/` whose exports equal the
 *         base's. the four malfunction rows (integrity mismatch, a `git diff` fault, a patch
 *         that does not apply, a base download fault) are driven by a PATH shim that faults
 *         one call of `openssl`, `git`, or `node` and passes every other call to the real binary
 *
 * .note = a stated carve-out of rule.forbid.cwd-outside-gitroot: the skill is invoked by
 *         absolute path, so no resolution rides the cwd. the temp cwd isolates `dist/`
 */
const SKILL = path.join(
  __dirname,
  '..',
  '.agent/repo=.this/role=any/skills/gen.consumer-patch.sh',
);

const runSkill = (input: {
  cwd: string;
  args: string[];
  shimDir: string | null;
}): { stdout: string; stderr: string; exitCode: number } => {
  const result = spawnSync('bash', [SKILL, ...input.args], {
    cwd: input.cwd,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: input.shimDir
      ? { ...process.env, PATH: `${input.shimDir}:${process.env.PATH}` }
      : process.env,
  });
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    exitCode: result.status ?? 1,
  };
};

/**
 * .what = the refusals the skill owes before any network call, one per row
 */
const REFUSALS: { slug: string; args: string[]; stderr: string }[] = [
  {
    slug: 'unknown-arg',
    args: ['--bogus'],
    stderr: "✋ ConstraintError: unknown arg '--bogus'",
  },
  {
    slug: 'from-without-value',
    args: ['--from'],
    stderr: '✋ ConstraintError: --from needs a value',
  },
  {
    slug: 'into-without-value',
    args: ['--from', '0.42.1', '--into'],
    stderr: '✋ ConstraintError: --into needs a value',
  },
  {
    slug: 'from-absent',
    args: ['--into', 'out.patch'],
    stderr: '✋ ConstraintError: --from <published version> is required',
  },
  {
    slug: 'from-not-semver',
    args: ['--from', '../../escape', '--into', 'out.patch'],
    stderr: '✋ ConstraintError: --from must be a semver version, e.g. 0.42.1',
  },
  {
    slug: 'into-absent',
    args: ['--from', '0.42.1'],
    stderr: '✋ ConstraintError: --into <path>.patch is required',
  },
  {
    slug: 'dist-absent',
    args: ['--from', '0.42.1', '--into', 'out.patch'],
    stderr: '✋ ConstraintError: no dist/ here; run npm run build first',
  },
];

/**
 * .what = the malfunction rows, each driven by a shim that faults one call of one binary
 * .why = each row is a surface a caller can meet; the shim reaches it with no corrupt
 *        registry and no broken git
 */
const MALFUNCTIONS: {
  slug: string;
  bin: string;
  faultWhen: string;
  stderr: string;
}[] = [
  {
    slug: 'integrity-mismatch',
    bin: 'openssl',
    // the digest of the fetched tarball reads as bytes the registry never published
    faultWhen: '[[ "$1" == dgst ]] && { printf not-the-published-tarball; exit 0; }',
    stderr:
      '💥 MalfunctionError: the fetched tarball is not rhachet-roles-bhrain@0.42.1 (integrity mismatch)',
  },
  {
    slug: 'git-diff-fault',
    bin: 'git',
    // the skill runs `git -C <dir> diff`, so the subcommand sits third
    faultWhen: '[[ "$3" == diff ]] && exit 128',
    stderr: '💥 MalfunctionError: git diff failed (exit 128)',
  },
  {
    slug: 'patch-not-applicable',
    bin: 'git',
    faultWhen: '[[ "$3" == apply ]] && exit 1',
    stderr:
      '💥 MalfunctionError: the patch does not apply to rhachet-roles-bhrain@0.42.1',
  },
  {
    slug: 'base-fetch-fault',
    bin: 'node',
    // the download call alone has its url swapped for one no server answers (port 9, the
    // discard port, refused on loopback); the real node then runs the skill's own fetch and
    // its own catch. `npm` is not shimmed: a host may define it as an exported function,
    // which outranks PATH
    faultWhen:
      '[[ "$1" == -e && "$2" == *AbortSignal* ]] && set -- "$1" "$2" http://127.0.0.1:9/base.tgz "$4"',
    stderr:
      '💥 MalfunctionError: fetch http://127.0.0.1:9/base.tgz failed: fetch failed',
  },
];

describe('gen.consumer-patch.acceptance', () => {
  given('[case1] a human who asks the skill to explain itself', () => {
    const ran = useBeforeAll(async () =>
      runSkill({
        cwd: fs.realpathSync(genTempDir({ slug: 'consumer-patch-help' })),
        args: ['--help'],
        shimDir: null,
      }),
    );

    when('[t0] --help is passed', () => {
      then('it exits 0 and names the usage', () => {
        expect(ran.exitCode).toEqual(0);
        expect(ran.stdout).toContain('rhx gen.consumer-patch --from');
      });

      then('the usage renders whole', () => {
        expect(ran.stdout).toMatchSnapshot();
      });
    });
  });

  REFUSALS.map((refusal, index) =>
    given(`[case${index + 2}] a call refused for ${refusal.slug}`, () => {
      const ran = useBeforeAll(async () =>
        runSkill({
          cwd: fs.realpathSync(
            genTempDir({ slug: `consumer-patch-${refusal.slug}` }),
          ),
          args: refusal.args,
          shimDir: null,
        }),
      );

      when(`[t0] the skill runs with ${refusal.args.join(' ')}`, () => {
        then('it exits 2 with the constraint, and writes no stdout', () => {
          expect(ran.exitCode).toEqual(2);
          expect(ran.stderr.trim()).toEqual(refusal.stderr);
          expect(ran.stdout).toEqual('');
        });

        then('the refusal matches its snapshot', () => {
          expect(ran.stderr).toMatchSnapshot();
        });
      });
    }),
  );

  given('[case9] a version the registry never published', () => {
    const ran = useBeforeAll(async () =>
      runSkill({
        cwd: genPackageDir({ slug: 'consumer-patch-unpublished' }),
        args: ['--from', '0.0.0-never-published', '--into', 'out.patch'],
        shimDir: null,
      }),
    );

    when('[t0] the skill asks the registry for the base', () => {
      then('it exits 2 with the constraint, and writes no stdout', () => {
        expect(ran.exitCode).toEqual(2);
        expect(ran.stderr).toContain(
          '✋ ConstraintError: rhachet-roles-bhrain@0.0.0-never-published is not published',
        );
        expect(ran.stdout).toEqual('');
      });

      then('the refusal leads stderr, with no npm line ahead of it', () => {
        expect(ran.stderr.split('\n')[0]).toEqual(
          '✋ ConstraintError: rhachet-roles-bhrain@0.0.0-never-published is not published',
        );
        expect(ran.stderr).toContain('   └─ cause: npm view returned E404');
      });

      then('the refusal matches its snapshot', () => {
        expect(ran.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case10] a local build that differs from the published base', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genPackageDir({ slug: 'consumer-patch-success' });
      const ran = runSkill({
        cwd,
        args: ['--from', '0.42.1', '--into', 'out.patch'],
        shimDir: null,
      });
      return { cwd, ran };
    });

    when('[t0] the skill writes the patch', () => {
      then('it exits 0 with no stderr', () => {
        expect(scene.ran.exitCode).toEqual(0);
        expect(scene.ran.stderr).toEqual('');
      });

      then('the patch carries the overlaid file and the lifted exports', () => {
        const patch = fs.readFileSync(path.join(scene.cwd, 'out.patch'), 'utf-8');
        expect(patch).toContain('diff --git a/dist/index.js b/dist/index.js');
        expect(patch).toContain('+// the local build');
        expect(patch).toContain('diff --git a/package.json b/package.json');
      });

      then(
        'it names the init re-run, since a patch never changes the settings that call it',
        () => {
          expect(scene.ran.stdout).toContain(
            'npx rhachet roles init --repo bhrain --role driver',
          );
        },
      );

      then('the success tree matches its snapshot', () => {
        expect(scene.ran.stdout).toMatchSnapshot();
      });

      then('the patch itself, the deliverable, matches its snapshot', () => {
        // the base is the immutable published 0.42.1 and the build is one fixed file, so the
        // patch bytes are the same on every run
        expect(
          fs.readFileSync(path.join(scene.cwd, 'out.patch'), 'utf-8'),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case10b] a local build that changed a role asset', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genPackageDir({ slug: 'consumer-patch-asset' });
      fs.mkdirSync(path.join(cwd, 'dist', ASSET_PATH_DIR), { recursive: true });
      fs.writeFileSync(
        path.join(cwd, 'dist', ASSET_PATH_DIR, ASSET_PATH_NAME),
        '// the local build changed this init\n{}\n',
      );
      const ran = runSkill({
        cwd,
        args: ['--from', '0.42.1', '--into', 'out.patch'],
        shimDir: null,
      });
      return { cwd, ran };
    });

    when('[t0] the skill writes the patch', () => {
      then('it exits 0 with no stderr', () => {
        expect(scene.ran.exitCode).toEqual(0);
        expect(scene.ran.stderr).toEqual('');
      });

      then('the patch leaves the asset out, since pnpm cannot edit a read-only file', () => {
        const patch = fs.readFileSync(path.join(scene.cwd, 'out.patch'), 'utf-8');
        expect(patch).not.toContain(ASSET_PATH_NAME);
        expect(patch).toContain('diff --git a/dist/index.js b/dist/index.js');
      });

      then('the tree names the asset left out, and what an init then reads', () => {
        expect(scene.ran.stdout).toContain(
          `   │  └─ dist/${ASSET_PATH_DIR}/${ASSET_PATH_NAME}`,
        );
        expect(scene.ran.stdout).toContain(
          'an init reads the assets left out above in their old form, until the release',
        );
      });

      then('the success tree matches its snapshot', () => {
        expect(scene.ran.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case11] a local build equal to the published base', () => {
    const ran = useBeforeAll(async () =>
      runSkill({
        cwd: genPackageDirEqualToBase({ slug: 'consumer-patch-equal' }),
        args: ['--from', '0.42.1', '--into', 'out.patch'],
        shimDir: null,
      }),
    );

    when('[t0] the skill diffs the build against the base', () => {
      then('it exits 2 with the constraint, and writes no stdout', () => {
        expect(ran.exitCode).toEqual(2);
        expect(ran.stderr.trim()).toEqual(
          '✋ ConstraintError: the local build equals rhachet-roles-bhrain@0.42.1; no patch owed',
        );
        expect(ran.stdout).toEqual('');
      });

      then('the refusal matches its snapshot', () => {
        expect(ran.stderr).toMatchSnapshot();
      });
    });
  });

  MALFUNCTIONS.map((malfunction, index) =>
    given(`[case${index + 12}] a malfunction: ${malfunction.slug}`, () => {
      const ran = useBeforeAll(async () =>
        runSkill({
          cwd: genPackageDir({ slug: `consumer-patch-${malfunction.slug}` }),
          args: ['--from', '0.42.1', '--into', 'out.patch'],
          shimDir: genShimDir({
            slug: malfunction.slug,
            bin: malfunction.bin,
            faultWhen: malfunction.faultWhen,
          }),
        }),
      );

      when(`[t0] the shimmed ${malfunction.bin} faults one call`, () => {
        then('it exits 1 with the malfunction, and writes no stdout', () => {
          expect(ran.exitCode).toEqual(1);
          expect(ran.stderr.trim()).toEqual(malfunction.stderr);
          expect(ran.stdout).toEqual('');
        });

        then('the malfunction row matches its snapshot', () => {
          expect(ran.stderr).toMatchSnapshot();
        });
      });
    }),
  );
});

// an init asset the published 0.42.1 ships; a consumer's host holds it read-only
const ASSET_PATH_DIR = 'domain.roles/driver/inits';
const ASSET_PATH_NAME = 'init.claude.status-line.jsonc';

/**
 * .what = a dir that holds one shim: it runs `faultWhen`, else hands the call to the real bin
 * .why = put ahead on PATH, it faults exactly one call of the skill and passes the rest through
 */
const genShimDir = (input: {
  slug: string;
  bin: string;
  faultWhen: string;
}): string => {
  const binReal = spawnSync('which', [input.bin], {
    encoding: 'utf-8',
  }).stdout.trim();
  const shimDir = fs.realpathSync(genTempDir({ slug: `shim-${input.slug}` }));
  const shimPath = path.join(shimDir, input.bin);
  fs.writeFileSync(
    shimPath,
    ['#!/usr/bin/env bash', input.faultWhen, `exec "${binReal}" "$@"`, ''].join(
      '\n',
    ),
  );
  fs.chmodSync(shimPath, 0o755);
  return shimDir;
};

/**
 * .what = a package dir whose build equals the published 0.42.1: its exports, and no dist file
 * .why = with naught overlaid and the same exports lifted, the diff is empty
 *
 * .note = the exports are read from the base the skill itself extracts, in their published
 *         key order. `npm view` reorders keys, and an order change is a diff
 */
const genPackageDirEqualToBase = (input: { slug: string }): string => {
  // a first run extracts the published base into the skill's scratch
  const cwd = fs.realpathSync(genTempDir({ slug: input.slug }));
  const writePackageJson = (exports: unknown): void =>
    fs.writeFileSync(
      path.join(cwd, 'package.json'),
      JSON.stringify({ name: 'rhachet-roles-bhrain', exports }),
    );
  writePackageJson({});
  fs.mkdirSync(path.join(cwd, 'dist'));
  runSkill({
    cwd,
    args: ['--from', '0.42.1', '--into', 'seed.patch'],
    shimDir: null,
  });

  // lift the base's own exports, so the next run has naught to diff
  const base = JSON.parse(
    fs.readFileSync(
      path.join(
        cwd,
        '.temp/consumer-patch/rhachet-roles-bhrain@0.42.1/a/package.json',
      ),
      'utf-8',
    ),
  );
  writePackageJson(base.exports);
  return cwd;
};

/**
 * .what = a temp dir that holds this package's name, one lifted export, and a one-file dist
 * .why = the skill reads `./package.json` and `./dist/` from its cwd; a one-file build keeps
 *        the patch small and the same on every run
 */
const genPackageDir = (input: { slug: string }): string => {
  const cwd = fs.realpathSync(genTempDir({ slug: input.slug }));
  fs.writeFileSync(
    path.join(cwd, 'package.json'),
    JSON.stringify({
      name: 'rhachet-roles-bhrain',
      exports: { './cli/route.status.line': './dist/index.js' },
    }),
  );
  fs.mkdirSync(path.join(cwd, 'dist'));
  fs.writeFileSync(
    path.join(cwd, 'dist', 'index.js'),
    '// the local build\nmodule.exports = {};\n',
  );
  return cwd;
};
