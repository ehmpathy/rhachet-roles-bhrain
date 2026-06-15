import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getMaxStoneGuardIteration } from './getMaxStoneGuardIteration';

describe('getMaxStoneGuardIteration', () => {
  given('[case1] route with no prior artifacts', () => {
    const tempDir = path.join(__dirname, '../.test/temp-iteration-empty');

    beforeAll(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
    });
    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] max iteration is queried', () => {
      then('returns 0', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: path.join(tempDir, '1.vision.stone'),
          guard: null,
        });
        const maxIter = await getMaxStoneGuardIteration({
          stone,
          route: tempDir,
        });
        expect(maxIter).toBe(0);
      });
    });
  });

  given('[case2] route with artifacts at various iterations and hashes', () => {
    const tempDir = path.join(__dirname, '../.test/temp-iteration-mixed');

    beforeAll(async () => {
      const routeDir = path.join(tempDir, '.route');
      await fs.mkdir(routeDir, { recursive: true });

      // create review artifacts with different iterations and hashes
      // simulates: i1 with hash1, i2 with hash2, i5 with hash3
      await fs.writeFile(
        path.join(
          routeDir,
          '1.vision.guard.review.i1.abc123def456789012.r1.md',
        ),
        'review 1',
      );
      await fs.writeFile(
        path.join(
          routeDir,
          '1.vision.guard.review.i2.def456abc123789012.r1.md',
        ),
        'review 2',
      );
      await fs.writeFile(
        path.join(
          routeDir,
          '1.vision.guard.review.i5.789012abc123def456.r1.md',
        ),
        'review 5',
      );
      // create judge artifact at i3
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.judge.i3.abc123def456789012.j1.md'),
        'judge 3',
      );
    });
    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] max iteration is queried', () => {
      then('returns highest iteration across all artifacts (5)', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: path.join(tempDir, '1.vision.stone'),
          guard: null,
        });
        const maxIter = await getMaxStoneGuardIteration({
          stone,
          route: tempDir,
        });
        expect(maxIter).toBe(5);
      });
    });
  });

  given('[case3] route with artifacts for different stones', () => {
    const tempDir = path.join(__dirname, '../.test/temp-iteration-multi-stone');

    beforeAll(async () => {
      const routeDir = path.join(tempDir, '.route');
      await fs.mkdir(routeDir, { recursive: true });

      // create artifacts for different stones
      await fs.writeFile(
        path.join(
          routeDir,
          '1.vision.guard.review.i3.abc123def456789012.r1.md',
        ),
        'vision review',
      );
      await fs.writeFile(
        path.join(
          routeDir,
          '2.execution.guard.review.i10.abc123def456789012.r1.md',
        ),
        'execution review',
      );
    });
    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] max iteration is queried for 1.vision', () => {
      then('returns 3 (ignores other stones)', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: path.join(tempDir, '1.vision.stone'),
          guard: null,
        });
        const maxIter = await getMaxStoneGuardIteration({
          stone,
          route: tempDir,
        });
        expect(maxIter).toBe(3);
      });
    });
  });
});
