import { asReviewRouteOfOutput } from './asReviewRouteOfOutput';

const CWD = '/repo';
const ROUTE = '.behavior/v2026_09_08.feat';
const NAME =
  '5.1.execution.from_vision._.review.i003.a1b2c3d.r002._.given.by_peer.mech-failhides.report.md';

const TEST_CASES = [
  {
    description: 'a relative guard output yields its route, relative to cwd',
    given: { output: `${ROUTE}/.reviews/peer/${NAME}`, cwd: CWD },
    expect: ROUTE,
  },
  {
    description:
      '🔴 an absolute guard output yields the same relative route — targets are relative, so the spec check must be too',
    given: { output: `${CWD}/${ROUTE}/.reviews/peer/${NAME}`, cwd: CWD },
    expect: ROUTE,
  },
  {
    description: 'a hand-run output with no route yields null, never a guess',
    given: { output: '.log/review/report.md', cwd: CWD },
    expect: null,
  },
] as const;

describe('asReviewRouteOfOutput', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asReviewRouteOfOutput(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
