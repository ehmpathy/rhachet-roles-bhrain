import { given, then, when } from 'test-fns';

import { asReviewRunMeetOfRealized } from './asReviewRunMeetOfRealized';

describe('asReviewRunMeetOfRealized', () => {
  given('[case1] a realized record that names a meet a writer sends', () => {
    when('[t0] it is read', () => {
      then('it reads that meet', () => {
        expect(
          asReviewRunMeetOfRealized({ realized: { meet: 'awaited' } }),
        ).toEqual('awaited');
        expect(
          asReviewRunMeetOfRealized({
            realized: { meet: 'skipped.partition' },
          }),
        ).toEqual('skipped.partition');
      });
    });
  });

  given('[case2] no realized record at all', () => {
    when('[t0] it is read', () => {
      then('it reads null', () => {
        expect(asReviewRunMeetOfRealized({ realized: null })).toEqual(null);
      });
    });
  });

  given('[case3] a record that predates the field', () => {
    when('[t0] it is read', () => {
      then('it reads null', () => {
        expect(asReviewRunMeetOfRealized({ realized: { tokens: {} } })).toEqual(
          null,
        );
      });
    });
  });

  given('[case4] a meet that is not a string', () => {
    when('[t0] it is read', () => {
      then('it reads null, never a cast', () => {
        expect(asReviewRunMeetOfRealized({ realized: { meet: 7 } })).toEqual(
          null,
        );
      });
    });
  });

  given('[case5] a string that no writer sends', () => {
    when('[t0] it is read', () => {
      then('🔴 it reads null — an unknown meet never grades warm', () => {
        expect(
          asReviewRunMeetOfRealized({ realized: { meet: 'warmish' } }),
        ).toEqual(null);
      });
    });
  });
});
