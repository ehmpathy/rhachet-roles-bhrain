import { genLogDirName } from '@src/domain.operations/review/genLogDirName';

import { asReviewRunDirs } from './asReviewRunDirs';

/**
 * .what = a directory entry, in the two fields the transformer reads
 */
const asEntry = (input: { name: string; dir: boolean }) => ({
  name: input.name,
  isDirectory: () => input.dir,
});

const RUN_EARLIER = genLogDirName();
const RUN_LATER = genLogDirName();

const TEST_CASES = [
  {
    description: 'keeps a minted run dir, joined to the root',
    given: { entries: [asEntry({ name: RUN_EARLIER, dir: true })] },
    expect: { output: [`/logs/${RUN_EARLIER}`] },
  },
  {
    description: '🔴 drops a stray dir the mint grammar never named',
    given: {
      entries: [
        asEntry({ name: 'zzz-debug', dir: true }),
        asEntry({ name: RUN_EARLIER, dir: true }),
      ],
    },
    expect: { output: [`/logs/${RUN_EARLIER}`] },
  },
  {
    description: 'drops a file, even one that carries a run name',
    given: { entries: [asEntry({ name: RUN_EARLIER, dir: false })] },
    expect: { output: [] },
  },
  {
    description: 'answers the runs sorted',
    given: {
      entries: [
        asEntry({ name: RUN_LATER, dir: true }),
        asEntry({ name: RUN_EARLIER, dir: true }),
      ],
    },
    expect: {
      output: [`/logs/${RUN_EARLIER}`, `/logs/${RUN_LATER}`].sort(),
    },
  },
];

describe('asReviewRunDirs', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        asReviewRunDirs({ root: '/logs', entries: thisCase.given.entries }),
      ).toEqual(thisCase.expect.output);
    }),
  );
});
