import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getOneStoneJudgeInputHash } from './getOneStoneJudgeInputHash';

/**
 * .what = basenames to delete from disk right after the enumerator lists them
 * .why = replays the race the operation must survive: a review that is listed, then removed
 *        (a rewind, a clean) before its read. the name carries the `mock` prefix so the
 *        hoisted jest.mock factory below may reference it
 */
const mockBasenamesToVanish = new Set<string>();

/**
 * .mock = the review enumerator, wrapped around its real implementation
 * .why = the race between list and read is too narrow to hit on demand. the wrapper calls the
 *        REAL enumerator (a real glob over a real dir), then deletes the marked files from the
 *        real disk before it returns — so the read that follows meets a true absence. no result
 *        is faked: the list is the real list, the read is the real read
 * .real = the control route below is hashed through the same wrapper with no file marked, so
 *         it runs the enumerator unaltered
 */
jest.mock('../guard/review/peer/enumRouteGuardReviewPeerFiles', () => {
  const fsActual = jest.requireActual('fs/promises');
  const pathActual = jest.requireActual('path');
  const actual = jest.requireActual(
    '../guard/review/peer/enumRouteGuardReviewPeerFiles',
  );
  return {
    enumRouteGuardReviewPeerFiles: async (input: unknown) => {
      const files: string[] = await actual.enumRouteGuardReviewPeerFiles(input);
      await Promise.all(
        files
          .filter((file) =>
            mockBasenamesToVanish.has(pathActual.basename(file)),
          )
          .map((file) => fsActual.rm(file)),
      );
      return files;
    },
  };
});

const CONTENT_OF_REVIEW = `├─ stdout
│  ├─
│  │  🦉 needs your talons
│  │     └─ summary
│  │        ├─ 1 blocker 🔴
│  │        └─ 0 nitpicks 🟠
│  └─
├─ stderr
│  └─`;

describe('getOneStoneJudgeInputHash', () => {
  given('[case1] a review file deleted between list and read', () => {
    const hash = 'abc123def456';
    const reviewKept = `1.vision._.review.i001.${hash}.r001._.given.by_peer.kept.md`;
    const reviewVanished = `1.vision._.review.i001.${hash}.r002._.given.by_peer.vanished.md`;

    // the route under test holds both reviews; the vanished one is deleted after its list
    const routeRaced = genTempDir({ slug: 'judge-input-hash-vanished' });

    // the control route only ever held the kept review
    const routeControl = genTempDir({ slug: 'judge-input-hash-control' });

    const asStone = (route: string) =>
      new RouteStone({
        name: '1.vision',
        path: path.join(route, '1.vision.stone'),
        guard: null,
      });

    beforeAll(async () => {
      const reviewsRaced = path.join(routeRaced, '.reviews', 'peer');
      const reviewsControl = path.join(routeControl, '.reviews', 'peer');
      await fs.mkdir(reviewsRaced, { recursive: true });
      await fs.mkdir(reviewsControl, { recursive: true });
      await fs.writeFile(
        path.join(reviewsRaced, reviewKept),
        CONTENT_OF_REVIEW,
      );
      await fs.writeFile(
        path.join(reviewsRaced, reviewVanished),
        CONTENT_OF_REVIEW,
      );
      await fs.writeFile(
        path.join(reviewsControl, reviewKept),
        CONTENT_OF_REVIEW,
      );
      mockBasenamesToVanish.add(reviewVanished);
    });

    afterAll(() => {
      mockBasenamesToVanish.clear();
    });

    when('[t0] the judge input hash is computed', () => {
      const raced = useThen('it does not throw', async () => ({
        hash: await getOneStoneJudgeInputHash({
          stone: asStone(routeRaced),
          reviewInputHash: hash,
          route: routeRaced,
        }),
      }));

      then('the vanished review is truly absent from disk', async () => {
        await expect(
          fs.stat(path.join(routeRaced, '.reviews', 'peer', reviewVanished)),
        ).rejects.toMatchObject({ code: 'ENOENT' });
      });

      then(
        'the hash omits the vanished review: it equals the hash of a route that never held it',
        async () => {
          const hashControl = await getOneStoneJudgeInputHash({
            stone: asStone(routeControl),
            reviewInputHash: hash,
            route: routeControl,
          });
          expect(raced.hash).toEqual(hashControl);
        },
      );
    });
  });
});
