import { isCmdOfRuntimeVar } from './isCmdOfRuntimeVar';

const TEST_CASES = [
  {
    description: 'a command that names the var asks for it',
    given: { cmd: 'review --targets $targets', name: '$targets' as const },
    expect: { output: true },
  },
  {
    description: 'a command that never names the var does not ask for it',
    given: { cmd: 'review --route $route', name: '$targets' as const },
    expect: { output: false },
  },
  {
    // `$rhachet` and `$rhx` share a prefix; each token matches only its own name
    description:
      'a var that shares a prefix with the name is not an ask for it',
    given: { cmd: '$rhachet run --skill review', name: '$rhx' as const },
    expect: { output: false },
  },
];

describe('isCmdOfRuntimeVar', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isCmdOfRuntimeVar(thisCase.given)).toEqual(thisCase.expect.output);
    }),
  );
});
