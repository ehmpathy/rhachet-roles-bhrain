import { isReviewRunDirLater } from '@src/domain.operations/review/isReviewRunDirLater';

const TEST_CASES = [
  {
    description: 'a run minted after reads as later',
    given: {
      run: '/x/2026-09-18T00-00-02-000Z.pid1.bbb',
      than: '/y/2026-09-18T00-00-01-000Z.pid1.aaa',
    },
    expect: true,
  },
  {
    description: 'a run minted before reads as not later',
    given: {
      run: '/x/2026-09-18T00-00-01-000Z.pid1.aaa',
      than: '/y/2026-09-18T00-00-02-000Z.pid1.bbb',
    },
    expect: false,
  },
  {
    description: 'the same run is not later than itself',
    given: {
      run: '/x/2026-09-18T00-00-01-000Z.pid1.aaa',
      than: '/x/2026-09-18T00-00-01-000Z.pid1.aaa',
    },
    expect: false,
  },
  {
    description: 'the parent path plays no part — only the basename stamp',
    given: {
      run: '/a/2026-09-18T00-00-02-000Z.pid1.bbb',
      than: '/zzz/2026-09-18T00-00-01-000Z.pid1.aaa',
    },
    expect: true,
  },
];

describe('isReviewRunDirLater', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        isReviewRunDirLater({
          run: { dir: thisCase.given.run },
          than: { dir: thisCase.given.than },
        }),
      ).toEqual(thisCase.expect);
    }),
  );
});
