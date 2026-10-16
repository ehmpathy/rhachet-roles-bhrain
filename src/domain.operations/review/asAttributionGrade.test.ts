import { given, then, when } from 'test-fns';

import { asAttributionGrade } from '@src/domain.operations/review/asAttributionGrade';

describe('asAttributionGrade', () => {
  given('[case1] a grade a prior build wrote', () => {
    when('[t0] it is read back off disk', () => {
      then('each of the two known grades survives', () => {
        expect(asAttributionGrade({ value: 'attributed' })).toEqual(
          'attributed',
        );
        expect(asAttributionGrade({ value: 'unattributed' })).toEqual(
          'unattributed',
        );
      });
    });
  });

  given('[case2] an artifact that states NO grade', () => {
    // older runs predate the field. a silent record must not read as
    // `attributed` — that mints a clean verdict nobody rendered (failhide).
    when('[t0] it is read back off disk', () => {
      then('🔴 it answers null, never the clean grade', () => {
        expect(asAttributionGrade({ value: undefined })).toEqual(null);
        expect(asAttributionGrade({ value: null })).toEqual(null);
      });

      then('a grade a LATER build coins is refused too', () => {
        // a cast would let an unknown word through under the type's name
        expect(asAttributionGrade({ value: 'partial' })).toEqual(null);
        expect(asAttributionGrade({ value: 42 })).toEqual(null);
      });
    });
  });
});
