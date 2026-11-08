import { isClaudeSettingsOfRepo } from './isClaudeSettingsOfRepo';

const TEST_CASES: { description: string; given: unknown; expect: boolean }[] = [
  { description: 'an empty object', given: {}, expect: true },
  {
    description: 'other keys and no hooks',
    given: { permissions: { allow: ['Bash(echo:*)'] } },
    expect: true,
  },
  {
    description: 'a well-formed Stop block',
    given: {
      hooks: {
        Stop: [{ matcher: '*', hooks: [{ type: 'command', command: 'x' }] }],
      },
    },
    expect: true,
  },
  {
    description: 'a block with no inner hooks key',
    given: { hooks: { Stop: [{ matcher: '*' }] } },
    expect: true,
  },
  { description: 'a list at the top', given: [], expect: false },
  { description: 'null', given: null, expect: false },
  { description: 'a scalar', given: 5, expect: false },
  { description: 'hooks as a list', given: { hooks: [] }, expect: false },
  {
    description: 'an event as a string',
    given: { hooks: { Stop: 'x' } },
    expect: false,
  },
  {
    description: 'an event that holds a scalar block',
    given: { hooks: { Stop: [5] } },
    expect: false,
  },
  {
    description: 'a block whose inner hooks is a string',
    given: { hooks: { Stop: [{ matcher: '*', hooks: 'x' }] } },
    expect: false,
  },
  {
    description: 'a block whose inner hooks holds a scalar',
    given: { hooks: { Stop: [{ matcher: '*', hooks: ['x'] }] } },
    expect: false,
  },
  {
    description:
      'an inner hook with every declared field of its kind, plus a foreign key',
    given: {
      hooks: {
        Stop: [
          {
            matcher: '*',
            hooks: [
              {
                type: 'command',
                command: 'x',
                timeout: 5,
                author: 'repo=bhrain/role=driver',
                extra: [1, 2],
              },
            ],
          },
        ],
      },
    },
    expect: true,
  },
  {
    description: 'an inner hook whose author is a number',
    given: { hooks: { Stop: [{ hooks: [{ command: 'x', author: 5 }] }] } },
    expect: false,
  },
  {
    description: 'an inner hook whose timeout is a string',
    given: { hooks: { Stop: [{ hooks: [{ command: 'x', timeout: '5' }] }] } },
    expect: false,
  },
  {
    description: 'a block whose matcher is a number',
    given: { hooks: { Stop: [{ matcher: 1, hooks: [] }] } },
    expect: false,
  },
];

describe('isClaudeSettingsOfRepo', () => {
  TEST_CASES.forEach((thisCase) => {
    test(thisCase.description, () => {
      expect(isClaudeSettingsOfRepo(thisCase.given)).toEqual(thisCase.expect);
    });
  });
});
