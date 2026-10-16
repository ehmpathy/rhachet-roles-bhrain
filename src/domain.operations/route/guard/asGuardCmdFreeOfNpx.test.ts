import { getError } from 'test-fns';

import { asGuardCmdFreeOfNpx } from './asGuardCmdFreeOfNpx';

const TEST_CASES = [
  {
    description: 'a command that uses the $rhx alias passes',
    given: { cmd: '$rhx review --rules x' },
    expect: { error: null },
  },
  {
    description: 'npx rhachet is refused, and the $rhachet alias is named',
    given: { cmd: 'npx rhachet run --skill review' },
    expect: {
      error: 'guard uses npx rhachet which causes latency',
      hint: '$rhachet',
    },
  },
  {
    description: 'npx rhx is refused, and the $rhx alias is named',
    given: { cmd: 'npx rhx review' },
    expect: { error: 'guard uses npx rhx which causes latency', hint: '$rhx' },
  },
];

describe('asGuardCmdFreeOfNpx', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, async () => {
      if (thisCase.expect.error === null) {
        expect(asGuardCmdFreeOfNpx({ cmd: thisCase.given.cmd })).toEqual(
          thisCase.given.cmd,
        );
        return;
      }
      const error = await getError(async () =>
        asGuardCmdFreeOfNpx({ cmd: thisCase.given.cmd }),
      );
      expect(error.message).toContain(thisCase.expect.error);
      expect(error.message).toContain(thisCase.expect.hint);
      expect(error.message).toMatchSnapshot();
    }),
  );
});
