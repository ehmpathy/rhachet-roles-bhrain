import { asGuardJudgeVerdictMarks } from './asGuardJudgeVerdictMarks';

const TEST_CASES = [
  {
    description: 'a judge that passed, with a reason',
    given: { content: 'passed: true\nreason: all reviews approved' },
    expect: { output: { passed: true, reason: 'all reviews approved' } },
  },
  {
    description: 'a judge that failed, upper-cased mark',
    given: { content: 'PASSED: FALSE\nReason:   2 blockers remain  ' },
    expect: { output: { passed: false, reason: '2 blockers remain' } },
  },
  {
    description: 'a judge that printed no marks',
    given: { content: 'command not found: rhx' },
    expect: { output: { passed: null, reason: null } },
  },
  {
    description: 'a judge with a verdict but no reason',
    given: { content: 'passed: true' },
    expect: { output: { passed: true, reason: null } },
  },
];

describe('asGuardJudgeVerdictMarks', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asGuardJudgeVerdictMarks(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
