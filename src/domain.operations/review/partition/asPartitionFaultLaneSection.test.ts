import { ConstraintError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { ReviewBrainCallError } from '@src/domain.operations/review/ReviewBrainCallError';
import { ReviewOverflowRefusedError } from '@src/domain.operations/review/ReviewOverflowRefusedError';

import { asPartitionFaultLaneSection } from './asPartitionFaultLaneSection';

/** the route a guarded run was driven from */
const ROUTE = '.behavior/v2026_10_04.feat';

describe('asPartitionFaultLaneSection', () => {
  given('[case1] every partition refuses on the same overflow', () => {
    const faults = [
      { error: new ReviewOverflowRefusedError() },
      { error: new ReviewOverflowRefusedError() },
    ];

    when('[t0] the run was driven from a route', () => {
      const section = asPartitionFaultLaneSection({
        faults,
        partitionsTotal: 2,
        route: ROUTE,
      });

      then('it states the lane-wide cause and the route fix', () => {
        expect(section).toContain(
          'every partition of this lane refused on this same constraint',
        );
        expect(section).toContain(
          'narrow each partition, or split each in two',
        );
        expect(section).toContain(
          'rhx route.guard.partition --for review --peer @all',
        );
      });

      then('it raises no concern of its own', () => {
        expect(section).not.toContain('# blocker');
      });

      then('it matches snapshot', () => {
        expect(section).toContain('## lane: every partition refused');
        expect(section).toMatchSnapshot();
      });
    });

    when('[t1] the run was a hand run, with no route bound', () => {
      const section = asPartitionFaultLaneSection({
        faults,
        partitionsTotal: 2,
        route: null,
      });

      then('🔴 it names the --partition flags of this review line', () => {
        expect(section).toContain(
          'narrow the --partition declarations on this review line, then run it again.',
        );
        expect(section).not.toContain('route.guard.partition');
        expect(section).not.toContain('re-arrive');
      });

      then('it matches snapshot', () => {
        expect(section).toContain('## lane: every partition refused');
        expect(section).toMatchSnapshot();
      });
    });
  });

  given('[case2] faults that are not one lane-wide cause', () => {
    when('[t0] one partition of two faults', () => {
      then('there is no lane section', () => {
        expect(
          asPartitionFaultLaneSection({
            faults: [{ error: new ReviewOverflowRefusedError() }],
            partitionsTotal: 2,
            route: ROUTE,
          }),
        ).toEqual(null);
      });
    });

    when('[t1] every partition faults, on two different constraints', () => {
      then('there is no lane section', () => {
        expect(
          asPartitionFaultLaneSection({
            faults: [
              { error: new ReviewOverflowRefusedError() },
              { error: new ConstraintError('absent api key') },
            ],
            partitionsTotal: 2,
            route: ROUTE,
          }),
        ).toEqual(null);
      });
    });

    when('[t2] every partition faults transiently', () => {
      then(
        'there is no lane section — a transient fault is no constraint',
        () => {
          const error = new ReviewBrainCallError({
            error: new Error('terminated'),
          });
          expect(
            asPartitionFaultLaneSection({
              faults: [{ error }, { error }],
              partitionsTotal: 2,
              route: ROUTE,
            }),
          ).toEqual(null);
        },
      );
    });

    when('[t3] no partition faults', () => {
      then('there is no lane section', () => {
        expect(
          asPartitionFaultLaneSection({
            faults: [],
            partitionsTotal: 2,
            route: ROUTE,
          }),
        ).toEqual(null);
      });
    });
  });
});
