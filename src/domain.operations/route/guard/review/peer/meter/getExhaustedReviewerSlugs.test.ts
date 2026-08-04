import { given, then, when } from 'test-fns';

import type { GuardPeerMeterStatus } from '../../../tree/formatGuardTree';
import type { ReviewPeerVerdict } from './computeReviewPeerVerdict';
import { getExhaustedReviewerSlugs } from './getExhaustedReviewerSlugs';

// build a minimal meter (the transformer reads only slug, level, verdict)
const asMeter = (input: {
  slug: string;
  level: number;
  verdict: ReviewPeerVerdict;
}): GuardPeerMeterStatus => ({
  slug: input.slug,
  level: input.level,
  verdict: input.verdict,
  rounds: 0,
  budget: 3,
  awaits: false,
  overruled: false,
  blockers: 0,
  nitpicks: 0,
  path: null,
});

describe('getExhaustedReviewerSlugs', () => {
  given('[case1] a mix of exhausted and non-exhausted reviewers', () => {
    const meters = [
      asMeter({ slug: 'alpha', level: 1, verdict: 'exhausted' }),
      asMeter({ slug: 'beta', level: 2, verdict: 'approved' }),
      asMeter({ slug: 'gamma', level: 3, verdict: 'exhausted' }),
    ];

    when('[t0] no level is overruled (empty set)', () => {
      then('returns every exhausted reviewer', () => {
        expect(
          getExhaustedReviewerSlugs({
            meters,
            overruledLevels: new Set<number>(),
          }),
        ).toEqual(['alpha', 'gamma']);
      });
    });

    when('[t1] a level of an exhausted reviewer is overruled', () => {
      then('drops the reviewer at the forgiven level', () => {
        expect(
          getExhaustedReviewerSlugs({
            meters,
            overruledLevels: new Set<number>([1]),
          }),
        ).toEqual(['gamma']);
      });
    });
  });

  given('[case2] no exhausted reviewers', () => {
    const meters = [
      asMeter({ slug: 'alpha', level: 1, verdict: 'approved' }),
      asMeter({ slug: 'beta', level: 2, verdict: 'rejected' }),
    ];

    when('[t0] read with an empty overruled set', () => {
      then('returns an empty list', () => {
        expect(
          getExhaustedReviewerSlugs({
            meters,
            overruledLevels: new Set<number>(),
          }),
        ).toEqual([]);
      });
    });
  });
});
