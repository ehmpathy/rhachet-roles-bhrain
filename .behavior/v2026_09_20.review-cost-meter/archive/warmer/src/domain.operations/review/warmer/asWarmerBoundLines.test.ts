import { given, then, when } from 'test-fns';

import { asWarmerBoundLines } from './asWarmerBoundLines';
import type { ReviewWarmerSpawn } from './genReviewWarmer';

/**
 * .what = clamps each render state of a warmer's bound
 * .why = 🔴 the mismatched-plan lines are the one place a driver learns the
 *        `--warmer` plan they just typed was NOT applied, so each state gets a case
 */
describe('asWarmerBoundLines', () => {
  const asked = { pokes: 12, everyMinutes: 15 };
  const prefix = { head: 'head-of-test', brain: 'test/brain' };
  const asFound = (
    input: Partial<Extract<ReviewWarmerSpawn, { act: 'found' }>>,
  ): ReviewWarmerSpawn => ({
    act: 'found',
    prefix,
    pid: 4242,
    why: 'a warmer already runs for this lane',
    live: asked,
    asked,
    ...input,
  });

  given('[case1] a fresh spawn', () => {
    when('[t0] the lines are rendered', () => {
      then('it renders no bound, since the asked plan runs', () => {
        expect(
          asWarmerBoundLines({
            spawn: { act: 'spawned', prefix, pid: 4242, why: 'spawned' },
          }),
        ).toEqual([]);
      });
    });
  });

  given('[case4] a found warmer whose plan matches the ask', () => {
    when('[t0] the lines are rendered', () => {
      then('it states the bound once', () => {
        expect(asWarmerBoundLines({ spawn: asFound({}) })).toEqual([
          `   ├─ bound: 12 pokes, 15m apart per review gap`,
        ]);
      });
    });
  });

  given('[case5] a found warmer whose plan differs from the ask', () => {
    when('[t0] its pid is known', () => {
      const lines = asWarmerBoundLines({
        spawn: asFound({ live: { pokes: 3, everyMinutes: 20 } }),
      });
      then('🔴 it says the asked plan was NOT applied', () => {
        expect(lines[0]).toContain('bound: 3 pokes, 20m apart');
        expect(lines[1]).toContain('asked: 12 pokes, 15m apart');
        expect(lines[1]).toContain('NOT applied');
      });
      then('it names the kill that re-plans it', () => {
        expect(lines[2]).toContain('to re-plan: kill 4242, then re-run');
      });
      then('the lines match the snapshot', () => {
        expect(lines).toHaveLength(3);
        expect(lines[1]).toEqual(
          '   ├─ asked: 12 pokes, 15m apart  🟡 NOT applied — a live warmer keeps its own plan',
        );
        expect(lines).toMatchSnapshot();
      });
    });

    when('[t1] its pid is unknown', () => {
      const lines = asWarmerBoundLines({
        spawn: asFound({ live: { pokes: 3, everyMinutes: 20 }, pid: null }),
      });
      then('🔴 it offers no kill, and says why', () => {
        expect(lines.join('\n')).not.toContain('kill');
        expect(lines[2]).toContain('it has not yet recorded its pid');
      });
      then('the lines match the snapshot', () => {
        expect(lines).toHaveLength(3);
        expect(lines[2]).toEqual(
          '   ├─ to re-plan: stop the live warmer, then re-run — it has not yet recorded its pid',
        );
        expect(lines).toMatchSnapshot();
      });
    });
  });
});
