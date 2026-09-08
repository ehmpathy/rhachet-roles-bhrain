import { given, then, when } from 'test-fns';

import { asArtifactStreamContent } from './asArtifactStreamContent';
import { formatArtifactStreamBuckets } from './formatArtifactStreamBuckets';

/**
 * .what = the ROUND TRIP — render an artifact, then read it back
 * .why = the judge cache reconstructs `passed` and `reason` from a re-parse of the
 *        artifact it wrote on a prior attempt, so writer and reader share one grammar
 *        while they sit in two files. a test of either alone cannot see them drift.
 *
 * 🔴 .measured = the drift already happened once, silently. the reader matched only a
 *    MIDDLE-child bucket (`├─ label`, `│  ` column). the moment the writer learned to
 *    close the artifact with a LAST-child bucket (`└─ label`, 3-space column), every
 *    read returned `''` — and a cached judge's `reason` became `null` with no error.
 *    only the caller's own assertion caught it, three files away from the change.
 *
 * ⇒ so the clamp is the round trip, never the render. each case below writes with the
 *   real formatter and reads with the real reader; a change to either alone goes red.
 */
describe('asArtifactStreamContent', () => {
  /**
   * .what = renders the buckets exactly as an artifact writer does, then joins them
   * .why = a hand-written fixture would encode the grammar a THIRD time, which is the
   *        very duplication this pair exists to remove
   */
  const asRendered = (input: {
    stdout: string;
    stderr: string;
    hasFooter: boolean;
  }): string =>
    formatArtifactStreamBuckets({
      stdout: input.stdout,
      stderr: input.stderr,
      hasFooter: input.hasFooter,
    }).join('\n');

  given('[case1] both streams carry text, and a footer follows', () => {
    // both buckets are MIDDLE children — the shape the reader was born matched to
    const rendered = asRendered({
      stdout: 'passed: true\nreason: all checks passed',
      stderr: 'warn: slow',
      hasFooter: true,
    });

    when('[t0] each stream is read back', () => {
      then('stdout survives the round trip', () => {
        expect(
          asArtifactStreamContent({ content: rendered, label: 'stdout' }),
        ).toEqual('passed: true\nreason: all checks passed');
      });

      then('stderr survives the round trip', () => {
        expect(
          asArtifactStreamContent({ content: rendered, label: 'stderr' }),
        ).toEqual('warn: slow');
      });
    });
  });

  given('[case2] one stream, no footer — the LAST-child shape', () => {
    // 🔴 the case that broke. with stderr empty and no footer, stdout closes the
    //    artifact: `└─ stdout` with a 3-space column. a reader keyed to `├─`/`│  `
    //    finds no match and hands back '' — which reads to the judge cache as a
    //    judge that printed no text at all, so `passed` and `reason` both go null
    const rendered = asRendered({
      stdout: 'passed: true\nreason: all checks passed',
      stderr: '',
      hasFooter: false,
    });

    when('[t0] the closing bucket is read back', () => {
      then('the render really did use the last-child marker', () => {
        // .note = not decoration. were the writer to stop to emit `└─`, this suite
        //         would still pass on the reader alone and prove no round trip
        expect(rendered.startsWith('└─ stdout')).toEqual(true);
      });

      then('stdout survives the round trip', () => {
        expect(
          asArtifactStreamContent({ content: rendered, label: 'stdout' }),
        ).toEqual('passed: true\nreason: all checks passed');
      });

      then('the omitted stream reads as empty, never as a false value', () => {
        expect(
          asArtifactStreamContent({ content: rendered, label: 'stderr' }),
        ).toEqual('');
      });
    });
  });

  given('[case3] stderr closes the artifact', () => {
    const rendered = asRendered({
      stdout: 'passed: false',
      stderr: 'error: exploded',
      hasFooter: false,
    });

    when('[t0] both streams are read back', () => {
      then('the middle child survives', () => {
        expect(
          asArtifactStreamContent({ content: rendered, label: 'stdout' }),
        ).toEqual('passed: false');
      });

      then('the last child survives', () => {
        expect(
          asArtifactStreamContent({ content: rendered, label: 'stderr' }),
        ).toEqual('error: exploded');
      });
    });
  });

  given('[case4] a multi-line stream', () => {
    const rendered = asRendered({
      stdout: 'line one\nline two\nline three',
      stderr: '',
      hasFooter: true,
    });

    when('[t0] the stream is read back', () => {
      then('every line survives, and the borders do not', () => {
        expect(
          asArtifactStreamContent({ content: rendered, label: 'stdout' }),
        ).toEqual('line one\nline two\nline three');
      });
    });
  });

  given('[case5] a label that is absent from the content', () => {
    when('[t0] read against arbitrary text', () => {
      then('reads as empty rather than a throw', () => {
        expect(
          asArtifactStreamContent({
            content: 'not a tree at all',
            label: 'stdout',
          }),
        ).toEqual('');
      });
    });
  });
});
