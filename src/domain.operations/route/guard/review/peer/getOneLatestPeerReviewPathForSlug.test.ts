import { getOneLatestPeerReviewPathForSlug } from './getOneLatestPeerReviewPathForSlug';

const pathOf = (input: { iter: string; hash: string; slug: string }): string =>
  `.route/.reviews/peer/5.1.exec._.review.i${input.iter}.${input.hash}.r001._.given.by_peer.${input.slug}.md`;

describe('getOneLatestPeerReviewPathForSlug', () => {
  const TEST_CASES = [
    {
      description:
        'picks the highest iteration of the wanted slug, across hashes',
      given: {
        paths: [
          pathOf({ iter: '002', hash: 'aa11', slug: 'lint' }),
          pathOf({ iter: '009', hash: 'bb22', slug: 'lint' }),
          pathOf({ iter: '012', hash: 'cc33', slug: 'other' }),
          pathOf({ iter: '004', hash: 'dd44', slug: 'lint' }),
        ],
        slug: 'lint',
      },
      expect: {
        output: {
          path: pathOf({ iter: '009', hash: 'bb22', slug: 'lint' }),
          iteration: 9,
        },
      },
    },
    {
      description:
        'breaks a tie on iteration by path, so the pick is order-free (order a)',
      given: {
        paths: [
          pathOf({ iter: '009', hash: 'bb22', slug: 'lint' }),
          pathOf({ iter: '009', hash: 'aa11', slug: 'lint' }),
        ],
        slug: 'lint',
      },
      expect: {
        output: {
          path: pathOf({ iter: '009', hash: 'bb22', slug: 'lint' }),
          iteration: 9,
        },
      },
    },
    {
      description:
        'breaks a tie on iteration by path, so the pick is order-free (order b)',
      given: {
        paths: [
          pathOf({ iter: '009', hash: 'aa11', slug: 'lint' }),
          pathOf({ iter: '009', hash: 'bb22', slug: 'lint' }),
        ],
        slug: 'lint',
      },
      expect: {
        output: {
          path: pathOf({ iter: '009', hash: 'bb22', slug: 'lint' }),
          iteration: 9,
        },
      },
    },
    {
      description: 'returns null when no path belongs to the slug',
      given: {
        paths: [pathOf({ iter: '003', hash: 'ee55', slug: 'other' })],
        slug: 'lint',
      },
      expect: { output: null },
    },
  ];

  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getOneLatestPeerReviewPathForSlug(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
