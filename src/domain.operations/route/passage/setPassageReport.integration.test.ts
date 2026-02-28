import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { setPassageReport } from './setPassageReport';

describe('setPassageReport.integration', () => {
  given('[case1] concurrent writes to passage.jsonl', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-passage-concurrent-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] multiple reports appended concurrently', () => {
      then('all reports are written without corruption', async () => {
        // create 10 reports to write concurrently
        const reports = Array.from(
          { length: 10 },
          (_, i) =>
            new PassageReport({
              stone: `stone-${i}`,
              status: 'passed',
            }),
        );

        // write all concurrently
        await Promise.all(
          reports.map((report) => setPassageReport({ report, route: tempDir })),
        );

        // read and verify
        const content = await fs.readFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          'utf-8',
        );
        const lines = content.trim().split('\n');
        expect(lines).toHaveLength(10);

        // each line should be valid JSON
        const parsed = lines.map((line) => JSON.parse(line));
        expect(parsed.map((p) => p.stone).sort()).toEqual(
          reports.map((r) => r.stone).sort(),
        );
      });
    });
  });

  given('[case2] file system persistence', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-passage-persist-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] report is written', () => {
      then('file exists on disk with correct content', async () => {
        const report = new PassageReport({
          stone: '1.vision',
          status: 'approved',
        });

        const result = await setPassageReport({ report, route: tempDir });

        // verify file exists
        const stat = await fs.stat(result.path);
        expect(stat.isFile()).toBe(true);

        // verify content is correct
        const content = await fs.readFile(result.path, 'utf-8');
        const parsed = JSON.parse(content.trim());
        expect(parsed).toEqual({
          stone: '1.vision',
          status: 'approved',
        });
      });
    });
  });
});
