import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getOneStoneGuardApproval } from './getOneStoneGuardApproval';

const ASSETS_DIR = path.join(__dirname, '../.test/assets');

describe('getOneStoneGuardApproval', () => {
  given('[case1] stone in route.approved with approval marker', () => {
    const routePath = path.join(ASSETS_DIR, 'route.approved');
    const stone = new RouteStone({
      name: '1.vision',
      path: path.join(routePath, '1.vision.stone'),
      guard: null,
    });

    when('[t0] approval is checked', () => {
      then('returns approval artifact', async () => {
        const approval = await getOneStoneGuardApproval({
          stone,
          route: routePath,
        });
        expect(approval).not.toBeNull();
        expect(approval?.path).toContain('passage.jsonl');
      });
    });
  });

  given('[case2] stone in route.simple without approval marker', () => {
    const routePath = path.join(ASSETS_DIR, 'route.simple');
    const stone = new RouteStone({
      name: '1.vision',
      path: path.join(routePath, '1.vision.stone'),
      guard: null,
    });

    when('[t0] approval is checked', () => {
      then('returns null', async () => {
        const approval = await getOneStoneGuardApproval({
          stone,
          route: routePath,
        });
        expect(approval).toBeNull();
      });
    });
  });

  given('[case3] approval followed by rewind to same stone', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-approval-invalid-same-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.vision.stone'), 'content');
      // approval, then rewind
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        '{"stone":"1.vision","status":"approved"}\n{"stone":"1.vision","status":"rewound"}\n',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] approval is checked', () => {
      then('returns null (invalidated by rewind)', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: path.join(tempDir, '1.vision.stone'),
          guard: null,
        });
        const approval = await getOneStoneGuardApproval({
          stone,
          route: tempDir,
        });
        expect(approval).toBeNull();
      });
    });
  });

  given('[case4] approval followed by rewind to earlier stone', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-approval-invalid-earlier-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.vision.stone'), 'content');
      await fs.writeFile(path.join(tempDir, '2.criteria.stone'), 'content');
      // approve stone 2, then rewind stone 1 (which is earlier)
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        '{"stone":"2.criteria","status":"approved"}\n{"stone":"1.vision","status":"rewound"}\n',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] approval for stone 2 is checked', () => {
      then('returns null (invalidated by earlier rewind)', async () => {
        const stone = new RouteStone({
          name: '2.criteria',
          path: path.join(tempDir, '2.criteria.stone'),
          guard: null,
        });
        const approval = await getOneStoneGuardApproval({
          stone,
          route: tempDir,
        });
        expect(approval).toBeNull();
      });
    });
  });

  given('[case5] approval followed by rewind to later stone', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-approval-valid-later-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.vision.stone'), 'content');
      await fs.writeFile(path.join(tempDir, '2.criteria.stone'), 'content');
      // approve stone 1, then rewind stone 2 (which is later)
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        '{"stone":"1.vision","status":"approved"}\n{"stone":"2.criteria","status":"rewound"}\n',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] approval for stone 1 is checked', () => {
      then('returns approval artifact (not invalidated)', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: path.join(tempDir, '1.vision.stone'),
          guard: null,
        });
        const approval = await getOneStoneGuardApproval({
          stone,
          route: tempDir,
        });
        expect(approval).not.toBeNull();
      });
    });
  });

  given('[case6] nested prefixes (3.1 vs 3.2)', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-approval-nested-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '3.1.research.domain.stone'),
        'content',
      );
      await fs.writeFile(
        path.join(tempDir, '3.2.research.patterns.stone'),
        'content',
      );
      // approve 3.2, then rewind 3.1 (which is earlier)
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        '{"stone":"3.2.research.patterns","status":"approved"}\n{"stone":"3.1.research.domain","status":"rewound"}\n',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] approval for 3.2 is checked', () => {
      then('returns null (invalidated by 3.1 rewind)', async () => {
        const stone = new RouteStone({
          name: '3.2.research.patterns',
          path: path.join(tempDir, '3.2.research.patterns.stone'),
          guard: null,
        });
        const approval = await getOneStoneGuardApproval({
          stone,
          route: tempDir,
        });
        expect(approval).toBeNull();
      });
    });
  });

  given('[case7] re-approval after rewind', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-approval-reapproval-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.vision.stone'), 'content');
      // approve, rewind, then approve again
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        [
          '{"stone":"1.vision","status":"approved"}',
          '{"stone":"1.vision","status":"rewound"}',
          '{"stone":"1.vision","status":"approved"}',
        ].join('\n') + '\n',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] approval is checked', () => {
      then('returns approval artifact (latest approval is valid)', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: path.join(tempDir, '1.vision.stone'),
          guard: null,
        });
        const approval = await getOneStoneGuardApproval({
          stone,
          route: tempDir,
        });
        expect(approval).not.toBeNull();
      });
    });
  });
});
