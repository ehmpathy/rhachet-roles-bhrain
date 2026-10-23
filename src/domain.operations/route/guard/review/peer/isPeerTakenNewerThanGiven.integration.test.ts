import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { isPeerTakenNewerThanGiven } from './isPeerTakenNewerThanGiven';

const NAME_GIVEN = '1.test._.review.i001.abc123.r001._.given.by_peer.lane-a.md';
const NAME_TAKEN = '1.test._.review.i001.abc123.r001._.taken.by_self.lane-a.md';

/**
 * .what = writes a file and stamps its mtime, so the order of two files is set, not raced
 */
const setFileAtMtime = async (input: {
  path: string;
  mtimeMs: number;
}): Promise<void> => {
  await fs.writeFile(input.path, 'x\n');
  const at = new Date(input.mtimeMs);
  await fs.utimes(input.path, at, at);
};

describe('isPeerTakenNewerThanGiven', () => {
  given('[case1] a given with no taken beside it', () => {
    const scene = useBeforeAll(async () => {
      const dir = genTempDir({ slug: 'taken-newer-absent' });
      await setFileAtMtime({ path: path.join(dir, NAME_GIVEN), mtimeMs: 1e12 });
      return { dir };
    });

    when('[t0] it is asked', () => {
      then('there is no response to reconsider', async () => {
        expect(
          await isPeerTakenNewerThanGiven({
            pathGiven: path.join(scene.dir, NAME_GIVEN),
          }),
        ).toEqual(false);
      });
    });
  });

  given('[case2] a taken written after its given', () => {
    const scene = useBeforeAll(async () => {
      const dir = genTempDir({ slug: 'taken-newer-after' });
      await setFileAtMtime({ path: path.join(dir, NAME_GIVEN), mtimeMs: 1e12 });
      await setFileAtMtime({
        path: path.join(dir, NAME_TAKEN),
        mtimeMs: 1e12 + 60_000,
      });
      return { dir };
    });

    when('[t0] it is asked', () => {
      then('the reviewer must reconsider', async () => {
        expect(
          await isPeerTakenNewerThanGiven({
            pathGiven: path.join(scene.dir, NAME_GIVEN),
          }),
        ).toEqual(true);
      });
    });
  });

  given('[case3] a given re-written after its taken', () => {
    const scene = useBeforeAll(async () => {
      const dir = genTempDir({ slug: 'taken-newer-before' });
      await setFileAtMtime({
        path: path.join(dir, NAME_TAKEN),
        mtimeMs: 1e12,
      });
      await setFileAtMtime({
        path: path.join(dir, NAME_GIVEN),
        mtimeMs: 1e12 + 60_000,
      });
      return { dir };
    });

    when('[t0] it is asked', () => {
      then('the trigger has cleared', async () => {
        expect(
          await isPeerTakenNewerThanGiven({
            pathGiven: path.join(scene.dir, NAME_GIVEN),
          }),
        ).toEqual(false);
      });
    });
  });
});
