import { given, then, when } from 'test-fns';

import type { WarmerPokeRow } from './WarmerPokeRow';

/**
 * .what = clamp: a poke row with no measurement cannot be built in this repo's code
 * .why = the row type once declared `measured` nullable for every act, so a torn poke
 *        typechecked and only a runtime guard at the reader refused it. the gate is the
 *        typecheck: each `@ts-expect-error` below goes unused, and fails `tsc`, the
 *        moment the union loosens back to one shape
 */
const ENVELOPE = {
  at: '2026-10-13T00:00:00.000Z',
  reviewer: 'repo-rules',
  attempt: 1,
  why: 'a fixture row',
} as const;

describe('WarmerPokeRow', () => {
  given('[case1] a poke that measured naught', () => {
    when('[t0] built as a row', () => {
      then('the typecheck refuses it', () => {
        // @ts-expect-error — a poke reached a provider and billed, so it always measured
        const torn: WarmerPokeRow = {
          ...ENVELOPE,
          act: 'poke',
          measured: null,
        };
        expect(torn.act).toEqual('poke');
      });
    });
  });

  given('[case2] a defer that claims a measurement', () => {
    when('[t0] built as a row', () => {
      then('the typecheck refuses it', () => {
        // @ts-expect-error — a defer made no call, so there is naught to measure
        const claimed: WarmerPokeRow = {
          ...ENVELOPE,
          act: 'defer',
          measured: {
            promptTokens: 3_225,
            cacheGetTokens: 0,
            hit: false,
            cost: '$0.000428',
          },
        };
        expect(claimed.act).toEqual('defer');
      });
    });
  });

  given('[case3] each act with the measurement its kind demands', () => {
    when('[t0] built as rows', () => {
      then('the typecheck admits both', () => {
        const rows: WarmerPokeRow[] = [
          {
            ...ENVELOPE,
            act: 'poke',
            measured: {
              promptTokens: 3_225,
              cacheGetTokens: 3_224,
              hit: true,
              cost: '$0.000428',
            },
          },
          { ...ENVELOPE, act: 'fault', measured: null },
        ];
        expect(rows.map((row) => row.act)).toEqual(['poke', 'fault']);
      });
    });
  });
});
