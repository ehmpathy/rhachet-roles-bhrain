import { given, then, when } from 'test-fns';

import { asOpenerFailureNote } from './asOpenerFailureNote';

describe('asOpenerFailureNote', () => {
  given('[case1] an opener that is not on the PATH', () => {
    when('[t0] the note is rendered', () => {
      const note = asOpenerFailureNote({
        opener: 'ghost-opener',
        output: '/repo/.reviews/peer/report.md',
        cause: '/bin/sh: 1: ghost-opener: not found',
      });

      then(
        'it opens with the ConstraintError header, since the caller must act',
        () => {
          expect(note.split('\n')[0]).toMatch(/^✋ ConstraintError: /);
          expect(note).not.toContain('MalfunctionError');
        },
      );

      then('it names the opener, the cause, and the path to open', () => {
        expect(note).toContain("'ghost-opener'");
        expect(note).toContain('not found');
        expect(note).toContain('/repo/.reviews/peer/report.md');
      });

      then('the whole note renders, diffable in the PR', () => {
        expect(note).toMatchSnapshot();
      });
    });
  });
});
