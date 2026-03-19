import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { getOnePassageReport } from './getOnePassageReport';
import { setPassageReport } from './setPassageReport';

describe('getOnePassageReport.integration', () => {
  given('[case1] set and get cycle', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-passage-integration-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] report is set then retrieved', () => {
      then('returns the report', async () => {
        // set a report
        const report = new PassageReport({
          stone: '1.vision',
          status: 'passed',
        });
        await setPassageReport({ report, route: tempDir });

        // get it back
        const found = await getOnePassageReport({
          stone: '1.vision',
          route: tempDir,
        });
        expect(found).not.toBeNull();
        expect(found?.stone).toEqual('1.vision');
        expect(found?.status).toEqual('passed');
      });
    });

    when('[t1] multiple reports set, latest retrieved', () => {
      then('returns latest report when no filter', async () => {
        // set blocked first
        await setPassageReport({
          report: new PassageReport({
            stone: '1.vision',
            status: 'blocked',
            blocker: 'review.self',
          }),
          route: tempDir,
        });

        // then set passed
        await setPassageReport({
          report: new PassageReport({
            stone: '1.vision',
            status: 'passed',
          }),
          route: tempDir,
        });

        // get latest (should be passed)
        const found = await getOnePassageReport({
          stone: '1.vision',
          route: tempDir,
        });
        expect(found?.status).toEqual('passed');

        // get with status filter that matches latest (should return it)
        const passed = await getOnePassageReport({
          stone: '1.vision',
          status: 'passed',
          route: tempDir,
        });
        expect(passed?.status).toEqual('passed');

        // get with status filter that does NOT match latest (should return null)
        // note: new semantics — status filter checks LATEST entry only
        const blocked = await getOnePassageReport({
          stone: '1.vision',
          status: 'blocked',
          route: tempDir,
        });
        expect(blocked).toBeNull();
      });
    });
  });
});
