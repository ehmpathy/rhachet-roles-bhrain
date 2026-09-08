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
        expect(result).toEqual([
          { slug: 'l3-reviewer', level: 3, retired: false },
        ]);
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
        expect(result).toEqual([
          { slug: 'l3-reviewer', level: 3, retired: false },
        ]);
      });
    });
  });

  given('[case4] a reviewer absent from the level map — RETIRED', () => {
    // levelBySlug is built from the LIVE guard config, so absence from it means the
    // reviewer was deleted while it still held an unanswered blocker (F8). the `?? 1`
    // fallback alone renders that as an ordinary level-1 reviewer, and the driver is
    // then named a reviewer it cannot find anywhere — the flag is what lets the halt
    // prompt say so, and its absence would make the halt read as a defect
    when('[t0] levelBySlug has no entry', () => {
      const result = computePeerUncontemplatedUnforgiven({
        uncontemplated: [{ slug: 'orphan' }],
        overruledSlugs: new Set<string>(),
        levelBySlug: new Map<string, number>(),
      });

      then('it falls back to level 1 AND is marked retired', () => {
        expect(result).toEqual([{ slug: 'orphan', level: 1, retired: true }]);
      });
    });

    when('[t1] a level-1 reviewer that IS in the config', () => {
      const result = computePeerUncontemplatedUnforgiven({
        uncontemplated: [{ slug: 'live-l1' }],
        overruledSlugs: new Set<string>(),
        levelBySlug: new Map([['live-l1', 1]]),
      });

      then('it is NOT retired — level 1 alone never implies absence', () => {
        // the trap the flag exists to avoid: a genuine level-1 reviewer and a retired
        // one are indistinguishable by level, since the fallback yields the same number
        expect(result).toEqual([{ slug: 'live-l1', level: 1, retired: false }]);
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

  given('[case6] full contemplation records, not bare slugs', () => {
    when('[t0] narrowed', () => {
      // the two passage gates render a reply-prompt that needs each reviewer's
      // verdict counts and BOTH conversation paths. were this narrow lossy, each
      // gate would have to re-read the peer directory and re-join by slug — a
      // second answer to "whom does the prompt name", free to drift from this one
      const result = computePeerUncontemplatedUnforgiven({
        uncontemplated: [
          {
            slug: 'architect',
            tag: 'absent' as const,
            blockers: 2,
            nitpicks: 1,
            pathGiven: '1.x._.review.i001.h1.r001._.given.by_peer.architect.md',
            pathTaken: '1.x._.review.i001.h1.r001._.taken.by_self.architect.md',
          },
          {
            slug: 'mechanic',
            tag: 'stale' as const,
            blockers: 3,
            nitpicks: 0,
            pathGiven: '1.x._.review.i002.h2.r002._.given.by_peer.mechanic.md',
            pathTaken: '1.x._.review.i002.h2.r002._.taken.by_self.mechanic.md',
          },
        ],
        overruledSlugs: new Set(['mechanic']),
        levelBySlug: new Map([
          ['architect', 1],
          ['mechanic', 2],
        ]),
      });

      then('the forgiven reviewer is still dropped', () => {
        expect(result.map((reviewer) => reviewer.slug)).toEqual(['architect']);
      });

      then('every field of the survivor survives, with its level', () => {
        expect(result[0]).toEqual({
          slug: 'architect',
          tag: 'absent',
          blockers: 2,
          nitpicks: 1,
          pathGiven: '1.x._.review.i001.h1.r001._.given.by_peer.architect.md',
          pathTaken: '1.x._.review.i001.h1.r001._.taken.by_self.architect.md',
          level: 1,
          retired: false,
        });
      });
    });
  });
});
