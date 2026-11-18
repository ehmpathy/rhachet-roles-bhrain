import { asClaudeSettingsShapeFault } from './asClaudeSettingsShapeFault';

const TEST_CASES: {
  description: string;
  given: { value: unknown };
  expect: string | null;
}[] = [
  {
    description: 'an object with no hooks: no fault',
    given: { value: { permissions: {} } },
    expect: null,
  },
  {
    description: 'the declared shape, whole: no fault',
    given: {
      value: {
        hooks: {
          Stop: [
            {
              matcher: '*',
              hooks: [{ type: 'command', command: 'x', timeout: 5 }],
            },
          ],
        },
      },
    },
    expect: null,
  },
  {
    description: 'a list at the root: the file is named',
    given: { value: [] },
    expect: 'the file holds a list, not an object',
  },
  {
    description: 'hooks as a string: hooks is named',
    given: { value: { hooks: 'x' } },
    expect: 'hooks is a string, not an object',
  },
  {
    description: 'an event that is not a list: the event is named',
    given: { value: { hooks: { Stop: 'x' } } },
    expect: 'hooks.Stop is a string, not a list',
  },
  {
    description: 'a block that is not an object: its index is named',
    given: { value: { hooks: { Stop: [null] } } },
    expect: 'hooks.Stop[0] is null, not an object',
  },
  {
    description: 'a matcher of another kind: the key is named',
    given: { value: { hooks: { Stop: [{ matcher: 7 }] } } },
    expect: 'hooks.Stop[0].matcher is a number, not a string',
  },
  {
    description: "a block's hooks that is not a list: named",
    given: { value: { hooks: { Stop: [{ matcher: '*', hooks: 'x' }] } } },
    expect: 'hooks.Stop[0].hooks is a string, not a list',
  },
  {
    description: 'an inner hook key of another kind: the first fault is named',
    given: {
      value: {
        hooks: {
          Stop: [{ matcher: '*', hooks: [{ command: 'x' }, { timeout: '5' }] }],
        },
      },
    },
    expect: 'hooks.Stop[0].hooks[1].timeout is a string, not a number',
  },
];

describe('asClaudeSettingsShapeFault', () => {
  TEST_CASES.forEach((thisCase) => {
    test(thisCase.description, () => {
      expect(asClaudeSettingsShapeFault(thisCase.given)).toEqual(
        thisCase.expect,
      );
    });
  });
});
