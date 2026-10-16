import { ConstraintError } from 'helpful-errors';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { ROUTE_INFLIGHT_FRESH_BOUND_LABEL } from '../drive/asRouteInflightFreshness';
import { asRouteInflightNote } from '../drive/asRouteInflightNote';
import { RouteInflight } from '../drive/RouteInflight';
import { setRouteInflight } from '../drive/setRouteInflight';
import { formatRouteStoneEmit } from '../formatRouteStoneEmit';
import { asRouteStoneSetCommandHead } from '../guard/review/peer/asRouteStoneSetCommandHead';
import { getLatestPassageForStone } from '../passage/getLatestPassageForStone';
import { setPassageReport } from '../passage/setPassageReport';
import { findOneStoneByPattern } from './asStoneGlob';
import { asStoneNotFoundError } from './asStoneNotFoundError';
import { getAllStones } from './getAllStones';

/**
 * .what = marks a stone's repairs as in flight, via the `$route/.route/inflight.json` watermark
 * .why = a driver who delegates a round's repairs waits on them; arrived, passed, and blocked
 *        are each wrong for that wait. the watermark lets the stop hook read it as honest work
 *
 * .note = `via: 'driver'` (`--as inflight`) is forward motion, so it also appends an
 *         `inflight` passage entry: latest-entry-wins, so a stale halt clears and the
 *         disposition reads push (rule.require.forward-motion-clears-blocker). `via: 'arrival'`
 *         writes the watermark alone — the arrival appends its own `arrived` entry.
 * .note = `--as arrived`, `--as passed`, and `--as blocked` clear the watermark, so it cannot
 *         outlive the round it described
 */
export const setStoneAsInflight = async (input: {
  stone: string;
  route: string;
  what: string | undefined;
  now: number;
  via: 'driver' | 'arrival';
}): Promise<{ inflight: true; emit: { stdout: string } }> => {
  // --what is required: the note must say what the driver waits on
  if (!input.what?.trim())
    throw new ConstraintError(
      [
        `--what is required for --as inflight`,
        ``,
        `name the work you wait on, e.g.:`,
        `  --as inflight --what 'three delegates repair blockers 1-4'`,
      ].join('\n'),
    );

  // look up the stone, so the watermark carries its canonical name
  const stones = await getAllStones({ route: input.route });
  const stoneMatched = findOneStoneByPattern({
    stones,
    pattern: input.stone,
  });
  if (!stoneMatched)
    throw asStoneNotFoundError({
      act: 'inflight',
      route: input.route,
      pattern: input.stone,
      stones,
    });

  // a driver's mark is forward motion, recorded as a passage entry so a stale halt clears
  if (input.via === 'driver') {
    // refuse a passed stone: passage is latest-entry-wins, so an `inflight` entry would
    // un-pass it — and a passed stone has no repairs left to wait on
    const latest = await getLatestPassageForStone({
      stone: stoneMatched.name,
      route: input.route,
    });
    if (latest?.status === 'passed')
      throw new ConstraintError(
        [
          `--as inflight is refused: ${stoneMatched.name} has already passed`,
          ``,
          `a passed stone has no repairs to wait on. to reopen it, rewind it first:`,
          `  ${asRouteStoneSetCommandHead({ stone: stoneMatched.name })} --as rewound`,
        ].join('\n'),
      );

    await setPassageReport({
      report: new PassageReport({
        stone: stoneMatched.name,
        status: 'inflight',
        reason: `inflight: ${input.what.trim()}`,
      }),
      route: input.route,
    });
  }

  // write the watermark
  const { inflight } = await setRouteInflight({
    route: input.route,
    inflight: new RouteInflight({
      stone: stoneMatched.name,
      since: input.now,
      what: input.what.trim(),
    }),
  });

  return {
    inflight: true,
    emit: {
      stdout: formatRouteStoneEmit({
        operation: 'route.stone.set',
        stone: stoneMatched.name,
        action: 'inflight',
        note: asRouteInflightNote({ of: 'fresh', inflight, ageMs: 0 }),
        details: [
          `the stop hook stays quiet for this stone for ${ROUTE_INFLIGHT_FRESH_BOUND_LABEL}`,
          `--as arrived, --as passed, or --as blocked clears it`,
        ],
      }),
    },
  };
};
