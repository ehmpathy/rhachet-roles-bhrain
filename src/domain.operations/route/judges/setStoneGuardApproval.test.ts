import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { setStoneGuardApproval } from './setStoneGuardApproval';

describe('setStoneGuardApproval', () => {
  given('[case1] a stone to approve', () => {
    const tempDir = genTempDir({ slug: 'approval' });
    const stone = new RouteStone({
      name: '1.vision',
      path: path.join(tempDir, '1.vision.stone'),
      guard: null,
    });

    when('[t0] approval is set', () => {
      then('creates .route directory if absent', async () => {
        await setStoneGuardApproval({ stone, route: tempDir });
        const stat = await fs.stat(path.join(tempDir, '.route'));
        expect(stat.isDirectory()).toBe(true);
      });

      then('appends approved report to passage.jsonl', async () => {
        const result = await setStoneGuardApproval({ stone, route: tempDir });
        expect(result.path).toContain('passage.jsonl');
        const content = await fs.readFile(result.path, 'utf-8');
        expect(content).toContain('"stone":"1.vision"');
        expect(content).toContain('"status":"approved"');
      });

      then('returns approval artifact', async () => {
        const result = await setStoneGuardApproval({ stone, route: tempDir });
        expect(result.stone.path).toEqual(stone.path);
      });
    });
  });
});
