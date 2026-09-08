import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getLatestReviewArtifactForSlug } from './getLatestReviewArtifactForSlug';

/**
 * .what = a minimal peer-review artifact body with the counts the parser reads
 * .why = every case below varies only its counts, so the body is derived rather than pasted
 */
const asReviewContent = (input: {
  blockers: number;
  nitpicks: number;
}): string => `├─ stdout
│  ├─
│  │
│  │  🦉 needs your talons
│  │     └─ summary
│  │        ├─ ${input.blockers} blockers 🔴
│  │        └─ ${input.nitpicks} nitpicks 🟠
│  │
│  └─
├─ stderr
│  ├─
│  │
│  └─`;

describe('getLatestReviewArtifactForSlug', () => {
  given('[case1] one stone, two reviewers, three iterations', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-route-'));
      const reviewsDir = path.join(tempDir, '.reviews', 'peer');
      await fs.mkdir(reviewsDir, { recursive: true });

      // filename grammar: $stone._.review.i$iter.$hash.r$idx._.given.by_peer.$slug.md
      // (i/r are zero-padded — asStoneGuardCounter)
      //
      // ⚠️ each reviewer sits at its OWN index and carries its OWN slug, because that is the
      //    only shape a real guard config can produce: a slug appears once, so a
      //    (slug, iteration) pair is unique and "latest" is never a tie.
      const files: { name: string; blockers: number; nitpicks: number }[] = [
        // alpha speaks three times, across three distinct hashes
        {
          name: 'test.stone._.review.i001.a1b2c3d4.r001._.given.by_peer.alpha.md',
          blockers: 2,
          nitpicks: 1,
        },
        {
          name: 'test.stone._.review.i002.e5f6a7b8.r001._.given.by_peer.alpha.md',
          blockers: 5,
          nitpicks: 3,
        },
        {
          name: 'test.stone._.review.i003.c9d0e1f2.r001._.given.by_peer.alpha.md',
          blockers: 8,
          nitpicks: 1,
        },
        // beta speaks once, at the newest hash, from a different rung
        {
          name: 'test.stone._.review.i003.c9d0e1f2.r002._.given.by_peer.beta.md',
          blockers: 4,
          nitpicks: 2,
        },
      ];
      await Promise.all(
        files.map((file) =>
          fs.writeFile(path.join(reviewsDir, file.name), asReviewContent(file)),
        ),
      );

      const stone = {
        name: 'test.stone',
        path: path.join(tempDir, 'test.stone.stone'),
      } as RouteStone;

      return { tempDir, stone };
    });

    afterAll(async () => {
      await fs.rm(scene.tempDir, { recursive: true, force: true });
    });

    when(
      '[t0] the latest is asked for by the slug that spoke three times',
      () => {
        then('returns i003 — the highest iteration for that slug', async () => {
          const result = await getLatestReviewArtifactForSlug({
            stone: scene.stone,
            index: 1,
            slug: 'alpha',
            route: scene.tempDir,
          });
          expect(result).not.toBeNull();
          expect(result?.iteration).toBe(3);
          expect(result?.index).toBe(1);
          expect(result?.blockers).toBe(8);
          expect(result?.nitpicks).toBe(1);
        });
      },
    );

    when('[t1] the latest is asked for by the other slug', () => {
      then(
        'returns that reviewer own artifact, never its neighbour',
        async () => {
          const result = await getLatestReviewArtifactForSlug({
            stone: scene.stone,
            index: 2,
            slug: 'beta',
            route: scene.tempDir,
          });
          expect(result).not.toBeNull();
          expect(result?.index).toBe(2);
          expect(result?.blockers).toBe(4);
          expect(result?.nitpicks).toBe(2);
        },
      );
    });

    when('[t2] the slug asked for never spoke on this stone', () => {
      then('returns null', async () => {
        const result = await getLatestReviewArtifactForSlug({
          stone: scene.stone,
          index: 9,
          slug: 'never-enrolled',
          route: scene.tempDir,
        });
        expect(result).toBeNull();
      });
    });
  });

  given('[case2] no .reviews/peer directory', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-route-'));
      // no .reviews/peer dir
      const stone = {
        name: 'test.stone',
        path: path.join(tempDir, 'test.stone.stone'),
      } as RouteStone;
      return { tempDir, stone };
    });

    afterAll(async () => {
      await fs.rm(scene.tempDir, { recursive: true, force: true });
    });

    when('[t0] the latest is asked for', () => {
      then('returns null', async () => {
        const result = await getLatestReviewArtifactForSlug({
          stone: scene.stone,
          index: 1,
          slug: 'alpha',
          route: scene.tempDir,
        });
        expect(result).toBeNull();
      });
    });
  });

  /**
   * 🔴 the regression clamp for the defect this operation was rekeyed to close.
   *
   * a reviewer is retired from the guard config after it has already spoken, and a NEW reviewer
   * is enrolled at the rung it vacated. an index-keyed lookup enumerates `r001` and hands the
   * successor its predecessor's verdict — rendered as `r1: successor` with given/taken paths that
   * both read `by_peer.departed.md` (r006 blocker.2, i025).
   *
   * ⚠️ this case FAILS under the prior index key and PASSES under the slug key, which is what
   *    makes it a clamp rather than a restatement (rule.require.clamp-edge-cases).
   */
  given('[case3] a retired reviewer rung is reused by its successor', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-route-'));
      const reviewsDir = path.join(tempDir, '.reviews', 'peer');
      await fs.mkdir(reviewsDir, { recursive: true });

      // `departed` spoke at r001 and was then retired from the config
      await fs.writeFile(
        path.join(
          reviewsDir,
          'test.stone._.review.i001.a1b2c3d4.r001._.given.by_peer.departed.md',
        ),
        asReviewContent({ blockers: 1, nitpicks: 0 }),
      );
      // `successor` now occupies r001 and has NOT spoken — it owns no artifact

      const stone = {
        name: 'test.stone',
        path: path.join(tempDir, 'test.stone.stone'),
      } as RouteStone;
      return { tempDir, stone };
    });

    afterAll(async () => {
      await fs.rm(scene.tempDir, { recursive: true, force: true });
    });

    when('[t0] the successor at the reused rung is looked up', () => {
      then(
        'returns null — it does NOT inherit the departed reviewer verdict',
        async () => {
          const result = await getLatestReviewArtifactForSlug({
            stone: scene.stone,
            index: 1, // the SAME rung the departed reviewer held
            slug: 'successor',
            route: scene.tempDir,
          });
          expect(result).toBeNull();
        },
      );
    });

    when('[t1] the departed reviewer is looked up by its own slug', () => {
      then(
        'still returns its own artifact — the debt is not erased',
        async () => {
          const result = await getLatestReviewArtifactForSlug({
            stone: scene.stone,
            index: 1,
            slug: 'departed',
            route: scene.tempDir,
          });
          expect(result).not.toBeNull();
          expect(result?.blockers).toBe(1);
        },
      );
    });
  });

  /**
   * ⚠️ the write side swaps a path separator in a slug for a hyphen
   * (asSanitizedPeerReviewSlug), so the read side must compare in that same form. a config slug
   * that carries a separator would otherwise never match its own files.
   */
  given('[case4] a config slug that carries a path separator', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-route-'));
      const reviewsDir = path.join(tempDir, '.reviews', 'peer');
      await fs.mkdir(reviewsDir, { recursive: true });

      // on disk the separator is already a hyphen — that is what the write side puts there
      await fs.writeFile(
        path.join(
          reviewsDir,
          'test.stone._.review.i001.a1b2c3d4.r001._.given.by_peer.rules-mech-defects.md',
        ),
        asReviewContent({ blockers: 3, nitpicks: 0 }),
      );

      const stone = {
        name: 'test.stone',
        path: path.join(tempDir, 'test.stone.stone'),
      } as RouteStone;
      return { tempDir, stone };
    });

    afterAll(async () => {
      await fs.rm(scene.tempDir, { recursive: true, force: true });
    });

    when('[t0] the lookup passes the UNSANITIZED config slug', () => {
      then('still matches — the slug is sanitized before compare', async () => {
        const result = await getLatestReviewArtifactForSlug({
          stone: scene.stone,
          index: 1,
          slug: 'rules/mech/defects',
          route: scene.tempDir,
        });
        expect(result).not.toBeNull();
        expect(result?.blockers).toBe(3);
      });
    });
  });
});
