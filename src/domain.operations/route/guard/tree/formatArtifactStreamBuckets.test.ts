import { given, then, when } from 'test-fns';

import { formatArtifactStreamBuckets } from './formatArtifactStreamBuckets';

describe('formatArtifactStreamBuckets', () => {
  given('[case1] both streams carry text', () => {
    when('[t0] formatted with a footer to follow', () => {
      const buckets = formatArtifactStreamBuckets({
        stdout: 'passed: false',
        stderr: 'warn: slow',
        hasFooter: true,
      });

      then('both buckets are emitted', () => {
        expect(buckets).toHaveLength(2);
        expect(buckets[0]).toContain('stdout');
        expect(buckets[1]).toContain('stderr');
      });

      then('neither closes the artifact — the footer does', () => {
        expect(buckets[0]!.startsWith('├─')).toEqual(true);
        expect(buckets[1]!.startsWith('├─')).toEqual(true);
      });
    });

    when('[t1] formatted with no footer', () => {
      const buckets = formatArtifactStreamBuckets({
        stdout: 'passed: true',
        stderr: 'warn: slow',
        hasFooter: false,
      });

      then('the last bucket closes the artifact', () => {
        expect(buckets[0]!.startsWith('├─')).toEqual(true);
        expect(buckets[1]!.startsWith('└─')).toEqual(true);
      });
    });
  });

  given('[case2] stderr is empty — the reported blemish', () => {
    when('[t0] formatted with a footer to follow', () => {
      const buckets = formatArtifactStreamBuckets({
        stdout: 'passed: false',
        stderr: '',
        hasFooter: true,
      });

      then('no stderr bucket is emitted', () => {
        expect(buckets).toHaveLength(1);
        expect(buckets.join('\n')).not.toContain('stderr');
      });

      then('the stdout bucket wraps real text', () => {
        expect(buckets[0]).toContain('passed: false');
      });
    });

    when('[t1] formatted with no footer', () => {
      const buckets = formatArtifactStreamBuckets({
        stdout: 'passed: true',
        stderr: '',
        hasFooter: false,
      });

      then(
        'stdout closes the artifact — no marker with an absent peer beneath',
        () => {
          // 🔴 this is the hazard the omission introduces if shape is decided elsewhere.
          //    drop the empty stderr bucket at a call site and stdout keeps its `├─`,
          //    which promises a peer below it that no longer exists — one blemish
          //    traded for another. the two decisions are made here, together
          expect(buckets).toHaveLength(1);
          expect(buckets[0]!.startsWith('└─')).toEqual(true);
        },
      );
    });
  });

  given('[case3] stdout is empty but stderr carries text', () => {
    when('[t0] formatted', () => {
      const buckets = formatArtifactStreamBuckets({
        stdout: '',
        stderr: 'error: exploded',
        hasFooter: true,
      });

      then('only the stderr bucket is emitted', () => {
        expect(buckets).toHaveLength(1);
        expect(buckets[0]).toContain('stderr');
        expect(buckets[0]).toContain('error: exploded');
      });
    });
  });

  given('[case4] both streams are empty', () => {
    when('[t0] formatted', () => {
      const buckets = formatArtifactStreamBuckets({
        stdout: '',
        stderr: '',
        hasFooter: true,
      });

      then('stdout is kept as the floor, so the artifact has a body', () => {
        // an artifact whose every stream was empty would otherwise print a bare
        // label and no body at all — less legible than one empty box
        expect(buckets).toHaveLength(1);
        expect(buckets[0]).toContain('stdout');
      });
    });
  });

  given('[case5] a stream holds only whitespace', () => {
    when('[t0] formatted', () => {
      const buckets = formatArtifactStreamBuckets({
        stdout: 'passed: true',
        stderr: '\n  \n',
        hasFooter: true,
      });

      then('the whitespace stream counts as empty', () => {
        // `formatTreeBucket` trims to '' anyway, so a whitespace-only stream would
        // render the same wrapper around no text — the same blemish by another route
        expect(buckets).toHaveLength(1);
        expect(buckets.join('\n')).not.toContain('stderr');
      });
    });
  });

  given('[case6] snapshot verification', () => {
    when('[t0] a zero-exit judge with no stderr', () => {
      then(
        'matches snapshot — no empty box, no marker with an absent peer',
        () => {
          expect(
            formatArtifactStreamBuckets({
              stdout: '\npassed: true\nreason: all clear\n',
              stderr: '',
              hasFooter: false,
            }).join('\n'),
          ).toMatchSnapshot('judge artifact - zero exit, stdout only');
        },
      );
    });
  });
});
