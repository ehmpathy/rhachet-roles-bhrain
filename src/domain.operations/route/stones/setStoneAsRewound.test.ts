import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import type { ContextCliEmit } from '@src/domain.objects/Driver/ContextCliEmit';

import { setSelfReviewTriggeredReport } from '../guard/review/self/setSelfReviewTriggeredReport';
import { isPathFound } from '../isPathFound';
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

      then('stdout matches snapshot', async () => {
        const result = await setStoneAsRewound(
          { stone: '1.vision', route: tempDir },
          mockContext,
        );
        expect(result.emit.stdout).toMatchSnapshot();
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
    const reviewsDir = path.join(tempDir, '.reviews', 'peer');

    beforeEach(async () => {
      await fs.mkdir(routeDir, { recursive: true });
      await fs.mkdir(reviewsDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.vision.stone'), 'stone content');
      // reviews go to .reviews/peer/
      await fs.writeFile(
        path.join(
          reviewsDir,
          '1.vision._.review.i001.abc123.r001._.given.by_peer.test-reviewer.md',
        ),
        'review',
      );
      // judges stay in .route/
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
        const routeFiles = await fs.readdir(routeDir);
        expect(routeFiles.filter((f) => f.includes('.guard.'))).toHaveLength(0);
        const reviewFiles = await fs.readdir(reviewsDir);
        expect(reviewFiles.filter((f) => f.includes('.review.'))).toHaveLength(
          0,
        );
      });

      /**
       * 🔴 .what = the cascade label reads `cleared:`, never `deleted:`
       * .why = the triggers inside that count are ARCHIVED under `.archive/`, never removed
       *        (`archiveStoneSelfReviewTriggers`). so `deleted:` told a route author their
       *        ask was gone when it was recoverable — one word, and it reported the wrong
       *        outcome for every rewind that touched a live trigger.
       * .note = asserted rather than left to the snapshot alone. a snapshot re-snaps on a
       *         `--resnap` and would carry the regression back in silence.
       */
      then(
        'the cascade label names what was CLEARED, never deleted',
        async () => {
          const result = await setStoneAsRewound(
            { stone: '1.vision', route: tempDir },
            mockContext,
          );
          expect(result.emit.stdout).toContain('├─ cleared:');
          expect(result.emit.stdout).not.toContain('├─ deleted:');
        },
      );

      then('stdout matches snapshot', async () => {
        const result = await setStoneAsRewound(
          { stone: '1.vision', route: tempDir },
          mockContext,
        );
        expect(result.emit.stdout).toMatchSnapshot();
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

      then('stdout matches snapshot for idempotent call', async () => {
        await setStoneAsRewound(
          { stone: '1.vision', route: tempDir },
          mockContext,
        );
        const result = await setStoneAsRewound(
          { stone: '1.vision', route: tempDir },
          mockContext,
        );
        expect(result.emit.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case7] stdout snapshot for cascade rewind', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-rewound-snapshot-${Date.now()}`,
    );
    const routeDir = path.join(tempDir, '.route');
    const reviewsDir = path.join(tempDir, '.reviews', 'peer');

    beforeEach(async () => {
      await fs.mkdir(routeDir, { recursive: true });
      await fs.mkdir(reviewsDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.vision.stone'), 'stone 1');
      await fs.writeFile(path.join(tempDir, '2.criteria.stone'), 'stone 2');
      await fs.writeFile(path.join(tempDir, '3.blueprint.stone'), 'stone 3');
      // reviews go to .reviews/peer/
      await fs.writeFile(
        path.join(
          reviewsDir,
          '2.criteria._.review.i001.abc123.r001._.given.by_peer.test-reviewer.md',
        ),
        'review',
      );
      // judges and promises stay in .route/
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

      then('stdout matches snapshot', async () => {
        const result = await setStoneAsRewound(
          { stone: '3.2.research', route: tempDir },
          mockContext,
        );
        expect(result.emit.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case9] yield drop single stone', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-rewound-yield-drop-${Date.now()}`,
    );

    beforeAll(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.vision.stone'), 'stone content');
      await fs.writeFile(path.join(tempDir, '1.vision.yield.md'), '# Yield');
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] setStoneAsRewound is called with yield drop', () => {
      then('rewound successfully', async () => {
        const result = await setStoneAsRewound(
          { stone: '1.vision', route: tempDir, yield: 'drop' },
          mockContext,
        );
        expect(result.rewound).toBe(true);
      });

      then('yield file moved to archive', async () => {
        const archivePath = path.join(
          tempDir,
          '.route',
          '.archive',
          '1.vision.yield.md',
        );
        const exists = await isPathFound(archivePath);
        expect(exists).toBe(true);
      });

      then('original yield file removed', async () => {
        const originalPath = path.join(tempDir, '1.vision.yield.md');
        const exists = await isPathFound(originalPath);
        expect(exists).toBe(false);
      });
    });
  });

  given('[case10] yield drop cascade', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-rewound-yield-cascade-${Date.now()}`,
    );

    beforeAll(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.vision.stone'), 'stone 1');
      await fs.writeFile(path.join(tempDir, '2.criteria.stone'), 'stone 2');
      await fs.writeFile(
        path.join(tempDir, '2.criteria.yield.md'),
        '# Yield 2',
      );
      await fs.writeFile(path.join(tempDir, '3.blueprint.stone'), 'stone 3');
      await fs.writeFile(
        path.join(tempDir, '3.blueprint.yield.md'),
        '# Yield 3',
      );
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] setStoneAsRewound cascade with yield drop', () => {
      then('all cascade stones rewound', async () => {
        const result = await setStoneAsRewound(
          { stone: '2.criteria', route: tempDir, yield: 'drop' },
          mockContext,
        );
        expect(result.rewound).toBe(true);
        expect(result.affectedStones).toEqual(['2.criteria', '3.blueprint']);
      });

      then('cascade yield files archived', async () => {
        const archivePath2 = path.join(
          tempDir,
          '.route',
          '.archive',
          '2.criteria.yield.md',
        );
        const archivePath3 = path.join(
          tempDir,
          '.route',
          '.archive',
          '3.blueprint.yield.md',
        );
        const exists2 = await isPathFound(archivePath2);
        const exists3 = await isPathFound(archivePath3);
        expect(exists2).toBe(true);
        expect(exists3).toBe(true);
      });
    });
  });

  given('[case11] yield keep explicit', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-rewound-yield-keep-${Date.now()}`,
    );

    beforeAll(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.vision.stone'), 'stone content');
      await fs.writeFile(path.join(tempDir, '1.vision.yield.md'), '# Yield');
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] setStoneAsRewound is called with yield keep', () => {
      then('rewound successfully', async () => {
        const result = await setStoneAsRewound(
          { stone: '1.vision', route: tempDir, yield: 'keep' },
          mockContext,
        );
        expect(result.rewound).toBe(true);
      });

      then('yield file still exists', async () => {
        const originalPath = path.join(tempDir, '1.vision.yield.md');
        const exists = await isPathFound(originalPath);
        expect(exists).toBe(true);
      });
    });
  });

  given('[case12] yield keep default (no flag)', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-rewound-yield-default-${Date.now()}`,
    );

    beforeAll(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.vision.stone'), 'stone content');
      await fs.writeFile(path.join(tempDir, '1.vision.yield.md'), '# Yield');
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] setStoneAsRewound is called without yield flag', () => {
      then('rewound successfully', async () => {
        const result = await setStoneAsRewound(
          { stone: '1.vision', route: tempDir },
          mockContext,
        );
        expect(result.rewound).toBe(true);
      });

      then('yield file still exists (default keep)', async () => {
        const yieldPath = path.join(tempDir, '1.vision.yield.md');
        const exists = await isPathFound(yieldPath);
        expect(exists).toBe(true);
      });
    });
  });

  given('[case13] yield drop, no yield file', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-rewound-yield-absent-${Date.now()}`,
    );

    beforeAll(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.vision.stone'), 'stone content');
      // no yield file created
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] setStoneAsRewound is called with yield drop', () => {
      then('rewound successfully', async () => {
        const result = await setStoneAsRewound(
          { stone: '1.vision', route: tempDir, yield: 'drop' },
          mockContext,
        );
        expect(result.rewound).toBe(true);
      });

      then('no archive created (yield file absent)', async () => {
        const archivePath = path.join(
          tempDir,
          '.route',
          '.archive',
          '1.vision.yield.md',
        );
        const exists = await isPathFound(archivePath);
        expect(exists).toBe(false);
      });
    });
  });

  given('[case14] stdout snapshot yield drop', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-rewound-snap-drop-${Date.now()}`,
    );

    beforeAll(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '2.criteria.stone'), 'stone 2');
      await fs.writeFile(path.join(tempDir, '2.criteria.yield.md'), '# Yield');
      await fs.writeFile(path.join(tempDir, '3.blueprint.stone'), 'stone 3');
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] setStoneAsRewound with yield drop', () => {
      then('stdout matches snapshot', async () => {
        const result = await setStoneAsRewound(
          { stone: '2.criteria', route: tempDir, yield: 'drop' },
          mockContext,
        );
        expect(result.emit.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case15] stdout snapshot yield keep', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-rewound-snap-keep-${Date.now()}`,
    );

    beforeAll(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '2.criteria.stone'), 'stone 2');
      await fs.writeFile(path.join(tempDir, '2.criteria.yield.md'), '# Yield');
      await fs.writeFile(path.join(tempDir, '3.blueprint.stone'), 'stone 3');
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] setStoneAsRewound with yield keep', () => {
      then('stdout matches snapshot', async () => {
        const result = await setStoneAsRewound(
          { stone: '2.criteria', route: tempDir, yield: 'keep' },
          mockContext,
        );
        expect(result.emit.stdout).toMatchSnapshot();
      });
    });
  });

  /**
   * 🔴 .what = the trigger count renders NON-ZERO, against triggers the guard itself minted
   * .why = `F10`'s whole deliverable is "the rewind archives the trigger, AND SAYS SO", and
   *        until i010 the second half was unwitnessed: all 11 rows of this file's snapshot read
   *        `0 triggers`, and the acceptance snapshot held the word `triggers` not at all. so
   *        every clamp on that line was green whether the count worked or was hard-coded `0`.
   *        ⇒ this is the round's own repeat failure, found a third time: a VALUE assertion
   *          that only ever saw one value proves naught about the path that produces the others.
   *
   * 🔴 .note = the triggers are minted by `setSelfReviewTriggeredReport` rather than hand-written
   *            to the path. a hand-written fixture clamps this test's idea of the filename; a
   *            minted one clamps the guard's — so if the two ever fall out of agreement, this
   *            goes red rather than green on a name no production code uses.
   */
  given('[case16] a stone with LIVE self-review triggers', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-rewound-triggers-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.vision.stone'), 'stone content');

      // mint two asks through the guard's own operation, so the paths are the guard's
      for (const slug of ['has-grounded-in-reality', 'has-questioned-scope'])
        await setSelfReviewTriggeredReport(
          { stone: '1.vision', slug, route: tempDir },
          { sinceOnly: true },
        );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] setStoneAsRewound is called', () => {
      /**
       * ⚠️ the number is asserted EXACTLY, never as `> 0`. a `> 0` clamp passes on a count that
       *    reports one trigger for two, which is the defect a route author would actually meet
       */
      then('the cleared line reports both triggers', async () => {
        const result = await setStoneAsRewound(
          { stone: '1.vision', route: tempDir },
          mockContext,
        );

        expect(result.emit.stdout).toContain('2 triggers');
      });

      then('stdout matches snapshot', async () => {
        const result = await setStoneAsRewound(
          { stone: '1.vision', route: tempDir },
          mockContext,
        );

        expect(result.emit.stdout).toMatchSnapshot();
      });

      /**
       * 🔴 the count is a CLAIM about the disk, so it is checked against the disk. a count that
       *    renders `2` while the markers remain is the exact lie `cleared:` was renamed to avoid
       */
      then('and the markers it counted are off the .route dir', async () => {
        await setStoneAsRewound(
          { stone: '1.vision', route: tempDir },
          mockContext,
        );

        const routeFiles = await fs.readdir(path.join(tempDir, '.route'));
        expect(
          routeFiles.filter((f) => f.includes('.triggered.')),
        ).toHaveLength(0);
      });
    });
  });
});
