import { given, then, when } from 'test-fns';

import { asCourseRouteName } from './asCourseRouteName';
import { asCourseRouteParts } from './asCourseRouteParts';
import { asPursuitRouteName } from './asPursuitRouteName';
import { asPursuitRouteParts } from './asPursuitRouteParts';
import { isEducationSlug } from './isEducationSlug';

const PURSUIT = '.route/v2026_11_23.education.pursuit.mechanic.reliable-writes';

describe('asPursuitRouteParts', () => {
  given('[case1] a pursuit route dir', () => {
    when('[t0] parsed', () => {
      then('it yields date, role, and slug', () => {
        expect(asPursuitRouteParts({ route: PURSUIT })).toEqual({
          date: '2026_11_23',
          role: 'mechanic',
          slug: 'reliable-writes',
        });
      });
      then('the name round-trips', () => {
        const parts = asPursuitRouteParts({ route: PURSUIT })!;
        expect(asPursuitRouteName(parts)).toEqual(
          'v2026_11_23.education.pursuit.mechanic.reliable-writes',
        );
      });
    });
  });

  given('[case2] a dir that is no pursuit', () => {
    when('[t0] parsed', () => {
      then('it yields null', () => {
        expect(
          asPursuitRouteParts({ route: '.behavior/v2026_11_23.feat-x' }),
        ).toBeNull();
        expect(
          asPursuitRouteParts({
            route: '.route/v2026_11_23.declapract.upgrade',
          }),
        ).toBeNull();
      });
    });
  });
});

describe('asCourseRouteParts', () => {
  given('[case1] a course route under a pursuit', () => {
    when('[t0] parsed', () => {
      then('it yields ordinal, slug, and the pursuit', () => {
        expect(
          asCourseRouteParts({
            route: `${PURSUIT}/2.courses.pursue.yield/course=2.retries`,
          }),
        ).toEqual({ ordinal: 2, slug: 'retries', pursuit: PURSUIT });
      });
      then('the name round-trips', () => {
        expect(asCourseRouteName({ ordinal: 2, slug: 'retries' })).toEqual(
          'course=2.retries',
        );
      });
    });
  });

  given('[case2] a course-shaped dir outside a pursuit', () => {
    when('[t0] parsed', () => {
      then('it yields null', () => {
        expect(
          asCourseRouteParts({ route: '.route/elsewhere/course=1.retries' }),
        ).toBeNull();
        expect(
          asCourseRouteParts({
            route:
              '.route/v2026_11_23.feat/2.courses.pursue.yield/course=1.retries',
          }),
        ).toBeNull();
      });
    });
  });
});

describe('isEducationSlug', () => {
  const TEST_CASES = [
    { slug: 'idempotency', expect: true },
    { slug: 'reliable-writes', expect: true },
    { slug: 'Retries', expect: false },
    { slug: 'two words', expect: false },
    { slug: 'trail-', expect: false },
    { slug: 'a.b', expect: false },
  ];
  TEST_CASES.map((thisCase) =>
    test(`${thisCase.slug} → ${thisCase.expect}`, () => {
      expect(isEducationSlug({ slug: thisCase.slug })).toEqual(thisCase.expect);
    }),
  );
});
