import { given, then, when } from 'test-fns';

import { asReviewBodyStdout } from './asReviewBodyStdout';
import { genReviewBodyStreamer } from './genReviewBodyStreamer';

/**
 * .what = feeds a full string through the streamer in the given chunk boundaries, returns what it
 *         wrote
 * .why = the streamer's contract is that the concatenation of its emissions is byte-identical to
 *        asReviewBodyStdout(full), no matter WHERE the chunk boundaries fall. this driver lets each
 *        case assert exactly that across a range of splits.
 */
const runStreamer = (input: { chunks: string[] }): string => {
  let out = '';
  const streamer = genReviewBodyStreamer({
    write: (text) => {
      out += text;
    },
  });
  for (const chunk of input.chunks) streamer.onChunk(chunk);
  streamer.done();
  return out;
};

const BANNER = '🪨 run solid skill repo=bhrain/role=reviewer/skill=review\n';
const BODY = [
  '',
  "🦉 let's review",
  '   └─ scope',
  '      └─ paths: src/clean.ts',
  '',
  '🦉 not even a vole',
  '',
  '🔍 review',
  '   └─ summary',
  '      ├─ 0 blockers',
  '      └─ 0 nitpicks',
].join('\n');

describe('genReviewBodyStreamer', () => {
  given('[case1] a capture that opens with the rhx dispatch banner', () => {
    const full = BANNER + BODY;

    when('[t0] fed as one whole chunk', () => {
      then('it strips the lead banner, emits only the body', () => {
        const out = runStreamer({ chunks: [full] });
        expect(out).not.toContain('🪨 run solid skill');
        expect(out).toContain("🦉 let's review");
      });

      then('the emission equals asReviewBodyStdout(full)', () => {
        expect(runStreamer({ chunks: [full] })).toEqual(
          asReviewBodyStdout({ stdout: full }),
        );
      });
    });

    when('[t1] fed split mid-banner (before the first newline)', () => {
      // the banner arrives across two chunks, its newline only in the second
      const chunks = [
        '🪨 run solid skill repo=bhrain',
        '/role=reviewer/skill=review\n' + BODY,
      ];

      then(
        'it still strips the banner and equals asReviewBodyStdout(full)',
        () => {
          expect(runStreamer({ chunks })).toEqual(
            asReviewBodyStdout({ stdout: full }),
          );
        },
      );
    });

    when('[t2] fed one byte-region at a time (many tiny chunks)', () => {
      // an adversarial split: every 3 chars, so the banner + body cross many boundaries
      const chunks = full.match(/[\s\S]{1,3}/g) ?? [];

      then(
        'the reassembled stream still equals asReviewBodyStdout(full)',
        () => {
          expect(runStreamer({ chunks })).toEqual(
            asReviewBodyStdout({ stdout: full }),
          );
        },
      );
    });
  });

  given(
    '[case1b] a capture that opens with blank line(s) BEFORE the banner',
    () => {
      // the real subprocess capture opens with blank line(s) at the front, ahead of the banner — the
      // exact shape that made a naive "flush on first newline" leak the banner. the streamer must hold
      // past the front blanks until the banner line itself completes.
      const full = '\n\n' + BANNER + BODY;

      when(
        '[t0] fed split so a blank line arrives before the banner chunk',
        () => {
          // chunk 1 = just the front blanks (a newline, no banner yet); chunk 2 = the banner + body
          const chunks = ['\n\n', BANNER + BODY];

          then(
            'it does NOT leak the banner and equals asReviewBodyStdout(full)',
            () => {
              const out = runStreamer({ chunks });
              expect(out).not.toContain('🪨 run solid skill');
              expect(out).toEqual(asReviewBodyStdout({ stdout: full }));
            },
          );
        },
      );

      when('[t1] fed one byte-region at a time (many tiny chunks)', () => {
        const chunks = full.match(/[\s\S]{1,3}/g) ?? [];

        then(
          'the reassembled stream still equals asReviewBodyStdout(full)',
          () => {
            expect(runStreamer({ chunks })).toEqual(
              asReviewBodyStdout({ stdout: full }),
            );
          },
        );
      });
    },
  );

  given('[case2] a capture with NO banner (already a bare body)', () => {
    const full = BODY.replace(/^\n/, '') + '\n';

    when('[t0] fed in chunks', () => {
      then('it passes the body through unchanged', () => {
        const out = runStreamer({
          chunks: [full.slice(0, 10), full.slice(10)],
        });
        expect(out).toEqual(asReviewBodyStdout({ stdout: full }));
        expect(out).toEqual(full);
      });
    });
  });

  given(
    '[case3] a capture shorter than a single line (no newline at all)',
    () => {
      // an error/degenerate case: the whole output is a fragment with no newline
      const full = '🪨 run solid skill repo=bhrain/role=reviewer/skill=review';

      when('[t0] fed with no final newline, then done()', () => {
        then(
          'done() flushes the held lead, banner-stripped, equal to asReviewBodyStdout(full)',
          () => {
            // asReviewBodyStdout only strips a banner line that ENDS in \n, so a newline-less
            // fragment comes back unchanged — the streamer must still flush it, never drop it
            expect(runStreamer({ chunks: [full] })).toEqual(
              asReviewBodyStdout({ stdout: full }),
            );
            expect(runStreamer({ chunks: [full] })).toEqual(full);
          },
        );
      });
    },
  );
});
