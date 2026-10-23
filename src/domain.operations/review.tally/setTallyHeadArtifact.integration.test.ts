import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import { given, then, useThen, when } from 'test-fns';

import { setTallyHeadArtifact } from './setTallyHeadArtifact';

/**
 * .what = how many lanes rewrite and read the head at once
 * .why = a guard pours up to ten lanes per level; forty pairs widen the window a torn read
 *        would need, so an in-place write fails this suite every run
 */
const COUNT_OF_LANES = 40;

/**
 * .what = a head large enough that one write spans many reads
 * .why = a small head writes in one syscall, and a truncate-then-write would rarely be seen
 *        mid-way; a few megabytes keep each write open long enough to be read torn
 */
const asHeadOfSize = (input: { seed: string }): string =>
  `# tally head ${input.seed}\n${'count each blocker and nitpick by its label.\n'.repeat(80_000)}`;

/**
 * .what = the tally head is read whole by every lane, while every lane rewrites it
 * .why = 🔴 CLAMP. lanes of one level pour at once, and each lane that falls back to a tally
 *        rewrites this one content-keyed path, then reads it as its system message. an
 *        in-place write truncates first, so a lane mid-read met an empty or half head and
 *        could misread a verdict. the write is now an atomic swap; this suite reads torn
 *        bytes if that line reverts to an in-place write
 */
describe('setTallyHeadArtifact', () => {
  given('[case1] many lanes that rewrite and read one head at once', () => {
    when('[t0] each lane writes the head, while its peers read it', () => {
      const scene = useThen('the lanes settle', async () => {
        // a head unique to this run, so no file from a prior run is read
        const head = asHeadOfSize({ seed: randomUUID() });
        const first = await setTallyHeadArtifact({ head });

        // half the lanes rewrite the head while the other half read it
        const settled = await Promise.all(
          Array.from({ length: COUNT_OF_LANES }, (_, index) =>
            index % 2 === 0
              ? setTallyHeadArtifact({ head }).then(() => null)
              : fs.readFile(first.ref.uri, 'utf-8'),
          ),
        );

        // remove the head this run wrote
        await fs.rm(first.ref.uri, { force: true });
        return {
          head,
          reads: settled.filter((read): read is string => read !== null),
        };
      });

      then(
        '🔴 every read holds the whole head — never an empty or half one',
        () => {
          const torn = scene.reads.filter((read) => read !== scene.head);
          expect(torn.map((read) => read.length)).toEqual([]);
        },
      );

      then('every read lane read the head', () => {
        expect(scene.reads.length).toEqual(COUNT_OF_LANES / 2);
      });
    });
  });

  given('[case2] one head written twice', () => {
    when('[t0] the head is set again', () => {
      const scene = useThen('both writes settle', async () => {
        const head = `# tally head ${randomUUID()}\n`;
        const before = await setTallyHeadArtifact({ head });
        const after = await setTallyHeadArtifact({ head });
        const content = await fs.readFile(after.ref.uri, 'utf-8');
        await fs.rm(after.ref.uri, { force: true });
        return { head, before, after, content };
      });

      then('both map to one path, keyed on the head', () => {
        expect(scene.after.ref.uri).toEqual(scene.before.ref.uri);
      });

      then('the file holds the head, byte for byte', () => {
        expect(scene.content).toEqual(scene.head);
      });
    });
  });
});
