import { getError, given, then, when } from 'test-fns';

import { withToleratedIoFaultAsValue } from './withToleratedIoFaultAsValue';

/**
 * .what = unit cases for withToleratedIoFaultAsValue
 * .why = a tolerated io fault returns as a value so the caller can surface it; every other throw
 *        must still escape, or a writer bug would be swallowed (rule.forbid.failhide)
 */
describe('withToleratedIoFaultAsValue', () => {
  given('[case1] logic that completes', () => {
    when('[t0] it is run', () => {
      then('it returns null', async () => {
        expect(await withToleratedIoFaultAsValue(async () => 'done')).toEqual(
          null,
        );
      });
    });
  });

  given('[case2] logic that throws a tolerated io fault', () => {
    when('[t0] it is run', () => {
      then('it returns the fault as a value', async () => {
        const fault = Object.assign(new Error('EACCES: permission denied'), {
          code: 'EACCES',
        });
        expect(
          await withToleratedIoFaultAsValue(async () => {
            throw fault;
          }),
        ).toBe(fault);
      });
    });
  });

  given('[case3] logic that throws aught else', () => {
    when('[t0] the throw is an io errno off the list', () => {
      then('it rethrows', async () => {
        const fault = Object.assign(new Error('EBADF'), { code: 'EBADF' });
        const error = await getError(
          withToleratedIoFaultAsValue(async () => {
            throw fault;
          }),
        );
        expect(error).toBe(fault);
      });
    });

    when('[t1] the throw is a bug class with no errno', () => {
      then('it rethrows', async () => {
        const error = await getError(
          withToleratedIoFaultAsValue(async () => {
            throw new TypeError('x is undefined');
          }),
        );
        expect(error).toBeInstanceOf(TypeError);
      });
    });

    when('[t2] the throw is no error at all', () => {
      then('it rethrows the value as is', async () => {
        const error = await withToleratedIoFaultAsValue(async () => {
          throw 'EACCES';
        }).catch((thrown: unknown) => thrown);
        expect(error).toEqual('EACCES');
      });
    });
  });
});
