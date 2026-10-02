import { getStdoutFormDefects } from './getStdoutFormDefects';

/**
 * .what = each shape a stdout took before `S13`, and each shape it takes now
 * .why = the integration sweep proves the repo is clean today; these prove the check still
 *        BITES — each off-form row is a real render this repo shipped
 */
const TEST_CASES = [
  {
    description: 'a tree whose every line is a branch → clean',
    given: [
      '🗿 route.stone.set',
      '   ├─ stone = 1.plan',
      '   │',
      '   └─ as a driver, you should:',
      '      ├─ `--as passed` to proceed',
      '      └─ `--as blocked` to escalate',
    ],
    expect: [],
  },
  {
    description: 'a vibe line, a blank, then the tree → clean',
    given: ['🦉 where were we?', '', '🗿 route.drive', '   └─ stone = 1.plan'],
    expect: [],
  },
  {
    description:
      'the flat guard advisory — prose leaves under a root → flat-leaf',
    given: [
      '🗿 guard: `brian:` is not a key i know',
      '   ├─ at: 1.vision.guard:3',
      '   fix: rename it to `brain:`',
    ],
    expect: [
      { line: 3, kind: 'flat-leaf', text: '   fix: rename it to `brain:`' },
    ],
  },
  {
    description:
      'the guidance note hung after a blank beneath a `└─` → flat-leaf, the blank does not rescue it',
    given: [
      '🗿 route.stone.set',
      '   ├─ ✗ only humans can approve',
      '   │',
      '   └─ as a driver, you should:',
      '      └─ `--as blocked` to escalate',
      '',
      '      the human will run `--as approved` when ready.',
    ],
    expect: [
      {
        line: 7,
        kind: 'flat-leaf',
        text: '      the human will run `--as approved` when ready.',
      },
    ],
  },
  {
    description:
      'a base-indent line after an unindented vibe line shut the tree → rootless-leaf',
    given: [
      '🗿 route.drive',
      '   └─ ✋ halted, brain switch could not land',
      '🦉 patience',
      '   the stone prescribes = opus',
    ],
    expect: [
      {
        line: 4,
        kind: 'rootless-leaf',
        text: '   the stone prescribes = opus',
      },
    ],
  },
  {
    description: 'a vibe line with no tree anywhere → not graded',
    given: ['🦉 hold on', '', '   the stone prescribes = opus'],
    expect: [],
  },
  {
    description: 'a json body — no root at all → not graded',
    given: ['{', '  "stone": "1.plan"', '}'],
    expect: [],
  },
];

describe('getStdoutFormDefects', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const defects = getStdoutFormDefects({ text: thisCase.given.join('\n') });
      expect(defects).toEqual(thisCase.expect);
    }),
  );
});
