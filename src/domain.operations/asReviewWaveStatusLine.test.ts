import { given, then, when } from 'test-fns';

import { asReviewWaveStatusLine } from './asReviewWaveStatusLine';

describe('asReviewWaveStatusLine', () => {
  given('[case1] a wave with lanes aloft, settled, and queued', () => {
    when('[t0] the line is rendered', () => {
      const line = asReviewWaveStatusLine({
        frame: '⠋',
        status: { inflight: 2, done: 1, left: 3, beganMs: 0 },
        sec: 12.34,
      });

      then(
        'it reads inflight, done, left, and the seconds at one decimal',
        () => {
          expect(line).toEqual('   └─ ⠋ 2 inflight · 1 done · 3 left · 12.3s');
        },
      );
    });
  });
});
