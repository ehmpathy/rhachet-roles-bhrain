import { given, then, when } from 'test-fns';

import { asCountedNoun } from './asCountedNoun';

describe('asCountedNoun', () => {
  given('[case1] a count of exactly one', () => {
    when('[t0] the noun is rendered', () => {
      then('it takes the singular', () => {
        expect(asCountedNoun({ count: 1, one: 'tree', many: 'trees' })).toEqual(
          '1 tree',
        );
      });

      then('🔴 and a verb agrees too — the blemish was `1 carry`', () => {
        expect(
          asCountedNoun({ count: 1, one: 'carries', many: 'carry' }),
        ).toEqual('1 carries');
      });
    });
  });

  given('[case2] a count above one', () => {
    when('[t0] the noun is rendered', () => {
      then('it takes the plural', () => {
        expect(
          asCountedNoun({ count: 41, one: 'tree', many: 'trees' }),
        ).toEqual('41 trees');
      });
    });
  });

  given('[case3] a count of zero', () => {
    when('[t0] the noun is rendered', () => {
      then(
        '🔴 it takes the plural — english says "0 trees", not "0 tree"',
        () => {
          expect(
            asCountedNoun({ count: 0, one: 'tree', many: 'trees' }),
          ).toEqual('0 trees');
        },
      );
    });
  });

  given('[case4] any count at all', () => {
    when('[t0] the noun is rendered', () => {
      then(
        '🔴 no space rides at the tail — a progress line has no column to pad to',
        () => {
          expect(
            asCountedNoun({ count: 1, one: 'run', many: 'runs' }),
          ).not.toMatch(/\s$/);
          expect(
            asCountedNoun({ count: 7, one: 'run', many: 'runs' }),
          ).not.toMatch(/\s$/);
        },
      );
    });
  });

  given('[case5] a column site, which must pad where prose must not', () => {
    // `genReviewMeterStdout`'s `asBucketRow` and `genReviewGroveStdout`'s
    // `asRollupLines` each need the pad this operation once refused, so the
    // pad became an option instead of a default — these assertions keep the
    // default safe: flipped on, every progress line would end in a stray
    // space, the blemish `[case4]` above catches.
    when('[t0] `align` is asked for', () => {
      then('🔴 the singular is padded to the plural`s width', () => {
        // `run ` is what makes the column flush; the columns were hand-padded to
        // exactly this before (rule.require.treestruct-output)
        expect(
          asCountedNoun(
            { count: 1, one: 'run', many: 'runs' },
            { align: true },
          ),
        ).toEqual('1 run ');
      });

      then('and the plural is already at width, so it is untouched', () => {
        expect(
          asCountedNoun(
            { count: 7, one: 'run', many: 'runs' },
            { align: true },
          ),
        ).toEqual('7 runs');
      });

      then('🟡 the pad is the wider of the two, whichever that is', () => {
        // `carries` is the singular here, so the plural is what gets padded — a
        // `one`-is-longer pair must not silently truncate either side
        expect(
          asCountedNoun(
            { count: 4, one: 'carries', many: 'carry' },
            { align: true },
          ),
        ).toEqual('4 carry  ');
      });
    });

    when('[t1] `padCount` is asked for', () => {
      then('the digits are right-aligned into the width', () => {
        expect(
          asCountedNoun(
            { count: 7, one: 'run', many: 'runs' },
            { align: true, padCount: 3 },
          ),
        ).toEqual('  7 runs');
      });

      then('🟡 and a count already at width is untouched', () => {
        expect(
          asCountedNoun(
            { count: 412, one: 'run', many: 'runs' },
            { align: true, padCount: 3 },
          ),
        ).toEqual('412 runs');
      });
    });

    when('[t2] no options are passed at all', () => {
      then('🔴 neither pad applies — the progress line is the default', () => {
        // the half that carries the weight: a caller that asks for no column gets
        // no column, so the default cannot regress the prose surfaces
        expect(asCountedNoun({ count: 1, one: 'run', many: 'runs' })).toEqual(
          '1 run',
        );
      });
    });
  });
});
