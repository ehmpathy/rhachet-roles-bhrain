import { given, then, when } from 'test-fns';

import { asContentByPath } from '@src/domain.operations/review/asContentByPath';

describe('asContentByPath', () => {
  given('[case1] a normal read set', () => {
    when('[t0] it is cast to a lookup', () => {
      const lookup = asContentByPath({
        reads: [
          { path: 'src/a.ts', content: 'alpha' },
          { path: 'src/b.ts', content: 'beta' },
        ],
      });

      then('each path answers its own content', () => {
        expect(lookup.get('src/a.ts')).toEqual('alpha');
        expect(lookup.get('src/b.ts')).toEqual('beta');
      });

      then('a path that was never read answers undefined', () => {
        expect(lookup.get('src/never.ts')).toEqual(undefined);
      });
    });
  });

  given('[case2] an empty read set — every target was deleted', () => {
    when('[t0] it is cast to a lookup', () => {
      const lookup = asContentByPath({ reads: [] });

      then('the lookup is empty rather than absent', () => {
        expect(lookup.size).toEqual(0);
      });
    });
  });

  given('[case3] a duplicate path', () => {
    when('[t0] it is cast to a lookup', () => {
      const lookup = asContentByPath({
        reads: [
          { path: 'src/a.ts', content: 'first' },
          { path: 'src/a.ts', content: 'second' },
        ],
      });

      then('the LAST read wins, which is the documented rule', () => {
        // the read set upstream is unique by path, so this case does not arise
        // there — it is pinned so the rule cannot drift unstated
        expect(lookup.get('src/a.ts')).toEqual('second');
        expect(lookup.size).toEqual(1);
      });
    });
  });
});
