import { getStdoutFormDefects } from '@src/domain.operations/cli/stdout/getStdoutFormDefects';

import { asGuidanceBranches } from './asGuidanceBranches';

const TEST_CASES = [
  {
    description: 'one paragraph → one `└─` branch, its children nested beneath',
    given: ['to continue, run:', '   └─ rhx route.stone.set --as passed'],
    expect: [
      '   └─ to continue, run:',
      '         └─ rhx route.stone.set --as passed',
    ],
  },
  {
    description:
      'two paragraphs → a `├─` branch, a `│` spacer, then the `└─` branch; no blank line',
    given: [
      'as a driver, you should:',
      '   ├─ `--as passed` to proceed',
      '   └─ `--as blocked` to escalate',
      '',
      'the human will run `--as approved` when ready.',
    ],
    expect: [
      '   ├─ as a driver, you should:',
      '   │     ├─ `--as passed` to proceed',
      '   │     └─ `--as blocked` to escalate',
      '   │',
      '   └─ the human will run `--as approved` when ready.',
    ],
  },
];

describe('asGuidanceBranches', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const branches = asGuidanceBranches({
        guidance: thisCase.given.join('\n'),
      });
      expect(branches).toEqual(thisCase.expect);

      // the rendered branches, under a root, pass the treestruct check
      const text = ['🗿 route.stone.set', ...branches].join('\n');
      expect(getStdoutFormDefects({ text })).toEqual([]);
    }),
  );
});
