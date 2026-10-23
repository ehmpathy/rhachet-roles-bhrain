import { asGuardJudgeIndex } from './asGuardJudgeIndex';

const TEST_CASES = [
  {
    description: 'a judge artifact with a `.jNNN.md` suffix',
    given: { filename: '1.vision.guard.judge.i12p1.abc.def.j1.md' },
    expect: { output: 1 },
  },
  {
    description: 'a multi-digit judge index',
    given: { filename: '1.vision.guard.judge.i3p2.abc.def.j14.md' },
    expect: { output: 14 },
  },
  {
    description: 'a zero-padded judge index',
    given: { filename: '1.vision.guard.judge.i3p2.abc.def.j007.md' },
    expect: { output: 7 },
  },
  {
    description: 'a review artifact, which carries no judge index',
    given: { filename: '1.vision.guard.review.i3.abc123.r1.md' },
    expect: { output: null },
  },
  {
    description: 'a `.jNNN` marker not at the end of the name',
    given: { filename: '1.vision.guard.judge.j2.abc.md' },
    expect: { output: null },
  },
];

describe('asGuardJudgeIndex', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asGuardJudgeIndex(thisCase.given)).toEqual(thisCase.expect.output);
    }),
  );
});
