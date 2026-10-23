import { getError, given, then, when } from 'test-fns';

import { asReviewWatermarkJson } from './asReviewWatermarkJson';
import { isErrorOfWatermarkFault } from './isErrorOfWatermarkFault';
import { ReviewWatermarkParseError } from './ReviewWatermarkParseError';

describe('asReviewWatermarkJson', () => {
  given('[case1] a watermark of valid json', () => {
    when('[t0] it is parsed', () => {
      then('it reads the shape', () => {
        const parsed = asReviewWatermarkJson<{ claimedBy: string }>({
          raw: '{"claimedBy":"pid1.a"}',
          key: 'prime.abc',
          cwd: '/repo',
        });
        expect(parsed).toEqual({ claimedBy: 'pid1.a' });
      });
    });
  });

  given('[case2] a watermark torn mid-write', () => {
    when('[t0] it is parsed', () => {
      then(
        'it throws a parse error that names the key and the dir',
        async () => {
          const error = await getError(() =>
            asReviewWatermarkJson({
              raw: '{"claimedBy":"pid1',
              key: 'prime.abc',
              cwd: '/repo',
            }),
          );
          expect(error).toBeInstanceOf(ReviewWatermarkParseError);
          expect(error.message).toContain('the watermark is not valid json');
          expect(error.message).toContain('prime.abc');
          expect(error.message).toContain(
            '/repo/.agent/.cache/repo=bhrain/role=reviewer/skill=review/watermarks',
          );
        },
      );

      then(
        'the error reads as a store fault, so it costs the cache alone',
        async () => {
          const error = await getError(() =>
            asReviewWatermarkJson({
              raw: 'not json',
              key: 'prime.abc',
              cwd: '/repo',
            }),
          );
          expect(isErrorOfWatermarkFault({ error })).toEqual(true);
        },
      );
    });
  });
});
