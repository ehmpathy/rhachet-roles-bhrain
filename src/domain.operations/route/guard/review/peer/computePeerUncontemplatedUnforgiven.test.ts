import { given, then, when } from 'test-fns';

import { computePeerUncontemplatedUnforgiven } from './computePeerUncontemplatedUnforgiven';

describe('computePeerUncontemplatedUnforgiven', () => {
  given('[case1] an owed reviewer at an un-overruled level', () => {
    when('[t0] no overruled slugs', () => {
      const result = computePeerUncontemplatedUnforgiven({
        uncontemplated: [{ slug: 'l3-reviewer' }],
        overruledSlugs: new Set<string>(),
        levelBySlug: new Map([['l3-reviewer', 3]]),
      });

      then('the reviewer remains, paired with its level', () => {
        expect(result).toEqual([{ slug: 'l3-reviewer', level: 3 }]);
      });
    });
  });

  given('[case2] an owed reviewer at an already-overruled level (B6)', () => {
    when('[t0] its slug is in overruledSlugs', () => {
      const result = computePeerUncontemplatedUnforgiven({
        uncontemplated: [{ slug: 'l1-reviewer' }],
        overruledSlugs: new Set(['l1-reviewer']),
        levelBySlug: new Map([['l1-reviewer', 1]]),
      });

      then('the reviewer is forgiven → dropped (design-note B6)', () => {
        expect(result).toEqual([]);
      });
    });
  });

  given('[case3] a mix of forgiven and un-forgiven owed reviewers', () => {
    when('[t0] one overruled, one not', () => {
      const result = computePeerUncontemplatedUnforgiven({
        uncontemplated: [{ slug: 'l1-reviewer' }, { slug: 'l3-reviewer' }],
        overruledSlugs: new Set(['l1-reviewer']),
        levelBySlug: new Map([
          ['l1-reviewer', 1],
          ['l3-reviewer', 3],
        ]),
      });

      then('only the un-forgiven reviewer remains, with its level', () => {
        expect(result).toEqual([{ slug: 'l3-reviewer', level: 3 }]);
      });
    });
  });

  given('[case4] a reviewer absent from the level map', () => {
    when('[t0] levelBySlug has no entry', () => {
      const result = computePeerUncontemplatedUnforgiven({
        uncontemplated: [{ slug: 'orphan' }],
        overruledSlugs: new Set<string>(),
        levelBySlug: new Map<string, number>(),
      });

      then('it falls back to level 1', () => {
        expect(result).toEqual([{ slug: 'orphan', level: 1 }]);
      });
    });
  });

  given('[case5] no owed reviewers at all', () => {
    when('[t0] uncontemplated is empty', () => {
      const result = computePeerUncontemplatedUnforgiven({
        uncontemplated: [],
        overruledSlugs: new Set(['l1-reviewer']),
        levelBySlug: new Map([['l1-reviewer', 1]]),
      });

      then('the result is empty', () => {
        expect(result).toEqual([]);
      });
    });
  });
});
