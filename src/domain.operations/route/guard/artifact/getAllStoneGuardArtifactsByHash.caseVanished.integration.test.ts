import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getAllStoneGuardArtifactsByHash } from './getAllStoneGuardArtifactsByHash';

/**
 * .what = basenames to delete from disk right after the enumerator lists them
 * .why = replays the race the operation must survive: a file that is listed, then removed
 *        (a rewind, a clean) before its read. the name carries the `mock` prefix so the
 *        hoisted jest.mock factories below may reference it
 */
const mockBasenamesToVanish = new Set<string>();

/**
 * .what = deletes each listed path whose basename is marked to vanish, then returns the list
 * .why = the listed paths stay exactly what the real enumerator found; only the disk moves
 */
const mockVanishAfterList = async (files: string[]): Promise<string[]> => {
  await Promise.all(
    files
      .filter((file) => mockBasenamesToVanish.has(path.basename(file)))
      .map((file) => fs.rm(file)),
  );
  return files;
};

/**
 * .mock = the review + judge enumerators, wrapped around their real implementations
 * .why = the race between list and read is too narrow to hit on demand. each wrapper calls the
 *        REAL enumerator (a real glob over a real dir), then deletes the marked files from the
 *        real disk before it returns — so the read that follows meets a true absence. no result
 *        is faked: the list is the real list, the read is the real read
 * .real = case1 and case2 of getAllStoneGuardArtifactsByHash.test.ts run the same operation
 *         with no wrapper at all
 */
jest.mock('../review/peer/enumRouteGuardReviewPeerFiles', () => {
  const actual = jest.requireActual(
    '../review/peer/enumRouteGuardReviewPeerFiles',
  );
  return {
    enumRouteGuardReviewPeerFiles: async (input: unknown) =>
      mockVanishAfterList(await actual.enumRouteGuardReviewPeerFiles(input)),
  };
});
jest.mock('../judge/enumRouteGuardJudgeFiles', () => {
  const actual = jest.requireActual('../judge/enumRouteGuardJudgeFiles');
  return {
    enumRouteGuardJudgeFiles: async (input: unknown) =>
      mockVanishAfterList(await actual.enumRouteGuardJudgeFiles(input)),
  };
});

const CONTENT_OF_REVIEW = `├─ stdout
│  ├─
│  │  🦉 needs your talons
│  │     └─ summary
│  │        ├─ 2 blockers 🔴
│  │        └─ 3 nitpicks 🟠
│  └─
├─ stderr
│  └─`;

const CONTENT_OF_JUDGE = `passed: false
reason: blockers found`;

describe('getAllStoneGuardArtifactsByHash', () => {
  given(
    '[case1] a review and a judge file deleted between list and read',
    () => {
      const tempDir = genTempDir({ slug: 'guard-artifacts-vanished' });
      const reviewsDir = path.join(tempDir, '.reviews', 'peer');
      const routeDir = path.join(tempDir, '.route');
      const hash = 'abc123def456';
      const stone = new RouteStone({
        name: '1.vision',
        path: path.join(tempDir, '1.vision.stone'),
        guard: null,
      });
      const reviewKept = `1.vision._.review.i001.${hash}.r001._.given.by_peer.kept.md`;
      const reviewVanished = `1.vision._.review.i001.${hash}.r002._.given.by_peer.vanished.md`;
      const judgeKept = `1.vision.guard.judge.i1.${hash}.j1.md`;
      const judgeVanished = `1.vision.guard.judge.i1.${hash}.j2.md`;

      beforeAll(async () => {
        await fs.mkdir(reviewsDir, { recursive: true });
        await fs.mkdir(routeDir, { recursive: true });
        await fs.writeFile(
          path.join(reviewsDir, reviewKept),
          CONTENT_OF_REVIEW,
        );
        await fs.writeFile(
          path.join(reviewsDir, reviewVanished),
          CONTENT_OF_REVIEW,
        );
        await fs.writeFile(path.join(routeDir, judgeKept), CONTENT_OF_JUDGE);
        await fs.writeFile(
          path.join(routeDir, judgeVanished),
          CONTENT_OF_JUDGE,
        );
        mockBasenamesToVanish.add(reviewVanished);
        mockBasenamesToVanish.add(judgeVanished);
      });

      afterAll(() => {
        mockBasenamesToVanish.clear();
      });

      when('[t0] artifacts are fetched for the hash', () => {
        const result = useThen('it does not throw', async () =>
          getAllStoneGuardArtifactsByHash({ stone, hash, route: tempDir }),
        );

        then('the vanished review is omitted, the kept one returned', () => {
          expect(
            result.reviews.map((review) => path.basename(review.path)),
          ).toEqual([reviewKept]);
        });

        then('the vanished judge is omitted, the kept one returned', () => {
          expect(
            result.judges.map((judge) => path.basename(judge.path)),
          ).toEqual([judgeKept]);
        });

        then('the vanished files are truly absent from disk', async () => {
          await expect(
            fs.stat(path.join(reviewsDir, reviewVanished)),
          ).rejects.toMatchObject({ code: 'ENOENT' });
          await expect(
            fs.stat(path.join(routeDir, judgeVanished)),
          ).rejects.toMatchObject({ code: 'ENOENT' });
        });
      });
    },
  );
});
