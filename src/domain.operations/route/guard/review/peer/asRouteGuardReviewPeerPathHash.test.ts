import { ConstraintError } from 'helpful-errors';
import { getError, given, then, useThen, when } from 'test-fns';

import { asRouteGuardReviewPeerPathHash } from './asRouteGuardReviewPeerPathHash';

describe('asRouteGuardReviewPeerPathHash', () => {
  given('[case1] a peer-review path in the given grammar', () => {
    when('[t0] the hash is read', () => {
      then('it returns the hash the filename stamps', () => {
        const hash = asRouteGuardReviewPeerPathHash({
          path: '.reviews/peer/1.vision._.review.i003.f77ae7dcc4.r002._.given.by_peer.mechanic.md',
        });
        expect(hash).toEqual('f77ae7dcc4');
      });
    });
  });

  given('[case2] a stray file whose name lacks the hash stamp', () => {
    // a hand-renamed or hand-placed file under `.reviews/peer/` that the
    // enumerator's glob still admits. it is the human's to remove, so it must
    // reach them as a refusal with the fix, never a raw stack
    when('[t0] the hash is read', () => {
      const path = '.reviews/peer/1.vision._.review.given.by_peer.mechanic.md';

      // wrapped in a plain object: a useThen proxy does not pass an Error through
      const refusal = useThen('the read is refused', async () => ({
        error: await getError(() => asRouteGuardReviewPeerPathHash({ path })),
      }));

      then('it refuses as a constraint, so the cli renders it', () => {
        expect(refusal.error).toBeInstanceOf(ConstraintError);
      });

      then('the refusal names the grammar, the fix, and the stray', () => {
        expect(refusal.error.message).toContain('given.by_peer.$slug.md');
        expect(refusal.error.message).toContain('delete the malformed file');
        expect(refusal.error.message).toContain(path);
      });

      then('the refusal matches its snapshot', () => {
        expect(refusal.error.message).toMatchSnapshot();
      });
    });
  });
});
