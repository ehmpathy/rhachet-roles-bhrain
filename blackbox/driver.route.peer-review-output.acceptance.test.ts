import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-review-output');

/**
 * .what = acceptance test that proves --output $output variable substitution works
 * .why = verifies that guard review commands can write reports to the $output path
 *
 * scenario:
 *   - guard has review.peer with `--output $output` in run command
 *   - when guard runs, $output is substituted with .reviews/peer/...report.md
 *   - review command writes to that path
 *   - driver can read the detailed report
 */
describe('driver.route.peer-review-output.acceptance', () => {
  given('[output-test] guard with --output $output variable', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-review-output',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // make mock review executable
      await execAsync('chmod +x .test/mock-review-with-output.sh', {
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] artifact created', () => {
      const result = useThen('artifact is written', async () => {
        await fs.writeFile(
          path.join(scene.tempDir, '1.execute.md'),
          '# execute\n\nthis is the artifact content.',
        );
        return { created: true };
      });

      then('artifact exists', () => {
        expect(result.created).toBe(true);
      });
    });

    when('[t1] driver tries to pass the stone', () => {
      const result = useThen('guard runs review', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0 (review passed)', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout confirms passage', () => {
        expect(result.stdout).toContain('passage = allowed');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] report file was written', () => {
      const result = useThen('report file exists', async () => {
        // find the .reviews/peer directory
        const reviewsDir = path.join(scene.tempDir, '.reviews', 'peer');

        // list files that match the report pattern
        const files = await fs.readdir(reviewsDir);
        const reportFiles = files.filter(
          (f) => f.includes('.report.md') && f.includes('mock-output'),
        );

        if (reportFiles.length === 0) {
          return { found: false, content: null, files };
        }

        // read the report content
        const reportPath = path.join(reviewsDir, reportFiles[0]!);
        const content = await fs.readFile(reportPath, 'utf-8');

        return { found: true, content, files: reportFiles };
      });

      then('report file was found', () => {
        expect(result.found).toBe(true);
        expect(result.files.length).toBeGreaterThan(0);
      });

      then('report contains detailed content', () => {
        expect(result.content).toContain('detailed review report');
        expect(result.content).toContain('$output variable substitution works');
      });

      then('report content matches snapshot', () => {
        expect(result.content).toMatchSnapshot();
      });
    });

    when('[t3] stdout artifact was also written', () => {
      const result = useThen('stdout artifact exists', async () => {
        const reviewsDir = path.join(scene.tempDir, '.reviews', 'peer');
        const files = await fs.readdir(reviewsDir);

        // stdout artifact is the one WITHOUT .report.md suffix
        const stdoutFiles = files.filter(
          (f) =>
            f.includes('mock-output') &&
            f.endsWith('.md') &&
            !f.includes('.report.md'),
        );

        if (stdoutFiles.length === 0) {
          return { found: false, content: null, files };
        }

        const stdoutPath = path.join(reviewsDir, stdoutFiles[0]!);
        const content = await fs.readFile(stdoutPath, 'utf-8');

        return { found: true, content, files: stdoutFiles };
      });

      then('stdout artifact was found', () => {
        expect(result.found).toBe(true);
      });

      then('stdout artifact contains review output', () => {
        expect(result.content).toContain('blockers: 0');
        expect(result.content).toContain('nitpicks: 1');
      });
    });

    when('[t4] verify review path points to .reviews/peer/', () => {
      const result = useThen('get file list', async () => {
        const reviewsDir = path.join(scene.tempDir, '.reviews', 'peer');
        const files = await fs.readdir(reviewsDir);
        return { reviewsDir, files };
      });

      then('review files are in .reviews/peer/', () => {
        expect(result.reviewsDir).toContain('.reviews/peer');
        expect(result.files.length).toBeGreaterThan(0);
      });

      then('files follow expected name pattern', () => {
        // pattern: $stone._.review.i$iter.$hash.r$idx._.given.by_peer.$slug.md
        const stdoutFile = result.files.find(
          (f) => f.includes('mock-output') && !f.includes('.report.md'),
        );
        expect(stdoutFile).toMatch(
          /1\.execute\._\.review\.i\d+\.[a-f0-9]+\.r\d+\._\.given\.by_peer\.mock-output\.md/,
        );
      });
    });
  });
});
