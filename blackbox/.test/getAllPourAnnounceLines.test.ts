import { given, then, when } from 'test-fns';

import {
  assertPourRostersComplete,
  getAllPourAnnounceLines,
} from './getAllPourAnnounceLines';

/**
 * .what = clamps the guard that catches a truncated roster filter
 *
 * 🔴 .why = this helper exists because a snapshot cannot catch a truncated
 *         INPUT. so the helper itself needs an oracle that is not a snapshot —
 *         otherwise the guard against silent truncation is guarded by the very
 *         mechanism that failed to catch it
 */
describe('getAllPourAnnounceLines', () => {
  given('[case1] a whole announce — 4 declared, 4 rostered', () => {
    const stderr = [
      'some unrelated stderr line',
      '🦉 l1 pours 4 lanes',
      '   ├─ r1:l1-a',
      '   ├─ r2:l1-b',
      '   ├─ r3:l1-c',
      '   └─ r4:l1-d',
      'more unrelated stderr',
    ].join('\n');

    when('[t0] the lines are read', () => {
      then('it yields the header and every branch, in emit order', () => {
        expect(getAllPourAnnounceLines(stderr)).toEqual([
          '🦉 l1 pours 4 lanes',
          '   ├─ r1:l1-a',
          '   ├─ r2:l1-b',
          '   ├─ r3:l1-c',
          '   └─ r4:l1-d',
        ]);
      });
    });
  });

  given('[case2] two announces, each whole — a bounded level and a free one', () => {
    const stderr = [
      '🦉 l1 pours 2 lanes',
      '   ├─ r1:l1-a',
      '   └─ r2:l1-b',
      '🦉 l3 pours 3 lanes · ≤1 at a time',
      '   ├─ r3:l3-a',
      '   ├─ r4:l3-b',
      '   └─ r5:l3-c',
    ].join('\n');

    when('[t0] the lines are read', () => {
      then('each roster is scoped to its OWN announce', () => {
        // .why = the count is per announce, never a total. a check that summed
        //        every branch against every declared count would pass a run
        //        where l1 lost a member and l3 gained a phantom
        expect(getAllPourAnnounceLines(stderr)).toHaveLength(7); // 2 headers + 2 + 3
      });
    });
  });

  given('[case3] 🔴 the measured defect — a `└─`-only filter', () => {
    // 🔴 .why = the exact input the old filter produced. it read `└─` alone, so
    //           only the LAST member survived and `--resnap` wrote this as the
    //           oracle, green, across four call sites at once
    const truncated = ['🦉 l1 pours 4 lanes', '   └─ r4:l1-d'];

    when('[t0] the truncated lines are checked', () => {
      then('it THROWS — a short roster is a harness defect, never a subject one', () => {
        expect(() => assertPourRostersComplete(truncated)).toThrow(
          'pour announce roster does not match its count',
        );
      });

      then('the error names the arithmetic, so the fix is legible', () => {
        // .why = a bare "roster does not match" sends the reader to count by
        //        hand. both terms of the mismatch are interpolated into the
        //        message, so the failure line carries the whole diagnosis.
        // 🔴 .note = they rode a `HelpfulError` metadata bag until i023, which
        //        renders as a raw JSON dump on the line a human reads. the
        //        terms are the same; only their shape on the page changed
        expect(() => assertPourRostersComplete(truncated)).toThrow(/declared 4/);
        expect(() => assertPourRostersComplete(truncated)).toThrow(/rostered 1/);
        expect(() => assertPourRostersComplete(truncated)).toThrow(/\[├└\]/);
      });

      then('the message carries NO json dump', () => {
        // 🔴 the clamp with teeth: it goes red the moment a metadata bag returns
        //    as the second constructor argument, because `HelpfulError` appends
        //    `JSON.stringify(metadata)` onto `.message`
        expect(() => assertPourRostersComplete(truncated)).not.toThrow(
          /\{"announce"/,
        );
      });
    });
  });

  given('[case4] a solo level — 1 declared, 1 rostered', () => {
    const stderr = ['🦉 l1 pours 1 lane', '   └─ r1:solo'].join('\n');

    when('[t0] the lines are read', () => {
      then('the singular noun is no special case', () => {
        expect(getAllPourAnnounceLines(stderr)).toEqual([
          '🦉 l1 pours 1 lane',
          '   └─ r1:solo',
        ]);
      });
    });
  });

  given('[case5] stderr with no announce at all', () => {
    when('[t0] the lines are read', () => {
      then('it yields an empty set, and refuses none of it', () => {
        expect(getAllPourAnnounceLines('a log with no pour in it')).toEqual([]);
      });
    });
  });

  given('[case6] 🔴 a roster with one EXTRA member', () => {
    // .why = the false-positive half. a check that only caught a SHORT roster
    //        would pass a filter that swept in a neighbouring level's branches
    const overfull = [
      '🦉 l1 pours 2 lanes',
      '   ├─ r1:l1-a',
      '   ├─ r2:l1-b',
      '   └─ r3:l1-c',
    ];

    when('[t0] the lines are checked', () => {
      then('it THROWS — the count must MATCH, never merely reach', () => {
        expect(() => assertPourRostersComplete(overfull)).toThrow(
          'pour announce roster does not match its count',
        );
      });

      then('the diagnosis names the OVERFULL cause, not the short one', () => {
        // 🔴 .why = one throw site serves both directions, so a single hard-coded
        //    hint is wrong on one of them. it read "a filter that reads one glyph
        //    alone" for BOTH until i023 — which sends a reader chasing a
        //    truncation that did not happen
        expect(() => assertPourRostersComplete(overfull)).toThrow(
          /sweeps in the next level branches/,
        );
        expect(() => assertPourRostersComplete(overfull)).not.toThrow(
          /keeps only the last member/,
        );
      });
    });
  });
});
