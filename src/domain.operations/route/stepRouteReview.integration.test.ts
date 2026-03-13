import { execSync } from 'child_process';
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
});
