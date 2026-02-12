import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, usePrep, when } from 'test-fns';

import { writeInputArtifacts } from './writeInputArtifacts';

describe('writeInputArtifacts', () => {
  given('[case1] valid input artifacts', () => {
    const scene = usePrep(async () => {
      const logDir = path.join(
        os.tmpdir(),
        `bhrain-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      );
      return { logDir };
    });

    when('[t0] writeInputArtifacts is called', () => {
      then('creates log directory if not exists', async () => {
        const result = await writeInputArtifacts({
          logDir: scene.logDir,
          args: {
            rules: 'rules/*.md',
            paths: 'src/*.ts',
            output: '/tmp/review.md',
            focus: 'push',
            goal: 'representative',
          },
          scope: {
            ruleFiles: ['rules/rule.no-console.md', 'rules/rule.no-any.md'],
            refFiles: [],
            targetFiles: ['src/valid.ts', 'src/invalid.ts'],
          },
          metrics: {
            tokenEstimate: 1500,
            contextWindowPercent: 15,
            costEstimate: '$0.0045',
          },
          prompt: '# review prompt\n\nreview these files...',
        });

        // verify directory was created
        const stats = await fs.stat(scene.logDir);
        expect(stats.isDirectory()).toBe(true);

        // verify files were created
        expect(result.argsPath).toContain('input.args.json');
        expect(result.promptPath).toContain('input.prompt.md');
      });

      then('writes input.args.json with correct schema', async () => {
        await writeInputArtifacts({
          logDir: scene.logDir,
          args: {
            rules: 'rules/*.md',
            diffs: 'since-main',
            paths: ['src/*.ts', 'lib/*.ts'],
            output: '/tmp/review.md',
            focus: 'pull',
            goal: 'representative',
          },
          scope: {
            ruleFiles: ['rules/rule.no-console.md'],
            refFiles: [],
            targetFiles: ['src/index.ts'],
          },
          metrics: {
            tokenEstimate: 500,
            contextWindowPercent: 5,
            costEstimate: '$0.0015',
          },
          prompt: 'test prompt',
        });

        const argsPath = path.join(scene.logDir, 'input.args.json');
        const argsContent = await fs.readFile(argsPath, 'utf-8');
        const argsJson = JSON.parse(argsContent);

        expect(argsJson.args).toEqual({
          rules: 'rules/*.md',
          diffs: 'since-main',
          paths: ['src/*.ts', 'lib/*.ts'],
          output: '/tmp/review.md',
          focus: 'pull',
          goal: 'representative',
        });
        expect(argsJson.scope).toEqual({
          ruleFiles: ['rules/rule.no-console.md'],
          refFiles: [],
          targetFiles: ['src/index.ts'],
        });
        expect(argsJson.metrics).toEqual({
          tokenEstimate: 500,
          contextWindowPercent: 5,
          costEstimate: '$0.0015',
        });
      });

      then('writes input.prompt.md with exact prompt content', async () => {
        const promptContent = `# code review

## rules
- no console.log
- no any type

## files to review
- src/index.ts
- src/utils.ts
`;
        await writeInputArtifacts({
          logDir: scene.logDir,
          args: {
            rules: 'rules/*.md',
            output: '/tmp/review.md',
            focus: 'push',
            goal: 'representative',
          },
          scope: {
            ruleFiles: ['rules/rule.no-console.md'],
            refFiles: [],
            targetFiles: ['src/index.ts', 'src/utils.ts'],
          },
          metrics: {
            tokenEstimate: 800,
            contextWindowPercent: 8,
            costEstimate: '$0.0024',
          },
          prompt: promptContent,
        });

        const promptPath = path.join(scene.logDir, 'input.prompt.md');
        const writtenPrompt = await fs.readFile(promptPath, 'utf-8');

        expect(writtenPrompt).toEqual(promptContent);
      });
    });
  });
});
