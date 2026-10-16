import childProcess, { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { stepRouteReview } from './stepRouteReview';

describe('stepRouteReview.integration', () => {
  given('[case1] a git repo with route artifacts', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'route-review-int-'));
    const routeDir = path.join(tempDir, '.behavior/test-route');

    beforeAll(() => {
      // init git repo
      execSync('git init', { cwd: tempDir, stdio: 'pipe' });
      execSync('git config user.email "test@test.com"', {
        cwd: tempDir,
        stdio: 'pipe',
      });
      execSync('git config user.name "Test"', { cwd: tempDir, stdio: 'pipe' });

      // create route structure
      fs.mkdirSync(routeDir, { recursive: true });
      fs.writeFileSync(path.join(routeDir, '0.wish.md'), '# wish\n');
      fs.writeFileSync(
        path.join(routeDir, '1.vision.stone'),
        'declare vision\n',
      );
      fs.writeFileSync(
        path.join(routeDir, '1.vision.i1.md'),
        '# vision\nartifact content\n',
      );

      // commit initial state
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "initial"', { cwd: tempDir, stdio: 'pipe' });

      // modify artifact
      fs.writeFileSync(
        path.join(routeDir, '1.vision.i1.md'),
        '# vision\nartifact content\nwith changes\n',
      );
    });

    afterAll(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    when('[t0] stepRouteReview is called', () => {
      then('returns diff stats for modified artifact', async () => {
        const result = await stepRouteReview({
          route: routeDir,
          stone: '1.vision',
        });

        expect(result.emit.stderr).toBeUndefined();
        expect(result.artifacts).toHaveLength(1);
        expect(result.emit.stdout).toContain('[~]'); // modified symbol
        expect(result.emit.stdout).toContain('lines');
      });
    });
  });

  given('[case2] a git repo with new untracked artifacts', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'route-review-int-'));
    const routeDir = path.join(tempDir, '.behavior/test-route');

    beforeAll(() => {
      // init git repo
      execSync('git init', { cwd: tempDir, stdio: 'pipe' });
      execSync('git config user.email "test@test.com"', {
        cwd: tempDir,
        stdio: 'pipe',
      });
      execSync('git config user.name "Test"', { cwd: tempDir, stdio: 'pipe' });

      // create route structure (untracked)
      fs.mkdirSync(routeDir, { recursive: true });
      fs.writeFileSync(path.join(routeDir, '0.wish.md'), '# wish\n');
      fs.writeFileSync(
        path.join(routeDir, '1.vision.stone'),
        'declare vision\n',
      );
      fs.writeFileSync(
        path.join(routeDir, '1.vision.i1.md'),
        '# vision\nnew artifact\n',
      );
    });

    afterAll(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    when('[t0] stepRouteReview is called', () => {
      then('returns [+] symbol for new artifact', async () => {
        const result = await stepRouteReview({
          route: routeDir,
          stone: '1.vision',
        });

        expect(result.emit.stderr).toBeUndefined();
        expect(result.artifacts).toHaveLength(1);
        expect(result.emit.stdout).toContain('[+]'); // new file symbol
      });
    });
  });

  given('[case3] a git repo with gitignored artifacts', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'route-review-int-'));
    const routeDir = path.join(tempDir, '.behavior/test-route');

    beforeAll(() => {
      // init git repo
      execSync('git init', { cwd: tempDir, stdio: 'pipe' });
      execSync('git config user.email "test@test.com"', {
        cwd: tempDir,
        stdio: 'pipe',
      });
      execSync('git config user.name "Test"', { cwd: tempDir, stdio: 'pipe' });

      // create route structure
      fs.mkdirSync(routeDir, { recursive: true });
      fs.writeFileSync(path.join(routeDir, '0.wish.md'), '# wish\n');
      fs.writeFileSync(
        path.join(routeDir, '1.vision.stone'),
        'declare vision\n',
      );
      fs.writeFileSync(
        path.join(routeDir, '1.vision.i1.md'),
        '# vision\nartifact one\n',
      );
      fs.writeFileSync(
        path.join(routeDir, '1.vision.i2.md'),
        '# vision\nartifact two (should be ignored)\n',
      );

      // create .gitignore that ignores i2.md
      fs.writeFileSync(path.join(routeDir, '.gitignore'), '1.vision.i2.md\n');

      // commit all files except the ignored one
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "initial"', { cwd: tempDir, stdio: 'pipe' });
    });

    afterAll(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    when('[t0] stepRouteReview is called', () => {
      then('returns only non-ignored artifact', async () => {
        const result = await stepRouteReview({
          route: routeDir,
          stone: '1.vision',
        });

        expect(result.emit.stderr).toBeUndefined();
        expect(result.artifacts).toHaveLength(1);
        expect(result.artifacts[0]).toEqual('1.vision.i1.md');
        expect(result.emit.stdout).toContain('1.vision.i1.md');
        expect(result.emit.stdout).not.toContain('1.vision.i2.md');
      });
    });
  });

  given('[case4] a nested relative route, invoked from the repo root', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'route-review-int-'));
    const routeRelative = '.behavior/test-route';
    const routeDir = path.join(tempDir, routeRelative);
    const cwdOriginal = process.cwd();

    beforeAll(() => {
      // init git repo
      execSync('git init', { cwd: tempDir, stdio: 'pipe' });
      execSync('git config user.email "test@test.com"', {
        cwd: tempDir,
        stdio: 'pipe',
      });
      execSync('git config user.name "Test"', { cwd: tempDir, stdio: 'pipe' });

      // create route structure
      fs.mkdirSync(routeDir, { recursive: true });
      fs.writeFileSync(path.join(routeDir, '0.wish.md'), '# wish\n');
      fs.writeFileSync(
        path.join(routeDir, '1.vision.stone'),
        'declare vision\n',
      );
      fs.writeFileSync(
        path.join(routeDir, '1.vision.i1.md'),
        '# vision\nartifact content\n',
      );

      // commit initial state, then modify the artifact
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "initial"', { cwd: tempDir, stdio: 'pipe' });
      fs.writeFileSync(
        path.join(routeDir, '1.vision.i1.md'),
        '# vision\nartifact content\nwith changes\n',
      );

      // invoke from the repo root, as the cli does
      process.chdir(tempDir);
    });

    afterAll(() => {
      process.chdir(cwdOriginal);
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    when('[t0] stepRouteReview is called with an opener', () => {
      then('finds the artifact with its diff stats', async () => {
        const result = await stepRouteReview({
          route: routeRelative,
          stone: '1.vision',
        });

        expect(result.emit.stderr).toBeUndefined();
        expect(result.artifacts).toEqual(['1.vision.i1.md']);
        expect(result.emit.stdout).toContain(
          `[~] ${routeRelative}/1.vision.i1.md   4 lines  +1 -0`,
        );
      });

      then(
        'runs every subprocess from the repo root, never the route dir',
        async () => {
          /**
           * .mock = execSync + execFileSync, spied with call-through (no stub)
           * .why = the claim is the cwd of every subprocess; a side effect cannot name the
           *        cwd that produced it, so the call record is the observation
           * .real = each spawn runs unaltered, so the review this case drives is the real one
           */
          const execSyncSpy = jest.spyOn(childProcess, 'execSync');
          const execFileSyncSpy = jest.spyOn(childProcess, 'execFileSync');
          try {
            const result = await stepRouteReview({
              route: routeRelative,
              stone: '1.vision',
              open: 'true',
            });
            expect(result.opened).toEqual(true);

            // every subprocess cwd must equal the repo root
            const repoRoot = fs.realpathSync(tempDir);
            const cwds = [
              ...execSyncSpy.mock.calls.map(
                ([, options]) => (options as { cwd?: string } | undefined)?.cwd,
              ),
              ...execFileSyncSpy.mock.calls.map(
                ([, , options]) =>
                  (options as { cwd?: string } | undefined)?.cwd,
              ),
            ];
            expect(cwds.length).toBeGreaterThan(0);
            expect(cwds).toEqual(cwds.map(() => repoRoot));
          } finally {
            execSyncSpy.mockRestore();
            execFileSyncSpy.mockRestore();
          }
        },
      );
    });
  });

  given('[case5] a route in a dir that is no git repo', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'route-review-int-'));
    const routeRelative = '.behavior/test-route';
    const routeDir = path.join(tempDir, routeRelative);
    const cwdOriginal = process.cwd();

    beforeAll(() => {
      // create route structure, with no git init
      fs.mkdirSync(routeDir, { recursive: true });
      fs.writeFileSync(path.join(routeDir, '0.wish.md'), '# wish\n');
      fs.writeFileSync(
        path.join(routeDir, '1.vision.stone'),
        'declare vision\n',
      );
      fs.writeFileSync(
        path.join(routeDir, '1.vision.i1.md'),
        '# vision\nartifact content\n',
      );

      // invoke from the temp dir, so the repo root falls back to a dir git cannot read
      // .note = a stated carve-out of rule.forbid.cwd-outside-gitroot. the fault under test —
      //         `git check-ignore` exits 128 outside a repo — exists only where the process cwd is
      //         no git root, and stepRouteReview reads its root from that cwd. afterAll restores it
      process.chdir(tempDir);
    });

    afterAll(() => {
      process.chdir(cwdOriginal);
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    // 🔴 the clamp: git check-ignore exits 128 here, not 1. a bare catch read that fault
    //    as "no file ignored" and returned a clean review; now only exit 1 is benign
    when('[t0] stepRouteReview is called', () => {
      then(
        'the git fault is thrown, never read as "none ignored"',
        async () => {
          const error = await stepRouteReview({
            route: routeRelative,
            stone: '1.vision',
          }).catch((caught: unknown) => caught);
          expect(error).toMatchObject({
            status: 128,
            stderr: expect.stringMatching(/not a git repository/),
          });
        },
      );
    });
  });

  given('[case6] an artifact whose name carries shell syntax', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'route-review-int-'));
    const routeDir = path.join(tempDir, '.behavior/test-route');
    const artifactName = '1.vision."$(touch pwned)`touch pwned2`.md';

    beforeAll(() => {
      // init git repo
      execSync('git init', { cwd: tempDir, stdio: 'pipe' });
      execSync('git config user.email "test@test.com"', {
        cwd: tempDir,
        stdio: 'pipe',
      });
      execSync('git config user.name "Test"', { cwd: tempDir, stdio: 'pipe' });

      // create route structure, with one artifact named as a shell payload
      fs.mkdirSync(routeDir, { recursive: true });
      fs.writeFileSync(path.join(routeDir, '0.wish.md'), '# wish\n');
      fs.writeFileSync(
        path.join(routeDir, '1.vision.stone'),
        'declare vision\n',
      );
      fs.writeFileSync(path.join(routeDir, artifactName), '# vision\n');
    });

    afterAll(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    // 🔴 the clamp: a path once rode into `sh -c` inside quotes, so its `$(...)` ran and
    //    its `"` broke the quote. every path now rides as argv or stdin, never as shell text
    when('[t0] stepRouteReview is called with an opener', () => {
      then(
        'it lists the artifact and runs none of the text in its name',
        async () => {
          const result = await stepRouteReview({
            route: routeDir,
            stone: '1.vision',
            open: 'true',
          });

          expect(result.emit.stderr).toBeUndefined();
          expect(result.artifacts).toEqual([artifactName]);
          expect(result.opened).toEqual(true);
          expect(fs.readdirSync(tempDir)).not.toContain('pwned');
          expect(fs.readdirSync(tempDir)).not.toContain('pwned2');
          expect(fs.readdirSync(routeDir)).not.toContain('pwned');
          expect(fs.readdirSync(process.cwd())).not.toContain('pwned');
        },
      );
    });
  });
});
