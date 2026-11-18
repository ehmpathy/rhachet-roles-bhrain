import { asJudgeMechanism } from './asJudgeMechanism';

const TEST_CASES: Array<{
  description: string;
  given: { judge: string };
  expect: string | null;
}> = [
  {
    description: 'reads the approved? mechanism',
    given: {
      judge: 'rhx route.stone.judge --mechanism approved? --stone $stone',
    },
    expect: 'approved?',
  },
  {
    description: 'reads the reviewed? mechanism via the legacy --type flag',
    given: {
      judge: 'rhx route.stone.judge --type reviewed? --allow-blockers 0',
    },
    expect: 'reviewed?',
  },
  {
    description: '🔴 a longer token is its own mechanism, never approved?',
    given: { judge: 'rhx route.stone.judge --mechanism approved?-later' },
    expect: 'approved?-later',
  },
  {
    description: 'a command with no mechanism flag names none',
    given: { judge: 'rhx route.stone.judge --stone $stone' },
    expect: null,
  },
];

describe('asJudgeMechanism', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asJudgeMechanism(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
