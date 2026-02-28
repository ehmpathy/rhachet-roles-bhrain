import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { getAllPassageReports } from './getAllPassageReports';

describe('getAllPassageReports', () => {
  given('[case1] no passage.jsonl file', () => {
    const tempDir = path.join(os.tmpdir(), `test-passage-empty-${Date.now()}`);

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] file is absent', () => {
      then('returns empty array', async () => {
        const reports = await getAllPassageReports({ route: tempDir });
        expect(reports).toEqual([]);
      });
    });
  });

  given('[case2] passage.jsonl with multiple reports', () => {
    const tempDir = path.join(os.tmpdir(), `test-passage-multi-${Date.now()}`);

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

    when('[t0] file has multiple lines', () => {
      then('returns all reports as PassageReport instances', async () => {
        const reports = await getAllPassageReports({ route: tempDir });
        expect(reports).toHaveLength(3);
        expect(reports[0]).toBeInstanceOf(PassageReport);
        expect(reports[0]!.stone).toEqual('1.vision');
        expect(reports[0]!.status).toEqual('blocked');
        expect(reports[0]!.blocker).toEqual('review.self');
        expect(reports[1]!.status).toEqual('passed');
        expect(reports[2]!.stone).toEqual('2.criteria');
        expect(reports[2]!.status).toEqual('approved');
      });
    });
  });

  given('[case3] empty passage.jsonl file', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-passage-emptyfile-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '.route', 'passage.jsonl'), '');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] file is empty', () => {
      then('returns empty array', async () => {
        const reports = await getAllPassageReports({ route: tempDir });
        expect(reports).toEqual([]);
      });
    });
  });
});
