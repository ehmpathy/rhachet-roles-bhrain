import { asReviewAbsorptionKey } from './asReviewAbsorptionKey';
import type { ReviewAbsorption } from './ReviewAbsorption';

const FILENAME = '1.test._.review.i001.abc123.r001._.given.by_peer.mech.md';

const absorptionOf = (input: {
  reviewer?: string;
  about?: string;
  given: string;
}): ReviewAbsorption => ({
  status: 'conceded',
  reviewer: input.reviewer ?? 'mech',
  about: input.about ?? 'blocker.1',
  given: input.given,
  severity: 'better',
});

describe('asReviewAbsorptionKey', () => {
  test('a legacy absolute row and a filename row on one concern fold to one key', () => {
    const keyLegacy = asReviewAbsorptionKey({
      absorption: absorptionOf({
        given: `/real/repo/.behavior/v0/.reviews/peer/${FILENAME}`,
      }),
    });
    const keyFilename = asReviewAbsorptionKey({
      absorption: absorptionOf({ given: FILENAME }),
    });
    expect(keyLegacy).toEqual(keyFilename);
  });

  test('another concern of the same given keys apart', () => {
    expect(
      asReviewAbsorptionKey({ absorption: absorptionOf({ given: FILENAME }) }),
    ).not.toEqual(
      asReviewAbsorptionKey({
        absorption: absorptionOf({ given: FILENAME, about: 'blocker.2' }),
      }),
    );
  });

  test('another reviewer on the same concern keys apart', () => {
    expect(
      asReviewAbsorptionKey({ absorption: absorptionOf({ given: FILENAME }) }),
    ).not.toEqual(
      asReviewAbsorptionKey({
        absorption: absorptionOf({ given: FILENAME, reviewer: 'ergo' }),
      }),
    );
  });

  test('the key reads reviewer, concern, and filename', () => {
    expect(
      asReviewAbsorptionKey({ absorption: absorptionOf({ given: FILENAME }) }),
    ).toEqual(`mech::blocker.1::${FILENAME}`);
  });
});
