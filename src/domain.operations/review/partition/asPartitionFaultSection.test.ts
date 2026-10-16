import { BadRequestError, ConstraintError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { ReviewBrainCallError } from '@src/domain.operations/review/ReviewBrainCallError';
import { ReviewOverflowRefusedError } from '@src/domain.operations/review/ReviewOverflowRefusedError';
import { ReviewTimeoutError } from '@src/domain.operations/review/ReviewTimeoutError';

import { asPartitionFaultSection } from './asPartitionFaultSection';

const asOverflow = (): BadRequestError => new ReviewOverflowRefusedError();

/** the route a guarded run was driven from */
const ROUTE = '.behavior/v2026_10_04.feat';

describe('asPartitionFaultSection', () => {
  given('[case1] a transient fault', () => {
    when('[t0] the section renders', () => {
      const error = new ReviewBrainCallError({
        error: new Error('terminated'),
      });
      const section = asPartitionFaultSection({
        error,
        faults: [{ error }],
        partitionsTotal: 2,
        route: ROUTE,
      });

      then('it advises a re-run — a transient fault clears on one', () => {
        expect(section).toContain('re-arrive to re-run this lane');
        expect(section).not.toContain('constraint');
      });

      then('it opens its fault line under the system-side class', () => {
        expect(section).toContain(
          '💥 MalfunctionError: the partition failed before it returned a verdict',
        );
      });

      then('it matches snapshot', () => {
        expect(section).toContain(
          '# blocker.1 — this partition did not review',
        );
        expect(section).toContain('counts as one blocker');
        expect(section).toMatchSnapshot();
      });
    });
  });

  given('[case2] one partition of two refuses on an overflow', () => {
    when('[t0] the section renders', () => {
      const error = asOverflow();
      const section = asPartitionFaultSection({
        error,
        faults: [{ error }],
        partitionsTotal: 2,
        route: ROUTE,
      });

      then('🔴 it never advises a re-run — a refusal repeats', () => {
        expect(section).not.toContain('re-arrive to re-run');
        expect(section).toContain('a re-run returns the same refusal');
      });

      then('it opens its fault line under the caller-side class', () => {
        expect(section).toContain(
          '✋ ConstraintError: the partition failed before it returned a verdict',
        );
        expect(section).not.toContain('💥 MalfunctionError:');
      });

      then('it names the fix for this partition alone', () => {
        expect(section).toContain('narrow this partition, or split it in two');
        expect(section).toContain(
          'rhx route.guard.partition --for review --peer @all',
        );
      });

      then('it matches snapshot', () => {
        expect(section).toContain(
          '# blocker.1 — this partition did not review',
        );
        expect(section).toContain('counts as one blocker');
        expect(section).toMatchSnapshot();
      });
    });
  });

  given('[case3] every partition refuses on the same overflow', () => {
    when('[t0] the section renders', () => {
      const faults = [{ error: asOverflow() }, { error: asOverflow() }];
      const section = asPartitionFaultSection({
        error: faults[0]!.error,
        faults,
        partitionsTotal: 2,
        route: ROUTE,
      });

      then(
        '🔴 it points to the lane-wide cause stated once above, and never repeats it',
        () => {
          expect(section).toContain(
            'this partition refused with the lane — the cause and its fix are stated once, above.',
          );
          expect(section).not.toContain(
            'every partition of this lane refused on this same constraint',
          );
          expect(section).not.toContain('fix:');
          expect(section).not.toContain('re-arrive to re-run');
        },
      );

      then('it matches snapshot', () => {
        expect(section).toContain(
          '# blocker.1 — this partition did not review',
        );
        expect(section).toContain('counts as one blocker');
        expect(section).toMatchSnapshot();
      });
    });
  });

  given('[case4] every partition refuses, on two different constraints', () => {
    when('[t0] the section renders', () => {
      const faults = [
        { error: asOverflow() },
        { error: new ConstraintError('absent api key') },
      ];
      const section = asPartitionFaultSection({
        error: faults[1]!.error,
        faults,
        partitionsTotal: 2,
        route: ROUTE,
      });

      then('it is not read as one lane-wide cause', () => {
        expect(section).not.toContain('every partition of this lane refused');
      });

      then('a non-overflow constraint names its refusal as the fix', () => {
        expect(section).toContain(
          'fix: clear what the refusal on stderr names, then re-arrive.',
        );
        expect(section).not.toContain('re-arrive to re-run');
      });

      then('it matches snapshot', () => {
        expect(section).toContain(
          'fix: clear what the refusal on stderr names, then re-arrive.',
        );
        expect(section).toContain('counts as one blocker');
        expect(section).toMatchSnapshot();
      });
    });
  });

  // .note = clamp: the overflow was once read off the message, so a reword at the throw site
  //         would silently drop the partition fix. the narrow is on the TYPE
  given('[case5] a plain refusal whose message reads like an overflow', () => {
    when('[t0] the section renders', () => {
      const error = new BadRequestError('prompt exceeds 75% of context window');
      const section = asPartitionFaultSection({
        error,
        faults: [{ error }],
        partitionsTotal: 2,
        route: ROUTE,
      });

      then(
        'it is not read as an overflow — the type decides, never the text',
        () => {
          expect(section).not.toContain('narrow this partition');
          expect(section).toContain(
            'fix: clear what the refusal on stderr names, then re-arrive.',
          );
        },
      );

      then('it matches snapshot', () => {
        expect(section).toContain(
          'fix: clear what the refusal on stderr names, then re-arrive.',
        );
        expect(section).not.toContain('narrow this partition');
        expect(section).toMatchSnapshot();
      });
    });
  });

  // .note = clamp: a buffer overrun of our own git read was once told "the fault is transient,
  //         so re-arrive" — a re-arrive repeats it exactly. only the brain side is transient
  given('[case6] a malfunction of the review itself (a buffer overrun)', () => {
    when('[t0] the section renders', () => {
      const error = Object.assign(new Error('spawnSync /bin/sh ENOBUFS'), {
        code: 'ENOBUFS',
      });
      const section = asPartitionFaultSection({
        error,
        faults: [{ error }],
        partitionsTotal: 3,
        route: ROUTE,
      });

      then(
        '🔴 it never calls the fault transient, nor advises a re-run',
        () => {
          expect(section).not.toContain('the fault is transient');
          expect(section).not.toContain('re-arrive to re-run');
        },
      );

      then(
        'it says a re-arrive alone will not fix it, and names the error',
        () => {
          expect(section).toContain('a re-arrive alone will not fix it');
          expect(section).toContain(
            'fix: repair what raised `spawnSync /bin/sh ENOBUFS`, then re-arrive.',
          );
        },
      );

      then('it matches snapshot', () => {
        expect(section).toContain('counts as one blocker');
        expect(section).toMatchSnapshot();
      });
    });
  });

  given('[case7] a raw dropped socket from the brain', () => {
    when('[t0] the section renders', () => {
      const error = Object.assign(new Error('socket hang up'), {
        code: 'ECONNRESET',
      });
      const section = asPartitionFaultSection({
        error,
        faults: [{ error }],
        partitionsTotal: 2,
        route: ROUTE,
      });

      then('it is read as transient, and advises a re-run', () => {
        expect(section).toContain('the fault is transient');
        expect(section).toContain('re-arrive to re-run this lane');
      });

      then('it matches snapshot', () => {
        expect(section).toContain('socket hang up');
        expect(section).toContain('counts as one blocker');
        expect(section).toMatchSnapshot();
      });
    });
  });

  given('[case8] a brain call that overran its deadline', () => {
    when('[t0] the section renders', () => {
      const error = new ReviewTimeoutError({ timeoutMs: 60_000 });
      const section = asPartitionFaultSection({
        error,
        faults: [{ error }],
        partitionsTotal: 2,
        route: ROUTE,
      });

      then('it is read as transient, and advises a re-run', () => {
        expect(section).toContain('re-arrive to re-run this lane');
      });

      then('it matches snapshot', () => {
        expect(section).toContain('the fault is transient');
        expect(section).toContain('counts as one blocker');
        expect(section).toMatchSnapshot();
      });
    });
  });

  // .note = clamp: a hand run (`rhx review --partition ...`, no route bound) was once told to
  //         re-arrive and to declare its set on a route guard — both dead ends with no route
  given('[case9] a hand run, with no route bound', () => {
    when('[t0] a transient fault renders', () => {
      const error = new ReviewBrainCallError({
        error: new Error('terminated'),
      });
      const section = asPartitionFaultSection({
        error,
        faults: [{ error }],
        partitionsTotal: 2,
        route: null,
      });

      then('🔴 it advises the review be run again, never a re-arrive', () => {
        expect(section).toContain(
          'the fault is transient, so\nrun the review again.',
        );
        expect(section).not.toContain('re-arrive');
      });

      then('it matches snapshot', () => {
        expect(section).toContain('counts as one blocker');
        expect(section).toMatchSnapshot();
      });
    });

    when('[t1] one partition refuses on an overflow', () => {
      const error = asOverflow();
      const section = asPartitionFaultSection({
        error,
        faults: [{ error }],
        partitionsTotal: 2,
        route: null,
      });

      then(
        '🔴 it names the --partition flags of this review line, never a route guard',
        () => {
          expect(section).toContain(
            'narrow the --partition declarations on this review line, then run it again.',
          );
          expect(section).not.toContain('route.guard.partition');
          expect(section).not.toContain('re-arrive');
        },
      );

      then('it matches snapshot', () => {
        expect(section).toContain('narrow this partition, or split it in two');
        expect(section).toMatchSnapshot();
      });
    });

    when('[t2] a malfunction of the review itself renders', () => {
      const error = Object.assign(new Error('spawnSync /bin/sh ENOBUFS'), {
        code: 'ENOBUFS',
      });
      const section = asPartitionFaultSection({
        error,
        faults: [{ error }],
        partitionsTotal: 3,
        route: null,
      });

      then('it names the repair, then a run of the review again', () => {
        expect(section).toContain('a re-run alone will not fix it');
        expect(section).toContain(
          'fix: repair what raised `spawnSync /bin/sh ENOBUFS`, then run the review again.',
        );
        expect(section).not.toContain('re-arrive');
      });

      then('it matches snapshot', () => {
        expect(section).toContain('counts as one blocker');
        expect(section).toMatchSnapshot();
      });
    });

    when('[t3] a plain constraint renders', () => {
      const error = new ConstraintError('absent api key');
      const section = asPartitionFaultSection({
        error,
        faults: [{ error }],
        partitionsTotal: 2,
        route: null,
      });

      then(
        'it names the refusal as the fix, then a run of the review again',
        () => {
          expect(section).toContain(
            'fix: clear what the refusal on stderr names, then run the review again.',
          );
          expect(section).not.toContain('re-arrive');
        },
      );

      then('it matches snapshot', () => {
        expect(section).toContain('counts as one blocker');
        expect(section).toMatchSnapshot();
      });
    });
  });
});
