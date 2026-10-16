import { given, then, useThen, when } from 'test-fns';

import { getOneWarmerWakeVerdict } from './getOneWarmerWakeVerdict';

const PLAN = { pokes: 3, everyMinutes: 15 };

describe('getOneWarmerWakeVerdict', () => {
  given('[case1] the cadence has elapsed since the last touch', () => {
    when('[t0] the warmer wakes with budget left', () => {
      then('it pokes', () => {
        const verdict = getOneWarmerWakeVerdict({
          sinceTouchMinutes: 15,
          attemptsSpent: 0,
          plan: PLAN,
        });
        expect(verdict.act).toEqual('poke');
      });

      then('the reason names the gap, so a log row is legible', () => {
        const verdict = getOneWarmerWakeVerdict({
          sinceTouchMinutes: 22,
          attemptsSpent: 1,
          plan: PLAN,
        });
        expect(verdict.why).toContain('22m since the last touch');
      });
    });
  });

  given('[case2] a real review ran moments ago', () => {
    when('[t0] the warmer wakes', () => {
      const woke = useThen('the verdict is computed', () => ({
        verdict: getOneWarmerWakeVerdict({
          sinceTouchMinutes: 2,
          attemptsSpent: 0,
          plan: PLAN,
        }),
      }));

      then(
        '🔴 it DEFERS rather than pokes — the review already warmed it',
        () => {
          expect(woke.verdict.act).toEqual('defer');
        },
      );

      then('it reschedules to exactly one cadence past the last touch', () => {
        expect(woke.verdict).toMatchObject({ act: 'defer', waitMinutes: 13 });
      });

      then('the reason names the redundancy it avoided', () => {
        expect(woke.verdict.why).toContain('under the 15m cadence');
      });
    });

    when('[t1] the review landed one minute before the cadence', () => {
      then('it still defers — the boundary is exclusive', () => {
        const verdict = getOneWarmerWakeVerdict({
          sinceTouchMinutes: 14.9,
          attemptsSpent: 0,
          plan: PLAN,
        });
        expect(verdict.act).toEqual('defer');
      });
    });
  });

  given('[case3] the warmer has spent its poke budget', () => {
    when('[t0] it wakes', () => {
      const woke = useThen('the verdict is computed', () => ({
        verdict: getOneWarmerWakeVerdict({
          sinceTouchMinutes: 60,
          attemptsSpent: 3,
          plan: PLAN,
        }),
      }));

      then(
        'it RETIRES — it never polls for a round that may never come',
        () => {
          expect(woke.verdict.act).toEqual('retire');
        },
      );

      then('retire beats poke even where the prefix is long overdue', () => {
        // the bound is on spend, so it outranks the cadence entirely
        const verdict = getOneWarmerWakeVerdict({
          sinceTouchMinutes: 600,
          attemptsSpent: 3,
          plan: PLAN,
        });
        expect(verdict.act).toEqual('retire');
      });

      then('the reason names the bound it hit', () => {
        expect(woke.verdict.why).toContain('spent its 3 pokes');
      });
    });
  });

  given('[case4] a driver re-drives the guard on every cadence', () => {
    when(
      '[t0] the warmer wakes repeatedly, each time just after a review',
      () => {
        then('🔴 it never pokes, and never burns an attempt', () => {
          // the redundant-warm case this whole operation exists to prevent: an
          // active driver warms their own cache, so the warmer should spend naught
          const verdicts = [1, 3, 2, 4].map((sinceTouchMinutes) =>
            getOneWarmerWakeVerdict({
              sinceTouchMinutes,
              attemptsSpent: 0,
              plan: PLAN,
            }),
          );
          expect(verdicts.every((verdict) => verdict.act === 'defer')).toEqual(
            true,
          );
        });
      },
    );
  });

  given('[case5] a touch stamped AHEAD of the warmer clock (skew)', () => {
    when('[t0] the elapsed time reads negative', () => {
      const woke = useThen('the verdict is computed', () => ({
        verdict: getOneWarmerWakeVerdict({
          sinceTouchMinutes: -3,
          attemptsSpent: 0,
          plan: PLAN,
        }),
      }));

      then('🔴 it defers, and never longer than one cadence', () => {
        // unclamped, a -3m elapsed would aim the next wake at cadence + 3m — past
        // any touch it could justify, and likelier to land past the cache ttl
        const verdict = woke.verdict;
        expect(verdict.act).toEqual('defer');
        expect(verdict.act === 'defer' && verdict.waitMinutes).toEqual(
          PLAN.everyMinutes,
        );
      });

      then('🔴 its why names the skew, never a negative age', () => {
        // the why is the detached warmer's only output; a `-3m ago` reads as a
        // meter defect where the cause is a skewed clock
        const verdict = woke.verdict;
        expect(verdict.why).toContain('ahead of this clock');
        expect(verdict.why).not.toContain('-');
      });
    });
  });
});
