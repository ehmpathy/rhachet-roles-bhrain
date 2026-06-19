import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getAllStoneGuardArtifactsByHash } from './getAllStoneGuardArtifactsByHash';

describe('getAllStoneGuardArtifactsByHash', () => {
  given('[case1] route with no .reviews/peer or .route directory', () => {
    const routePath = path.join(os.tmpdir(), `test-no-route-${Date.now()}`);
    const stone = new RouteStone({
      name: '1.vision',
      path: path.join(routePath, '1.vision.stone'),
      guard: null,
    });

    when('[t0] artifacts are fetched', () => {
      then('returns empty arrays', async () => {
        const result = await getAllStoneGuardArtifactsByHash({
          stone,
          hash: 'abc123',
          route: routePath,
        });
        expect(result.reviews).toHaveLength(0);
        expect(result.judges).toHaveLength(0);
      });
    });
  });

  given('[case2] route with prior review and judge files', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-guard-artifacts-${Date.now()}`,
    );
    const reviewsDir = path.join(tempDir, '.reviews', 'peer');
    const routeDir = path.join(tempDir, '.route');
    const testHash = 'abc123def456';
    const stone = new RouteStone({
      name: '1.vision',
      path: path.join(tempDir, '1.vision.stone'),
      guard: null,
    });

    beforeEach(async () => {
      await fs.mkdir(reviewsDir, { recursive: true });
      await fs.mkdir(routeDir, { recursive: true });

      // create review file in .reviews/peer/ with new filename pattern
      await fs.writeFile(
        path.join(
          reviewsDir,
          `1.vision._.review.i1.${testHash}.r1._.given.by_peer.test-reviewer.md`,
        ),
        `├─ stdout
│  ├─
│  │  🦉 needs your talons
│  │     └─ summary
│  │        ├─ 2 blockers 🔴
│  │        └─ 3 nitpicks 🟠
│  └─
├─ stderr
│  └─`,
      );

      // create judge file in .route/ (judges still live there)
      await fs.writeFile(
        path.join(routeDir, `1.vision.guard.judge.i1.${testHash}.j1.md`),
        `passed: false
reason: blockers found`,
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] artifacts are fetched for the hash', () => {
      then('returns review artifacts', async () => {
        const result = await getAllStoneGuardArtifactsByHash({
          stone,
          hash: testHash,
          route: tempDir,
        });
        expect(result.reviews).toHaveLength(1);
        expect(result.reviews[0]?.blockers).toEqual(2);
        expect(result.reviews[0]?.nitpicks).toEqual(3);
      });

      then('returns judge artifacts', async () => {
        const result = await getAllStoneGuardArtifactsByHash({
          stone,
          hash: testHash,
          route: tempDir,
        });
        expect(result.judges).toHaveLength(1);
        expect(result.judges[0]?.passed).toEqual(false);
        expect(result.judges[0]?.reason).toEqual('blockers found');
      });
    });

    when('[t1] artifacts are fetched for a different hash', () => {
      then('returns empty arrays', async () => {
        const result = await getAllStoneGuardArtifactsByHash({
          stone,
          hash: 'different-hash',
          route: tempDir,
        });
        expect(result.reviews).toHaveLength(0);
        expect(result.judges).toHaveLength(0);
      });
    });
  });

  given('[case3] review with zero blockers', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-guard-zero-blockers-${Date.now()}`,
    );
    const reviewsDir = path.join(tempDir, '.reviews', 'peer');
    const testHash = 'zeroblockershash';
    const stone = new RouteStone({
      name: '1.vision',
      path: path.join(tempDir, '1.vision.stone'),
      guard: null,
    });

    beforeEach(async () => {
      await fs.mkdir(reviewsDir, { recursive: true });

      // create review file with zero blockers (approved format)
      await fs.writeFile(
        path.join(
          reviewsDir,
          `1.vision._.review.i1.${testHash}.r1._.given.by_peer.test-reviewer.md`,
        ),
        `├─ stdout
│  ├─
│  │  🦉 the way speaks for itself
│  │     └─ summary
│  │        ├─ 0 blockers ✓
│  │        └─ 0 nitpicks ✓
│  └─
├─ stderr
│  └─`,
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] artifacts are fetched', () => {
      then('returns review with zero blockers', async () => {
        const result = await getAllStoneGuardArtifactsByHash({
          stone,
          hash: testHash,
          route: tempDir,
        });
        expect(result.reviews).toHaveLength(1);
        expect(result.reviews[0]?.blockers).toEqual(0);
        expect(result.reviews[0]?.nitpicks).toEqual(0);
      });
    });
  });

  given('[case4] review with singular blocker/nitpick', () => {
    const tempDir = path.join(os.tmpdir(), `test-guard-singular-${Date.now()}`);
    const reviewsDir = path.join(tempDir, '.reviews', 'peer');
    const testHash = 'singularhash';
    const stone = new RouteStone({
      name: '1.vision',
      path: path.join(tempDir, '1.vision.stone'),
      guard: null,
    });

    beforeEach(async () => {
      await fs.mkdir(reviewsDir, { recursive: true });

      // create review file with singular forms
      await fs.writeFile(
        path.join(
          reviewsDir,
          `1.vision._.review.i1.${testHash}.r1._.given.by_peer.test-reviewer.md`,
        ),
        `├─ stdout
│  ├─
│  │  🦉 needs your talons
│  │     └─ summary
│  │        ├─ 1 blocker 🔴
│  │        └─ 1 nitpick 🟠
│  └─
├─ stderr
│  └─`,
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] artifacts are fetched', () => {
      then('returns review with singular counts', async () => {
        const result = await getAllStoneGuardArtifactsByHash({
          stone,
          hash: testHash,
          route: tempDir,
        });
        expect(result.reviews).toHaveLength(1);
        expect(result.reviews[0]?.blockers).toEqual(1);
        expect(result.reviews[0]?.nitpicks).toEqual(1);
      });
    });
  });

  given('[case5] review with duration in stdout', () => {
    const tempDir = path.join(os.tmpdir(), `test-guard-duration-${Date.now()}`);
    const reviewsDir = path.join(tempDir, '.reviews', 'peer');
    const testHash = 'durationhash';
    const stone = new RouteStone({
      name: '1.vision',
      path: path.join(tempDir, '1.vision.stone'),
      guard: null,
    });

    beforeEach(async () => {
      await fs.mkdir(reviewsDir, { recursive: true });

      // create review file with duration in metrics.realized
      await fs.writeFile(
        path.join(
          reviewsDir,
          `1.vision._.review.i1.${testHash}.r1._.given.by_peer.test-reviewer.md`,
        ),
        `├─ stdout
│  ├─
│  │  🦉 the way speaks for itself
│  │     └─ summary
│  │        ├─ 0 blockers ✓
│  │        └─ 0 nitpicks ✓
│  │  ✨ metrics.realized
│  │     └─ time
│  │        └─ total: 51455ms
│  └─
├─ stderr
│  └─`,
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] artifacts are fetched', () => {
      then('returns review with duration parsed', async () => {
        const result = await getAllStoneGuardArtifactsByHash({
          stone,
          hash: testHash,
          route: tempDir,
        });
        expect(result.reviews).toHaveLength(1);
        expect(result.reviews[0]?.durationMs).toEqual(51455);
      });
    });
  });

  given('[case6] review without duration in stdout', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-guard-no-duration-${Date.now()}`,
    );
    const reviewsDir = path.join(tempDir, '.reviews', 'peer');
    const testHash = 'nodurationhash';
    const stone = new RouteStone({
      name: '1.vision',
      path: path.join(tempDir, '1.vision.stone'),
      guard: null,
    });

    beforeEach(async () => {
      await fs.mkdir(reviewsDir, { recursive: true });

      // create review file without duration
      await fs.writeFile(
        path.join(
          reviewsDir,
          `1.vision._.review.i1.${testHash}.r1._.given.by_peer.test-reviewer.md`,
        ),
        `├─ stdout
│  ├─
│  │  🦉 the way speaks for itself
│  │     └─ summary
│  │        ├─ 0 blockers ✓
│  │        └─ 0 nitpicks ✓
│  └─
├─ stderr
│  └─`,
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] artifacts are fetched', () => {
      then('returns review with null duration', async () => {
        const result = await getAllStoneGuardArtifactsByHash({
          stone,
          hash: testHash,
          route: tempDir,
        });
        expect(result.reviews).toHaveLength(1);
        expect(result.reviews[0]?.durationMs).toBeNull();
      });
    });
  });
});
