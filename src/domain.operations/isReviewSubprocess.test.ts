import { given, then, when } from 'test-fns';

import {
  ENV_OF_PROGRESS_SILENT,
  isProgressSilenced,
} from './isProgressSilenced';
import {
  ENV_OF_REVIEW_SUBPROCESS,
  isReviewSubprocess,
} from './isReviewSubprocess';

describe('isReviewSubprocess', () => {
  given('[case1] the buffered tactic — both markers set', () => {
    const env = {
      [ENV_OF_REVIEW_SUBPROCESS]: '1',
      [ENV_OF_PROGRESS_SILENT]: '1',
    };

    when('[t0] each predicate reads it', () => {
      then('it is a review subprocess', () => {
        expect(isReviewSubprocess({ env })).toBe(true);
      });
      then('its progress is silenced', () => {
        expect(isProgressSilenced({ env })).toBe(true);
      });
    });
  });

  given('[case2] the streamed tactic — the subprocess marker alone', () => {
    const env = { [ENV_OF_REVIEW_SUBPROCESS]: '1' };

    when('[t0] each predicate reads it', () => {
      then('it is still a review subprocess', () => {
        expect(isReviewSubprocess({ env })).toBe(true);
      });
      then('its progress is NOT silenced, so the spinner can stream', () => {
        expect(isProgressSilenced({ env })).toBe(false);
      });
    });
  });

  given(
    '[case3] 🔴 the progress marker alone — a caller that only wants quiet',
    () => {
      const env = { [ENV_OF_PROGRESS_SILENT]: '1' };

      when('[t0] each predicate reads it', () => {
        then('its progress is silenced', () => {
          expect(isProgressSilenced({ env })).toBe(true);
        });
        then(
          'it is NOT a review subprocess, so its route hooks still speak',
          () => {
            expect(isReviewSubprocess({ env })).toBe(false);
          },
        );
      });
    },
  );

  given('[case4] the driver session — neither marker set', () => {
    const env = {};

    when('[t0] each predicate reads it', () => {
      then('it is not a review subprocess', () => {
        expect(isReviewSubprocess({ env })).toBe(false);
      });
      then('its progress is not silenced', () => {
        expect(isProgressSilenced({ env })).toBe(false);
      });
    });
  });
});
