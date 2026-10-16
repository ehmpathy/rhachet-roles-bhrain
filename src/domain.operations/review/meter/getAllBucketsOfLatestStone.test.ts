import { given, then, when } from 'test-fns';

import { getAllBucketsOfLatestStone } from '@src/domain.operations/review/meter/getAllBucketsOfLatestStone';

describe('getAllBucketsOfLatestStone', () => {
  given('[case1] round buckets that span three stones', () => {
    // key-ordered, exactly as `byRound` arrives
    const buckets = [
      { key: '1.vision.experience i001' },
      { key: '1.vision.experience i002' },
      { key: '5.1.execution.from_vision i001' },
      { key: '5.1.execution.from_vision i002' },
      { key: '5.3.verification i001' },
      { key: '5.3.verification i002' },
      { key: '5.3.verification i003' },
    ];

    when('[t0] the latest stone is taken', () => {
      const window = getAllBucketsOfLatestStone({ buckets });

      then('🔴 it names the latest stone, never the first', () => {
        // the defect this exists for: a cross-stone series compares a vision
        // corpus against a source corpus, and reported `input ↑ 952.6%` for a
        // lever that had improved
        expect(window.stone).toEqual('5.3.verification');
      });

      then('it keeps only that stone`s rounds', () => {
        expect(window.buckets.map((bucket) => bucket.key)).toEqual([
          '5.3.verification i001',
          '5.3.verification i002',
          '5.3.verification i003',
        ]);
      });

      then('it holds the round order it was handed', () => {
        // a trend reads endpoints, so a reorder here would swap its sign
        const ordinals = window.buckets.map((bucket) => bucket.key);
        expect([...ordinals].sort()).toEqual(ordinals);
      });
    });
  });

  given('[case2] a stone whose name holds dots and dashes', () => {
    when('[t0] the latest stone is taken', () => {
      const window = getAllBucketsOfLatestStone({
        buckets: [
          { key: '5.1.execution.from_vision i009' },
          { key: '5.1.execution.from_vision i010' },
        ],
      });

      then('🔴 the key splits on its LAST ` i<N>` run, never the first', () => {
        // `from_vision` holds no ` i`, but a stone named `… i18n …` would — and a
        // first-match split would cut the stone name in half and strand each
        // round under its own one-row window
        expect(window.stone).toEqual('5.1.execution.from_vision');
        expect(window.buckets).toHaveLength(2);
      });
    });
  });

  given('[case3] a bucket whose key is not a round key at all', () => {
    when('[t0] the latest stone is taken', () => {
      const window = getAllBucketsOfLatestStone({
        buckets: [
          { key: '(no guard identity — a hand or review.by run)' },
          { key: '5.3.verification i001' },
          { key: '5.3.verification i002' },
        ],
      });

      then('🔴 a non-round key is dropped rather than read as a stone', () => {
        // `SLUG_OF_ABSENT_IDENTITY` opens with `(`, which sorts ahead of every
        // digit — so a reader of `byRound[0]` meets a hand run first. callers
        // filter it too, and this is the second net
        expect(window.stone).toEqual('5.3.verification');
        expect(window.buckets).toHaveLength(2);
      });
    });
  });

  given('[case4] no bucket carries a round key', () => {
    when('[t0] the latest stone is taken', () => {
      const window = getAllBucketsOfLatestStone({
        buckets: [{ key: '(no guard identity — a hand or review.by run)' }],
      });

      then('it reports no stone and no rounds, so no trend renders', () => {
        // a trend over a window nobody can name is the claim this refuses
        expect(window.stone).toEqual(null);
        expect(window.buckets).toEqual([]);
      });
    });
  });

  given('[case5] an empty axis', () => {
    when('[t0] the latest stone is taken', () => {
      const window = getAllBucketsOfLatestStone({ buckets: [] });

      then('it reports no stone, and reduces over no empty array', () => {
        // `Array.reduce` with no seed throws on an empty array; the early
        // return is what keeps this a report rather than a crash
        expect(window.stone).toEqual(null);
        expect(window.buckets).toEqual([]);
      });
    });
  });
});
