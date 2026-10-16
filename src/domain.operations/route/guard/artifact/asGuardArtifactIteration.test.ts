import { given, then, when } from 'test-fns';

import { asGuardArtifactIteration } from './asGuardArtifactIteration';

const TEST_CASES = [
  {
    description: 'a review artifact with a `.iNNN.` marker',
    given: { filename: '1.vision.guard.review.i3.abc123.r1.md' },
    expect: { output: 3 },
  },
  {
    description: 'a judge artifact with a `.iNNNp` marker',
    given: { filename: '1.vision.guard.judge.i12p1.abc.def.j1.md' },
    expect: { output: 12 },
  },
  {
    description: 'a zero-padded marker',
    given: { filename: '1.vision.guard.review.i008.abc.r2.md' },
    expect: { output: 8 },
  },
  {
    description: 'a peer review given, as the per-index reader sees it',
    given: {
      filename:
        '5.1.execution._.review.i011.61cfdf378573c41488.r010._.given.by_peer.lint.md',
    },
    expect: { output: 11 },
  },
  {
    description: 'a filename with no iteration marker',
    given: { filename: '1.vision.guard.review.abc.r1.md' },
    expect: { output: null },
  },
];

describe('asGuardArtifactIteration', () => {
  // one [caseN] per row, so each ordinal names one scenario in the test output
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] its iteration is read', () => {
        then(`it reads ${String(thisCase.expect.output)}`, () => {
          expect(asGuardArtifactIteration(thisCase.given)).toEqual(
            thisCase.expect.output,
          );
        });
      });
    }),
  );
});
