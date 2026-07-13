import { given, then, when } from 'test-fns';

import { formatRouteGuardReviewPeerContemplatePrompt } from './formatRouteGuardReviewPeerContemplatePrompt';

const pathGivenArch =
  '.reviews/peer/1.execute._.review.i001.a1b2c3.r001._.given.by_peer.architect.md';
const pathTakenArch =
  '.reviews/peer/1.execute._.review.i001.a1b2c3.r001._.taken.by_self.architect.md';
const pathGivenMech =
  '.reviews/peer/1.execute._.review.i001.a1b2c3.r002._.given.by_peer.mechanic.md';
const pathTakenMech =
  '.reviews/peer/1.execute._.review.i001.a1b2c3.r002._.taken.by_self.mechanic.md';

describe('formatRouteGuardReviewPeerContemplatePrompt', () => {
  given('[case1] the reply-prompt with two reviewers', () => {
    when('[t0] rendered', () => {
      const out = formatRouteGuardReviewPeerContemplatePrompt({
        case: 'reply-prompt',
        stone: '1.execute',
        reviewers: [
          {
            slug: 'architect',
            blockers: 2,
            nitpicks: 1,
            pathGiven: pathGivenArch,
            pathTaken: pathTakenArch,
          },
          {
            slug: 'mechanic',
            blockers: 0,
            nitpicks: 3,
            pathGiven: pathGivenMech,
            pathTaken: pathTakenMech,
          },
        ],
      });

      then('lists each reviewer with slug, verdict, and both paths', () => {
        expect(out).toContain('review.peer 1/2');
        expect(out).toContain('slug = architect');
        expect(out).toContain('verdict = 2 blockers, 1 nitpick');
        expect(out).toContain('review.peer 2/2');
        expect(out).toContain('verdict = 0 blockers, 3 nitpicks');
        expect(out).toContain(`contemplate from`);
        expect(out).toContain(pathGivenArch);
        expect(out).toContain('articulate into');
        expect(out).toContain(pathTakenArch);
      });

      then('closes with the --as contemplated run line', () => {
        expect(out).toContain(
          'rhx route.stone.set --stone 1.execute --as contemplated --that architect',
        );
      });

      then('matches snapshot', () => {
        expect(out).toMatchSnapshot();
      });
    });
  });

  given('[case2] the absent case for one reviewer', () => {
    when('[t0] rendered', () => {
      const out = formatRouteGuardReviewPeerContemplatePrompt({
        case: 'absent',
        stone: '1.execute',
        reviewer: {
          slug: 'architect',
          blockers: 2,
          nitpicks: 1,
          pathGiven: pathGivenArch,
          pathTaken: pathTakenArch,
        },
      });

      then('names the absent taken path and why it is required', () => {
        expect(out).toContain('contemplation absent for reviewer architect');
        expect(out).toContain(pathTakenArch);
        expect(out).toContain('the .taken file IS that engagement');
        expect(out).toContain('contemplate from');
        expect(out).toContain(pathGivenArch);
      });

      then('matches snapshot', () => {
        expect(out).toMatchSnapshot();
      });
    });
  });

  given('[case3] the stale case for one reviewer', () => {
    when('[t0] rendered', () => {
      const out = formatRouteGuardReviewPeerContemplatePrompt({
        case: 'stale',
        stone: '1.execute',
        reviewer: {
          slug: 'architect',
          blockers: 2,
          nitpicks: 1,
          pathGiven: pathGivenArch,
          pathTaken: pathTakenArch,
        },
      });

      then('renders distinct re-articulate copy from the absent case', () => {
        expect(out).toContain('contemplation stale for reviewer architect');
        expect(out).toContain('re-articulate for the current iteration');
        expect(out).not.toContain('the .taken file IS that engagement');
      });

      then('matches snapshot', () => {
        expect(out).toMatchSnapshot();
      });
    });
  });
});
