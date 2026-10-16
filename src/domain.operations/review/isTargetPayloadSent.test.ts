import { given, then, when } from 'test-fns';

import { isTargetPayloadSent } from './isTargetPayloadSent';

describe('isTargetPayloadSent', () => {
  given('[case1] push focus', () => {
    when('[t0] the payload decision is read', () => {
      then('the payload rides — diffs and file bodies reach the prompt', () => {
        expect(isTargetPayloadSent({ focus: 'push' })).toEqual(true);
      });
    });
  });

  given('[case2] pull focus', () => {
    when('[t0] the payload decision is read', () => {
      then('🔴 no payload rides — the brain opens the files itself', () => {
        // a census that counts a payload the prompt never carried drives `markup`
        // negative, so this answer must stay false under pull
        expect(isTargetPayloadSent({ focus: 'pull' })).toEqual(false);
      });
    });
  });
});
