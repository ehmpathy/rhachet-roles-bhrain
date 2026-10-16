import { getOneMsOfPokeWait } from './getOneMsOfPokeWait';

const TEST_CASES = [
  {
    description: 'no caller bound takes the wedge',
    given: { msOfCaller: null, msOfWedge: 120_000 },
    expect: { output: 120_000 },
  },
  {
    description:
      '🔴 a caller bound shorter than the wedge wins — a lane with 30s left waits 30s',
    given: { msOfCaller: 30_000, msOfWedge: 120_000 },
    expect: { output: 30_000 },
  },
  {
    description:
      '🔴 a caller bound longer than the wedge is capped — a wedge is still caught',
    given: { msOfCaller: 600_000, msOfWedge: 120_000 },
    expect: { output: 120_000 },
  },
  {
    description: 'a spent lane waits naught',
    given: { msOfCaller: 0, msOfWedge: 120_000 },
    expect: { output: 0 },
  },
];

describe('getOneMsOfPokeWait', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getOneMsOfPokeWait(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
