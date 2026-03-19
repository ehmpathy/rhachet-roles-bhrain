import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import type { ContextCliEmit } from '@src/domain.objects/Driver/ContextCliEmit';

import { setStoneAsRewound } from './setStoneAsRewound';

const mockContext: ContextCliEmit = {
  cliEmit: {
    onGuardProgress: () => {},
  },
};

describe('setStoneAsRewound', () => {
  given('[case1] a route with a single stone', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-rewound-single-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.vision.stone'), 'stone content');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] setStoneAsRewound is called', () => {
      then('returns rewound: true', async () => {
        const result = await setStoneAsRewound(
          { stone: '1.vision', route: tempDir },
          mockContext,
        );
        expect(result.rewound).toBe(true);
      });

      then('returns the affected stone', async () => {
        const result = await setStoneAsRewound(
          { stone: '1.vision', route: tempDir },
          mockContext,
        );
        expect(result.affectedStones).toEqual(['1.vision']);
      });

      then('appends passage report', async () => {
        await setStoneAsRewound(
          { stone: '1.vision', route: tempDir },
          mockContext,
        );
        const passageContent = await fs.readFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          'utf-8',
        );
        expect(passageContent).toContain('"status":"rewound"');
        expect(passageContent).toContain('"stone":"1.vision"');
      });
    });
  });

  given('[case2] a route with multiple stones (cascade)', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-rewound-cascade-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.vision.stone'), 'stone 1');
      await fs.writeFile(path.join(tempDir, '2.criteria.stone'), 'stone 2');
      await fs.writeFile(path.join(tempDir, '3.blueprint.stone'), 'stone 3');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] setStoneAsRewound is called for stone 2', () => {
      then('cascades to stones 2 and 3', async () => {
        const result = await setStoneAsRewound(
          { stone: '2.criteria', route: tempDir },
          mockContext,
        );
        expect(result.affectedStones).toEqual(['2.criteria', '3.blueprint']);
      });

      then('does not affect stone 1', async () => {
        const result = await setStoneAsRewound(
          { stone: '2.criteria', route: tempDir },
          mockContext,
        );
        expect(result.affectedStones).not.toContain('1.vision');
      });

      then('appends passage reports for each affected stone', async () => {
        await setStoneAsRewound(
          { stone: '2.criteria', route: tempDir },
          mockContext,
        );
        const passageContent = await fs.readFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          'utf-8',
        );
        expect(passageContent).toContain('"stone":"2.criteria"');
        expect(passageContent).toContain('"stone":"3.blueprint"');
      });
    });
  });

  given('[case3] a stone with guard artifacts', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-rewound-artifacts-${Date.now()}`,
    );
    const routeDir = path.join(tempDir, '.route');

    beforeEach(async () => {
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.vision.stone'), 'stone content');
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.review.i1.abc123.r1.md'),
        'review',
      );
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.judge.i1.abc123.j1.md'),
        'judge',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] setStoneAsRewound is called', () => {
      then('deletes guard artifacts', async () => {
        await setStoneAsRewound(
          { stone: '1.vision', route: tempDir },
          mockContext,
        );
        const files = await fs.readdir(routeDir);
        expect(files.filter((f) => f.includes('.guard.'))).toHaveLength(0);
      });
    });
  });

  given('[case4] stone not found', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-rewound-notfound-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.vision.stone'), 'stone content');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] setStoneAsRewound is called with nonexistent pattern', () => {
      then('throws BadRequestError', async () => {
        await expect(
          setStoneAsRewound(
            { stone: 'nonexistent', route: tempDir },
            mockContext,
          ),
        ).rejects.toThrow('stone not found');
      });
    });
  });

  given('[case5] ambiguous pattern', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-rewound-ambiguous-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.vision.stone'), 'stone 1');
      await fs.writeFile(path.join(tempDir, '1.vision.v2.stone'), 'stone 2');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] setStoneAsRewound is called with ambiguous pattern', () => {
      then('throws BadRequestError with specificity hint', async () => {
        await expect(
          setStoneAsRewound({ stone: 'vision', route: tempDir }, mockContext),
        ).rejects.toThrow('be more specific');
      });
    });
  });

  given('[case6] idempotent rewind', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-rewound-idempotent-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.vision.stone'), 'stone content');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] setStoneAsRewound is called twice', () => {
      then('second call still succeeds', async () => {
        await setStoneAsRewound(
          { stone: '1.vision', route: tempDir },
          mockContext,
        );
        const result = await setStoneAsRewound(
          { stone: '1.vision', route: tempDir },
          mockContext,
        );
        expect(result.rewound).toBe(true);
      });

      then('appends two passage entries', async () => {
        await setStoneAsRewound(
          { stone: '1.vision', route: tempDir },
          mockContext,
        );
        await setStoneAsRewound(
          { stone: '1.vision', route: tempDir },
          mockContext,
        );
        const passageContent = await fs.readFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          'utf-8',
        );
        const lines = passageContent.trim().split('\n');
        expect(lines).toHaveLength(2);
      });
    });
  });

  given('[case7] stdout snapshot for cascade rewind', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-rewound-snapshot-${Date.now()}`,
    );
    const routeDir = path.join(tempDir, '.route');

    beforeEach(async () => {
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.vision.stone'), 'stone 1');
      await fs.writeFile(path.join(tempDir, '2.criteria.stone'), 'stone 2');
      await fs.writeFile(path.join(tempDir, '3.blueprint.stone'), 'stone 3');
      // add guard artifacts
      await fs.writeFile(
        path.join(routeDir, '2.criteria.guard.review.i1.abc123.r1.md'),
        'review',
      );
      await fs.writeFile(
        path.join(routeDir, '2.criteria.guard.judge.i1.abc123.j1.md'),
        'judge',
      );
      await fs.writeFile(
        path.join(routeDir, '3.blueprint.guard.promise.has-yagni.md'),
        'promise',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] setStoneAsRewound is called for stone 2', () => {
      then('stdout matches snapshot', async () => {
        const result = await setStoneAsRewound(
          { stone: '2.criteria', route: tempDir },
          mockContext,
        );
        expect(result.emit.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case8] nested stone prefixes (3.1 vs 3.2)', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-rewound-nested-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '3.1.research.domain.stone'),
        'stone',
      );
      await fs.writeFile(
        path.join(tempDir, '3.2.research.patterns.stone'),
        'stone',
      );
      await fs.writeFile(path.join(tempDir, '3.3.blueprint.stone'), 'stone');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] setStoneAsRewound is called for 3.2', () => {
      then('cascades to 3.2 and 3.3 but not 3.1', async () => {
        const result = await setStoneAsRewound(
          { stone: '3.2.research', route: tempDir },
          mockContext,
        );
        expect(result.affectedStones).toContain('3.2.research.patterns');
        expect(result.affectedStones).toContain('3.3.blueprint');
        expect(result.affectedStones).not.toContain('3.1.research.domain');
      });
    });
  });
});
