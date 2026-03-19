import { given, then, when } from 'test-fns';

import { getExitCodeClass } from './getExitCodeClass';

describe('getExitCodeClass', () => {
  given('[case1] exit code 0', () => {
    when('[t0] classified', () => {
      then('returns passed', () => {
        const result = getExitCodeClass({ code: 0 });
        expect(result).toEqual('passed');
      });
    });
  });

  given('[case2] exit code 2', () => {
    when('[t0] classified', () => {
      then('returns constraint', () => {
        const result = getExitCodeClass({ code: 2 });
        expect(result).toEqual('constraint');
      });
    });
  });

  given('[case3] exit code 1', () => {
    when('[t0] classified', () => {
      then('returns malfunction', () => {
        const result = getExitCodeClass({ code: 1 });
        expect(result).toEqual('malfunction');
      });
    });
  });

  given('[case4] exit code 137 (SIGKILL)', () => {
    when('[t0] classified', () => {
      then('returns malfunction', () => {
        const result = getExitCodeClass({ code: 137 });
        expect(result).toEqual('malfunction');
      });
    });
  });
});
