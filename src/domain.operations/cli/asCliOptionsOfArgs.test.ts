import { asCliOptionsOfArgs } from './asCliOptionsOfArgs';

const BOOLEANS = ['help', 'full'] as const;

/**
 * .what = data-driven cases for asCliOptionsOfArgs across flag shapes
 * .why = 🔴 the defect: a bare value flag read as the string 'true', so `--stone` with no
 *        value named a stone `true`. these cases pin that a bare value flag sets naught and
 *        is named in `valueless`, while a declared boolean still reads bare
 */
const CASES: {
  description: string;
  args: string[];
  expected: ReturnType<typeof asCliOptionsOfArgs>;
}[] = [
  {
    description: 'a flag with a value reads that value',
    args: ['--stone', '1.vision', '--route', '.behavior/x'],
    expected: {
      options: { stone: '1.vision', route: '.behavior/x' },
      optionsMulti: { stone: ['1.vision'], route: ['.behavior/x'] },
      valueless: [],
    },
  },
  {
    description: '🔴 a bare value flag sets naught, and is named valueless',
    args: ['--stone', '--route', '.behavior/x'],
    expected: {
      options: { route: '.behavior/x' },
      optionsMulti: { route: ['.behavior/x'] },
      valueless: ['stone'],
    },
  },
  {
    description: '🔴 a bare value flag at the tail is named valueless',
    args: ['--for', 'review', '--peer'],
    expected: {
      options: { for: 'review' },
      optionsMulti: { for: ['review'] },
      valueless: ['peer'],
    },
  },
  {
    description: 'a declared boolean typed bare reads as true, not valueless',
    args: ['--help'],
    expected: {
      options: { help: 'true' },
      optionsMulti: { help: ['true'] },
      valueless: [],
    },
  },
  {
    description: 'a declared boolean beside value flags reads as true',
    args: ['--stone', '5.1', '--full', '--route', 'r'],
    expected: {
      options: { stone: '5.1', full: 'true', route: 'r' },
      optionsMulti: { stone: ['5.1'], full: ['true'], route: ['r'] },
      valueless: [],
    },
  },
  {
    description:
      '🔴 a declared boolean never takes a value; the word after it stays positional',
    args: ['--full', 'foo', '--stone', '5.1'],
    expected: {
      options: { full: 'true', stone: '5.1' },
      optionsMulti: { full: ['true'], stone: ['5.1'] },
      valueless: [],
    },
  },
  {
    description:
      'a repeated key keeps its last value, and every value in multi',
    args: ['--mode', 'plan', '--mode', 'apply'],
    expected: {
      options: { mode: 'apply' },
      optionsMulti: { mode: ['plan', 'apply'] },
      valueless: [],
    },
  },
  {
    description: 'a key typed bare at any occurrence is valueless, once',
    args: ['--stone', 'x', '--stone', '--that', '--that'],
    expected: {
      options: { stone: 'x' },
      optionsMulti: { stone: ['x'] },
      valueless: ['stone', 'that'],
    },
  },
  {
    description: 'a positional token is read by no flag',
    args: ['grant', 'allow'],
    expected: { options: {}, optionsMulti: {}, valueless: [] },
  },
  {
    description: '🔴 an empty value is no usable value — the flag is valueless',
    args: ['--stone', '', '--route', 'r'],
    expected: {
      options: { route: 'r' },
      optionsMulti: { route: ['r'] },
      valueless: ['stone'],
    },
  },
  {
    description:
      '🔴 a bare `--` closes option parse, and names no flag of its own',
    args: ['--stone', '5.1', '--', '--route', 'r'],
    expected: {
      options: { stone: '5.1' },
      optionsMulti: { stone: ['5.1'] },
      valueless: [],
    },
  },
  {
    description: 'a value flag right before `--` is valueless',
    args: ['--stone', '--'],
    expected: { options: {}, optionsMulti: {}, valueless: ['stone'] },
  },
  {
    description: 'no args yields no options',
    args: [],
    expected: { options: {}, optionsMulti: {}, valueless: [] },
  },
];

describe('asCliOptionsOfArgs', () => {
  CASES.forEach((thisCase) =>
    test(thisCase.description, () => {
      expect(
        asCliOptionsOfArgs({ args: thisCase.args, booleans: BOOLEANS }),
      ).toEqual(thisCase.expected);
    }),
  );
});
