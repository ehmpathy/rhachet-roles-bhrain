import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, usePrep, when } from 'test-fns';

import { writeOutputArtifacts } from './writeOutputArtifacts';

describe('writeOutputArtifacts', () => {
  given('[case1] valid output artifacts', () => {
    const scene = usePrep(async () => {
      const logDir = path.join(
        os.tmpdir(),
        `bhrain-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      );
      return { logDir };
    });

    when('[t0] writeOutputArtifacts is called', () => {
      then('creates log directory if not exists', async () => {
        const result = await writeOutputArtifacts({
          logDir: scene.logDir,
          response: { status: 'success', issues: [] },
          review: '# review\n\nno issues found',
        });

        // verify directory was created
        const stats = await fs.stat(scene.logDir);
        expect(stats.isDirectory()).toBe(true);

        // verify files were created
        expect(result.responsePath).toContain('output.response.json');
        expect(result.reviewPath).toContain('output.review.md');
      });

      then('writes output.response.json with exact response', async () => {
        const response = {
          status: 'complete',
          issues: [
            {
              type: 'blocker',
              message: 'found any type',
              file: 'src/index.ts',
              line: 5,
            },
            {
              type: 'nitpick',
              message: 'prefer const',
              file: 'src/utils.ts',
              line: 12,
            },
          ],
          metadata: {
            tokensUsed: 1234,
            duration: 5.6,
          },
        };

        await writeOutputArtifacts({
          logDir: scene.logDir,
          response,
          review: 'test review',
        });

        const responsePath = path.join(scene.logDir, 'output.response.json');
        const responseContent = await fs.readFile(responsePath, 'utf-8');
        const responseJson = JSON.parse(responseContent);

        expect(responseJson).toEqual(response);
      });

      then('writes output.review.md with exact review content', async () => {
        const reviewContent = `# code review feedback

## blocker.1
**file**: src/index.ts:5
**issue**: found \`any\` type usage

## nitpick.1
**file**: src/utils.ts:12
**issue**: prefer \`const\` over \`let\`
`;

        await writeOutputArtifacts({
          logDir: scene.logDir,
          response: { status: 'complete' },
          review: reviewContent,
        });

        const reviewPath = path.join(scene.logDir, 'output.review.md');
        const writtenReview = await fs.readFile(reviewPath, 'utf-8');

        expect(writtenReview).toEqual(reviewContent);
      });
    });
  });

  given('[case2] log directory already exists', () => {
    const scene = usePrep(async () => {
      const logDir = path.join(
        os.tmpdir(),
        `bhrain-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      );
      // pre-create the directory
      await fs.mkdir(logDir, { recursive: true });
      return { logDir };
    });

    when('[t0] writeOutputArtifacts is called', () => {
      then('does not throw error', async () => {
        const result = await writeOutputArtifacts({
          logDir: scene.logDir,
          response: { status: 'success' },
          review: 'no issues',
        });

        expect(result.responsePath).toBeDefined();
        expect(result.reviewPath).toBeDefined();
      });
    });
  });
});
