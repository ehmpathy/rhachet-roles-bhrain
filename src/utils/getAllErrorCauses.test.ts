import { given, then, when } from 'test-fns';

import { getAllErrorCauses } from './getAllErrorCauses';

describe('getAllErrorCauses', () => {
  given('[case1] an error with a two-link cause chain', () => {
    when('[t0] the chain is walked', () => {
      then('it lists the error, then each cause, nearest first', () => {
        const root = new Error('root');
        const middle = Object.assign(new Error('middle'), { cause: root });
        const top = Object.assign(new Error('top'), { cause: middle });
        expect(getAllErrorCauses({ error: top })).toEqual([top, middle, root]);
      });
    });
  });

  given('[case2] an error whose cause is itself', () => {
    when('[t0] the chain is walked', () => {
      then('it halts after the one link, never overflows', () => {
        const error = new Error('self');
        Object.assign(error, { cause: error });
        expect(getAllErrorCauses({ error })).toEqual([error]);
      });
    });
  });

  given('[case3] two errors that name each other as cause', () => {
    when('[t0] the chain is walked', () => {
      then('it lists each once and halts', () => {
        const first = new Error('first');
        const second = Object.assign(new Error('second'), { cause: first });
        Object.assign(first, { cause: second });
        expect(getAllErrorCauses({ error: first })).toEqual([first, second]);
      });
    });
  });

  given('[case4] a primitive thrown value', () => {
    when('[t0] the chain is walked', () => {
      then('it lists the value alone', () => {
        expect(getAllErrorCauses({ error: 'boom' })).toEqual(['boom']);
      });
    });
  });
});
