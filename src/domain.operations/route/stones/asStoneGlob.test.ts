import { given, then, when } from 'test-fns';

import { asStoneGlob, isStoneInGlob } from './asStoneGlob';

describe('asStoneGlob', () => {
  given('[case1] pattern with no glob chars', () => {
    when('[t0] pattern is a plain word', () => {
      then('wraps with *...*', () => {
        const result = asStoneGlob({ pattern: 'research' });
        expect(result).toEqual({ glob: '*research*', raw: 'research' });
      });
    });

    when('[t1] pattern is an exact stone name', () => {
      then('wraps with *...*', () => {
        const result = asStoneGlob({
          pattern: '3.1.research.domain._.v1',
        });
        expect(result).toEqual({
          glob: '*3.1.research.domain._.v1*',
          raw: '3.1.research.domain._.v1',
        });
      });
    });
  });

  given('[case2] pattern with glob chars', () => {
    when('[t0] pattern has * chars', () => {
      then('passes through as-is', () => {
        const result = asStoneGlob({ pattern: '*.research.*' });
        expect(result).toEqual({ glob: '*.research.*', raw: '*.research.*' });
      });
    });

    when('[t1] pattern is a single wildcard', () => {
      then('passes through as-is', () => {
        const result = asStoneGlob({ pattern: '*' });
        expect(result).toEqual({ glob: '*', raw: '*' });
      });
    });

    when('[t2] pattern has ? char', () => {
      then('passes through as-is', () => {
        const result = asStoneGlob({ pattern: '3.?.research' });
        expect(result).toEqual({ glob: '3.?.research', raw: '3.?.research' });
      });
    });
  });
});

describe('isStoneInGlob', () => {
  given('[case1] fuzzy glob *research*', () => {
    when('[t0] stone name contains research', () => {
      then('matches', () => {
        expect(
          isStoneInGlob({
            name: '3.1.research.domain._.v1',
            glob: '*research*',
          }),
        ).toBe(true);
      });
    });

    when('[t1] stone name does not contain research', () => {
      then('does not match', () => {
        expect(isStoneInGlob({ name: '1.vision', glob: '*research*' })).toBe(
          false,
        );
      });
    });
  });

  given('[case2] explicit glob *.research.*', () => {
    when('[t0] stone name matches the dotted pattern', () => {
      then('matches', () => {
        expect(
          isStoneInGlob({
            name: '3.1.research.domain._.v1',
            glob: '*.research.*',
          }),
        ).toBe(true);
      });
    });
  });

  given('[case3] wildcard glob *', () => {
    when('[t0] any stone name', () => {
      then('matches all', () => {
        expect(isStoneInGlob({ name: '1.vision', glob: '*' })).toBe(true);
        expect(
          isStoneInGlob({ name: '3.1.research.domain._.v1', glob: '*' }),
        ).toBe(true);
      });
    });
  });

  given('[case4] prefix glob 3.1.*', () => {
    when('[t0] stone name starts with 3.1.', () => {
      then('matches', () => {
        expect(
          isStoneInGlob({ name: '3.1.research.domain', glob: '3.1.*' }),
        ).toBe(true);
      });
    });

    when('[t1] stone name does not start with 3.1.', () => {
      then('does not match', () => {
        expect(isStoneInGlob({ name: '2.criteria', glob: '3.1.*' })).toBe(
          false,
        );
      });
    });
  });
});
