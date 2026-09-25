import { asIsoTimeStamp } from 'iso-time';
import { given, then, when } from 'test-fns';

import { formatStaleArticulation } from './formatStaleArticulation';

/**
 * .what = masks an iso stamp before the snapshot is taken
 *
 * 🔴 .why = the repo's pre-commit hook forbids a wall-clock stamp in any committed snapshot.
 *           these two are FIXED literals fed to a pure formatter, so they cannot drift — but a
 *           regex cannot tell a fixed literal from a live clock, and the guard is right to
 *           refuse both rather than guess.
 *
 * ⇒ the VALUES stay proven by the `toContain` assertions against the raw output; the snapshot
 *   keeps its one job, which is the SHAPE (`rule.require.snapshots`: snapshot for the vibe
 *   check, assertions for the function).
 */
const asStampFreeSnapshot = (output: string): string =>
  output.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/g, '[STAMP]');

describe('formatStaleArticulation', () => {
  const articulationPath =
    '.behavior/v2026_03_08.feature/review/self/for.1._.design.md';

  given('[case1] the file is plainly older than the ask', () => {
    const output = formatStaleArticulation({
      articulationPath,
      articulationMtime: asIsoTimeStamp('2026-03-01T09:00:00Z'),
      askedAt: asIsoTimeStamp('2026-03-08T14:30:00Z'),
    }).join('\n');

    when('[t0] format is called', () => {
      then('names both dates, so the driver sees which is the problem', () => {
        expect(output).toContain('written  = 2026-03-01T09:00:00Z');
        expect(output).toContain('asked at = 2026-03-08T14:30:00Z');
      });

      then('names the path it read', () => {
        expect(output).toContain(articulationPath);
      });

      then('names the fix — read what is there now', () => {
        expect(output).toContain('read what is there now');
        expect(output).toContain('then promise again');
      });

      /**
       * .why = the D5 invariant. a driver whose defect is freshness must never be told to
       *        slow down — they would pay a round trip to learn the wrong lesson.
       */
      then('does NOT reproach the driver for haste', () => {
        expect(output).not.toContain('patience, friend');
        expect(output).not.toContain('what is the rush');
        expect(output).not.toContain('pond barely rippled');
      });

      then('snapshot matches vision', () => {
        expect(asStampFreeSnapshot(output)).toMatchSnapshot();
      });
    });
  });

  /**
   * 🔴 .what = the two stamps are SECOND-precision, so a file written moments before the ask
   *            renders identically to it.
   * .why = "it is older than the question" beside two identical stamps reads as a malfunction,
   *        not as a verdict. measured: an integration run printed a `written` stamp above an
   *        `asked at` stamp that matched it character for character, and claimed one preceded
   *        the other.
   */
  given('[case2] the file was written just before the ask', () => {
    const sameStamp = asIsoTimeStamp('2026-03-08T14:30:00Z');
    const output = formatStaleArticulation({
      articulationPath,
      articulationMtime: sameStamp,
      askedAt: sameStamp,
    }).join('\n');

    when('[t0] format is called', () => {
      then('admits the two read alike, rather than assert a sequence', () => {
        expect(output).toContain('the two read alike');
        expect(output).toContain('under a second');
      });

      then('names the real situation — written before the ask', () => {
        expect(output).toContain('just before the guard asked');
      });

      then('names a one-step fix', () => {
        expect(output).toContain('re-save the file');
      });

      /**
       * .why = the words are probably fine, so a message that sends the driver back to
       *        re-read the artifact would waste a full review round
       */
      then('does NOT send the driver back to re-read the artifact', () => {
        expect(output).not.toContain('read what is there now');
        expect(output).not.toContain('has since moved on');
      });

      then('snapshot matches vision', () => {
        expect(asStampFreeSnapshot(output)).toMatchSnapshot();
      });
    });
  });

  given('[case3] a stamp could not be read', () => {
    const output = formatStaleArticulation({
      articulationPath,
      articulationMtime: undefined,
      askedAt: undefined,
    }).join('\n');

    when('[t0] format is called', () => {
      /**
       * .why = two undefined stamps must NOT satisfy the identical-render branch. an unread
       *        pair is not evidence the gap is under a second, and to say so would invent
       *        a fact the guard never measured.
       */
      then('does not claim the two read alike', () => {
        expect(output).not.toContain('the two read alike');
      });

      then('says plainly that each is unread', () => {
        expect(output).toContain('written  = (unread)');
        expect(output).toContain('asked at = (unread)');
      });
    });
  });
});
