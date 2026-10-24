import { getAllConcernLabelsDeclaredOnGiven } from './getAllConcernLabelsDeclaredOnGiven';
import type { ReviewAbsorption } from './ReviewAbsorption';

const FILENAME = '1.test._.review.i001.abc123.r001._.given.by_peer.mech.md';

const absorptionOf = (input: {
  reviewer: string;
  about: string;
  given: string;
}): ReviewAbsorption => ({
  status: 'conceded',
  reviewer: input.reviewer,
  about: input.about,
  given: input.given,
  severity: 'better',
});

describe('getAllConcernLabelsDeclaredOnGiven', () => {
  test('returns the labels of stances on this reviewer and this given, in either row form', () => {
    const labels = getAllConcernLabelsDeclaredOnGiven({
      absorptions: [
        absorptionOf({ reviewer: 'mech', about: 'blocker.1', given: FILENAME }),
        absorptionOf({
          reviewer: 'mech',
          about: 'nitpick.1',
          given: `/real/repo/.behavior/v0/.reviews/peer/${FILENAME}`,
        }),
      ],
      reviewer: 'mech',
      given: `/alias/repo/.behavior/v0/.reviews/peer/${FILENAME}`,
    });
    expect(labels).toEqual(['blocker.1', 'nitpick.1']);
  });

  test('excludes stances of another reviewer or another given', () => {
    const labels = getAllConcernLabelsDeclaredOnGiven({
      absorptions: [
        absorptionOf({ reviewer: 'ergo', about: 'blocker.1', given: FILENAME }),
        absorptionOf({
          reviewer: 'mech',
          about: 'blocker.2',
          given: FILENAME.replace('i001', 'i002'),
        }),
      ],
      reviewer: 'mech',
      given: FILENAME,
    });
    expect(labels).toEqual([]);
  });
});
