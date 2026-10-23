import { getAllLatestReviewFilesPerIndex } from './getAllLatestReviewFilesPerIndex';

const pathOf = (input: { iter: string; hash: string; index: string }): string =>
  `.route/.reviews/peer/5.1.exec._.review.i${input.iter}.${input.hash}.r${input.index}._.given.by_peer.lint.md`;

describe('getAllLatestReviewFilesPerIndex', () => {
  const TEST_CASES = [
    {
      description: 'keeps the highest iteration per index, sorted by index',
      given: {
        reviewFiles: [
          pathOf({ iter: '004', hash: 'aa11', index: '002' }),
          pathOf({ iter: '002', hash: 'aa11', index: '001' }),
          pathOf({ iter: '007', hash: 'aa11', index: '001' }),
          pathOf({ iter: '003', hash: 'aa11', index: '002' }),
        ],
      },
      expect: {
        output: [
          pathOf({ iter: '007', hash: 'aa11', index: '001' }),
          pathOf({ iter: '004', hash: 'aa11', index: '002' }),
        ],
      },
    },
    {
      description:
        'breaks a tie on iteration by path, so the pick is order-free (order a)',
      given: {
        reviewFiles: [
          pathOf({ iter: '005', hash: 'bb22', index: '001' }),
          pathOf({ iter: '005', hash: 'aa11', index: '001' }),
        ],
      },
      expect: {
        output: [pathOf({ iter: '005', hash: 'bb22', index: '001' })],
      },
    },
    {
      description:
        'breaks a tie on iteration by path, so the pick is order-free (order b)',
      given: {
        reviewFiles: [
          pathOf({ iter: '005', hash: 'aa11', index: '001' }),
          pathOf({ iter: '005', hash: 'bb22', index: '001' }),
        ],
      },
      expect: {
        output: [pathOf({ iter: '005', hash: 'bb22', index: '001' })],
      },
    },
  ];

  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getAllLatestReviewFilesPerIndex(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
