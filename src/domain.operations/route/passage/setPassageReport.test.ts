import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { setPassageReport } from './setPassageReport';

describe('setPassageReport', () => {
  given('[case1] a passed report', () => {
    const tempDir = path.join(os.tmpdir(), `test-passage-${Date.now()}`);
    const report = new PassageReport({
      stone: '1.vision',
      status: 'passed',
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] report is set', () => {
      then('creates .route directory if absent', async () => {
        await setPassageReport({ report, route: tempDir });
        const stat = await fs.stat(path.join(tempDir, '.route'));
        expect(stat.isDirectory()).toBe(true);
      });

      then('appends JSON line to passage.jsonl', async () => {
        const result = await setPassageReport({ report, route: tempDir });
        expect(result.path).toContain('passage.jsonl');
        const content = await fs.readFile(result.path, 'utf-8');
        const parsed = JSON.parse(content.trim());
        expect(parsed.stone).toEqual('1.vision');
        expect(parsed.status).toEqual('passed');
      });

      then('findserts .gitignore with correct rules', async () => {
        await setPassageReport({ report, route: tempDir });
        const gitignorePath = path.join(tempDir, '.route', '.gitignore');
        const content = await fs.readFile(gitignorePath, 'utf-8');
        expect(content).toContain('*');
        expect(content).toContain('!.gitignore');
        expect(content).toContain('!passage.jsonl');
        expect(content).toContain('!.bind.*');
      });
    });
  });

  given('[case2] multiple reports for same stone', () => {
    const tempDir = path.join(os.tmpdir(), `test-passage-multi-${Date.now()}`);

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] multiple reports are set', () => {
      then('appends each report as separate line', async () => {
        const report1 = new PassageReport({
          stone: '1.vision',
          status: 'blocked',
          blocker: 'review.self',
          reason: 'review.self required',
        });
        const report2 = new PassageReport({
          stone: '1.vision',
          status: 'passed',
        });

        await setPassageReport({ report: report1, route: tempDir });
        await setPassageReport({ report: report2, route: tempDir });

        const content = await fs.readFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          'utf-8',
        );
        const lines = content.trim().split('\n');
        expect(lines).toHaveLength(2);
        expect(JSON.parse(lines[0]!).status).toEqual('blocked');
        expect(JSON.parse(lines[1]!).status).toEqual('passed');
      });
    });
  });

  given('[case3] a blocked report with all fields', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-passage-blocked-${Date.now()}`,
    );
    const report = new PassageReport({
      stone: '3.3.blueprint.v1',
      status: 'blocked',
      blocker: 'approval',
      reason: 'requires human approval',
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] report is set', () => {
      then('serializes all fields', async () => {
        await setPassageReport({ report, route: tempDir });
        const content = await fs.readFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          'utf-8',
        );
        const parsed = JSON.parse(content.trim());
        expect(parsed.stone).toEqual('3.3.blueprint.v1');
        expect(parsed.status).toEqual('blocked');
        expect(parsed.blocker).toEqual('approval');
        expect(parsed.reason).toEqual('requires human approval');
      });
    });
  });
});
