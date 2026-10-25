import { isReviewAbsorptionOnGiven } from './isReviewAbsorptionOnGiven';
import type { ReviewAbsorption } from './ReviewAbsorption';

const FILENAME = '1.test._.review.i001.abc123.r001._.given.by_peer.mech.md';

const absorptionOf = (input: {
  reviewer: string;
  given: string;
}): ReviewAbsorption => ({
  status: 'conceded',
  reviewer: input.reviewer,
  about: 'blocker.1',
  given: input.given,
  fulcrum: undefined,
  severity: 'better',
});

const TEST_CASES = [
  {
    description: 'a filename stance matches the absolute given of its reviewer',
    given: {
      absorption: absorptionOf({ reviewer: 'mech', given: FILENAME }),
      reviewer: 'mech',
      given: `/home/a/repo/.behavior/v0/.reviews/peer/${FILENAME}`,
    },
    expect: { output: true },
  },
  {
    description:
      'a legacy absolute stance matches the same given spelled via another path',
    given: {
      absorption: absorptionOf({
        reviewer: 'mech',
        given: `/real/repo/.behavior/v0/.reviews/peer/${FILENAME}`,
      }),
      reviewer: 'mech',
      given: `/alias/repo/.behavior/v0/.reviews/peer/${FILENAME}`,
    },
    expect: { output: true },
  },
  {
    description: 'another reviewer never matches',
    given: {
      absorption: absorptionOf({ reviewer: 'ergo', given: FILENAME }),
      reviewer: 'mech',
      given: FILENAME,
    },
    expect: { output: false },
  },
  {
    description: 'another given of the same reviewer never matches',
    given: {
      absorption: absorptionOf({ reviewer: 'mech', given: FILENAME }),
      reviewer: 'mech',
      given: FILENAME.replace('i001', 'i002'),
    },
    expect: { output: false },
  },
];

describe('isReviewAbsorptionOnGiven', () => {
  TEST_CASES.forEach((thisCase) =>
    test(thisCase.description, () => {
      expect(isReviewAbsorptionOnGiven(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
