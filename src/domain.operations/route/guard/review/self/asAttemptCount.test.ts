import { given, then, when } from 'test-fns';

import { asAttemptCount } from './asAttemptCount';

describe('asAttemptCount', () => {
  given('[case1] a well formed marker', () => {
    when('[t0] the attempts line is present', () => {
      then('reads the count', () => {
        expect(asAttemptCount('slug: all-done\nattempts: 3')).toEqual(3);
      });

      then('reads a zero as a zero, never as an absence', () => {
        // .why = 0 is the ASK's value and a real datum. if it read as absent, a
        //        re-ask would be indistinguishable from an unparsable marker
        expect(asAttemptCount('slug: all-done\nattempts: 0')).toEqual(0);
      });

      then('reads a multi-digit count', () => {
        expect(asAttemptCount('slug: all-done\nattempts: 12')).toEqual(12);
      });
    });
  });

  given('[case2] a marker the count cannot be read from', () => {
    when('[t0] the line is absent, empty, or unparsable', () => {
      then('an absent attempts line reads as 0', () => {
        expect(asAttemptCount('slug: all-done')).toEqual(0);
      });

      then('an empty file reads as 0', () => {
        expect(asAttemptCount('')).toEqual(0);
      });

      then('a non-numeric value reads as 0', () => {
        expect(asAttemptCount('slug: all-done\nattempts: many')).toEqual(0);
      });
    });
  });

  given('[case3] the line is not at the head of the file', () => {
    when('[t0] attempts sits on a later line', () => {
      then('the multiline anchor still finds it', () => {
        // .why = the marker writes `slug` first, so a head-anchored regex would read
        //        every real marker as 0 — and 0 is the value that means "not adjudicated"
        expect(
          asAttemptCount('slug: all-done\nnote: whatever\nattempts: 7'),
        ).toEqual(7);
      });
    });
  });

  given('[case4] a word that merely contains "attempts"', () => {
    when('[t0] the token is not at the start of its line', () => {
      then('it is not mistaken for the count', () => {
        // .why = a looser regex (no `^`) would read this as 9 and credit an attempt
        //        that was never spent. a burned attempt is a leaked review
        expect(asAttemptCount('slug: reattempts: 9')).toEqual(0);
      });
    });
  });
});
