import { given, then, when } from 'test-fns';

import { asStderrSansPourAnnounce } from './asStderrSansPourAnnounce';

describe('asStderrSansPourAnnounce', () => {
  given('[case1] a stderr that carries only the announce', () => {
    when('[t0] one level pours', () => {
      then('it returns empty', () => {
        const stderr = [
          '🦉 l1 pours 2 lanes',
          '   ├─ r1:alpha-checker',
          '   └─ r2:beta-checker',
          '',
        ].join('\n');

        expect(asStderrSansPourAnnounce({ stderr })).toEqual('');
      });
    });

    when('[t1] two levels pour, back to back', () => {
      then('both blocks are consumed', () => {
        // ⚠️ a real guard pours l1, then l3 — and on the success path no other
        //    writer sits between them, so the two blocks are adjacent
        const stderr = [
          '🦉 l1 pours 2 lanes',
          '   ├─ r1:alpha-checker',
          '   └─ r2:beta-checker',
          '🦉 l3 pours 1 lane',
          '   └─ r3:final-checker',
          '',
        ].join('\n');

        expect(asStderrSansPourAnnounce({ stderr })).toEqual('');
      });
    });

    when('[t2] the header carries a bound clause', () => {
      then('it is still consumed', () => {
        const stderr = [
          '🦉 l1 pours 4 lanes · ≤2 at a time',
          '   ├─ r1:alpha-checker',
          '   └─ r2:beta-checker',
        ].join('\n');

        expect(asStderrSansPourAnnounce({ stderr })).toEqual('');
      });
    });
  });

  given('[case2] a stderr that carries a GUARD RESULT', () => {
    when('[t0] the result follows the announce', () => {
      then('the result survives, so the clamp goes red', () => {
        const stderr = [
          '🦉 l1 pours 1 lane',
          '   └─ r1:alpha-checker',
          '',
          '💥 malfunction: review timed out after 21 minutes',
        ].join('\n');

        expect(asStderrSansPourAnnounce({ stderr })).toEqual(
          '💥 malfunction: review timed out after 21 minutes',
        );
      });
    });

    when('[t1] 🔴 the result WEARS the roster grammar, mid-stream', () => {
      then('it survives — this is the whole repair', () => {
        // 🔴 .why this case exists = the prior form filtered by SHAPE, wherever
        //     a line sat. the guard tree renders `   ├─ r1: repo-rules (l1, …)`,
        //     which the roster pattern matches — so a regression that moved the
        //     RESULT tree onto stderr was stripped clean and `toEqual('')`
        //     passed on data it never saw. the clamp minted to catch a failhide
        //     had become one. raised i033/r9
        //
        // ✅ .teeth = MEASURED. restore the `.filter(...)` form and this then-block
        //     goes red while every `[case1]` assertion stays green — the announce
        //     is still removed, it merely stops to be positional
        const stderr = [
          '🦉 l1 pours 1 lane',
          '   └─ r1:alpha-checker',
          '',
          '   ├─ r1: repo-rules (l1, 13/13)',
          '   │   └─ rejected 124.1s',
        ].join('\n');

        expect(asStderrSansPourAnnounce({ stderr })).toContain('repo-rules');
        expect(asStderrSansPourAnnounce({ stderr })).toContain('rejected');
      });
    });

    when('[t2] the result precedes any announce', () => {
      then('the prefix consumer stops at once', () => {
        const stderr = [
          '💥 malfunction: reviewer exited 127',
          '🦉 l1 pours 1 lane',
          '   └─ r1:alpha-checker',
        ].join('\n');

        // ⚠️ the announce is NOT consumed here, and that is correct — the
        //    prefix is over at the first line that is not a header, so a
        //    result at the head takes the whole stream with it. a louder
        //    failure than a quieter one
        expect(asStderrSansPourAnnounce({ stderr })).toContain('exited 127');
      });
    });
  });

  given('[case3] an empty stderr — the pre-pour baseline', () => {
    when('[t0] no byte was written', () => {
      then('it returns empty rather than throws', () => {
        expect(asStderrSansPourAnnounce({ stderr: '' })).toEqual('');
      });
    });
  });
});
