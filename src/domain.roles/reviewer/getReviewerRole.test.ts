import * as path from 'path';
import { given, then, when } from 'test-fns';

import { ROLE_REVIEWER } from './getReviewerRole';

describe('getReviewerRole', () => {
  given('[case1] the keyrack manifest', () => {
    when('[t0] the reviewer role keyrack is inspected', () => {
      then('it points at the keyrack.yml beside the role', () => {
        // a consumer of the reviewer role learns its review key from this wire
        expect(ROLE_REVIEWER.keyrack?.uri).toEqual(
          path.join(__dirname, 'keyrack.yml'),
        );
      });
    });
  });
});
