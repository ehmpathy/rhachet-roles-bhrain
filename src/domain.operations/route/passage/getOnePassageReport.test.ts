import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { getOnePassageReport } from './getOnePassageReport';

describe('getOnePassageReport', () => {
  given('[case1] no passage.jsonl file', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-passage-one-empty-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] file is absent', () => {
      then('returns null', async () => {
        const report = await getOnePassageReport({
          stone: '1.vision',
          route: tempDir,
        });
        expect(report).toBeNull();
      });
    });
  });

  given('[case2] passage.jsonl with multiple reports for same stone', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-passage-one-multi-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      const content =
        [
          JSON.stringify({
            stone: '1.vision',
            status: 'blocked',
            blocker: 'review.self',
          }),
          JSON.stringify({ stone: '1.vision', status: 'passed' }),
          JSON.stringify({ stone: '2.criteria', status: 'approved' }),
        ].join('\n') + '\n';
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        content,
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] queried without status filter', () => {
      then('returns latest report for stone', async () => {
        const report = await getOnePassageReport({
          stone: '1.vision',
          route: tempDir,
        });
        expect(report).toBeInstanceOf(PassageReport);
        expect(report?.status).toEqual('passed');
      });
    });

    when('[t1] queried with status filter', () => {
      then('returns latest report with that status', async () => {
        const report = await getOnePassageReport({
          stone: '1.vision',
          status: 'blocked',
          route: tempDir,
        });
        expect(report).toBeInstanceOf(PassageReport);
        expect(report?.status).toEqual('blocked');
        expect(report?.blocker).toEqual('review.self');
      });
    });

    when('[t2] queried for non-existent stone', () => {
      then('returns null', async () => {
        const report = await getOnePassageReport({
          stone: 'nonexistent',
          route: tempDir,
        });
        expect(report).toBeNull();
      });
    });

    when('[t3] queried for non-existent status on valid stone', () => {
      then('returns null', async () => {
        const report = await getOnePassageReport({
          stone: '1.vision',
          status: 'approved',
          route: tempDir,
        });
        expect(report).toBeNull();
      });
    });
  });
});
