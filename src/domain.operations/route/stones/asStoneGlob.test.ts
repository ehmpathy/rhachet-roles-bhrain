import { BadRequestError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import {
  asStoneGlob,
  findOneStoneByPattern,
  isStoneInGlob,
} from './asStoneGlob';

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

  given('[case2] @all alias', () => {
    when('[t0] pattern is @all', () => {
      then('resolves to wildcard *', () => {
        const result = asStoneGlob({ pattern: '@all' });
        expect(result).toEqual({ glob: '*', raw: '@all' });
      });
    });
  });

  given('[case3] pattern with glob chars', () => {
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

describe('findOneStoneByPattern', () => {
  const mockStones = [
    { name: '1.vision' },
    { name: '2.criteria' },
    { name: '3.1.research.v1' },
    { name: '3.2.blueprint.v1' },
    { name: '3.3.execute.v1' },
  ] as RouteStone[];

  given('[case1] pattern matches exactly one stone', () => {
    when('[t0] pattern is partial name without glob chars', () => {
      then('returns the stone (auto-wrap)', () => {
        const result = findOneStoneByPattern({
          stones: mockStones,
          pattern: 'vision',
        });
        expect(result?.name).toEqual('1.vision');
      });
    });

    when('[t1] pattern is numeric prefix', () => {
      then('returns the stone', () => {
        const result = findOneStoneByPattern({
          stones: mockStones,
          pattern: '3.2',
        });
        expect(result?.name).toEqual('3.2.blueprint.v1');
      });
    });

    when('[t2] pattern is exact stone name', () => {
      then('returns the stone', () => {
        const result = findOneStoneByPattern({
          stones: mockStones,
          pattern: '3.3.execute.v1',
        });
        expect(result?.name).toEqual('3.3.execute.v1');
      });
    });

    when('[t3] pattern uses explicit glob', () => {
      then('returns the stone', () => {
        const result = findOneStoneByPattern({
          stones: mockStones,
          pattern: '*.blueprint.*',
        });
        expect(result?.name).toEqual('3.2.blueprint.v1');
      });
    });
  });

  given('[case2] pattern matches no stones', () => {
    when('[t0] pattern has no matches', () => {
      then('returns null', () => {
        const result = findOneStoneByPattern({
          stones: mockStones,
          pattern: 'nonexistent',
        });
        expect(result).toBeNull();
      });
    });
  });

  given('[case3] pattern matches multiple stones', () => {
    when('[t0] pattern is ambiguous', () => {
      then('throws BadRequestError with pattern and stone names', async () => {
        const error = await getError(async () =>
          findOneStoneByPattern({
            stones: mockStones,
            pattern: '3.',
          }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain('matched 3 stones');
        expect(error.message).toContain('be more specific');
        // verify metadata serialized into message
        expect(error.message).toContain('"pattern": "3."');
        expect(error.message).toContain('3.1.research.v1');
        expect(error.message).toContain('3.2.blueprint.v1');
        expect(error.message).toContain('3.3.execute.v1');
      });
    });

    when('[t1] pattern matches all stones', () => {
      then('throws BadRequestError with all stone names', async () => {
        const error = await getError(async () =>
          findOneStoneByPattern({
            stones: mockStones,
            pattern: '@all',
          }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain('matched 5 stones');
        // verify metadata serialized into message
        expect(error.message).toContain('"pattern": "@all"');
        expect(error.message).toContain('1.vision');
        expect(error.message).toContain('2.criteria');
        expect(error.message).toContain('3.1.research.v1');
        expect(error.message).toContain('3.2.blueprint.v1');
        expect(error.message).toContain('3.3.execute.v1');
      });
    });
  });
});
