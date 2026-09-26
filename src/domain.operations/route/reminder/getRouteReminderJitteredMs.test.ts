import { given, then, when } from 'test-fns';

import { getRouteReminderJitteredMs } from './getRouteReminderJitteredMs';

describe('getRouteReminderJitteredMs', () => {
  given('an interval of 1000ms and a ±10% ratio', () => {
    when('[t0] random() is 0.5 (the midpoint)', () => {
      then('the interval is unchanged — offset 0', () => {
        const out = getRouteReminderJitteredMs({
          intervalMs: 1000,
          ratio: 0.1,
          random: () => 0.5,
        });
        expect(out).toBe(1000);
      });
    });

    when('[t0] random() is 0 (the low bound)', () => {
      then('the interval drops by the full ratio → 900', () => {
        const out = getRouteReminderJitteredMs({
          intervalMs: 1000,
          ratio: 0.1,
          random: () => 0,
        });
        expect(out).toBe(900);
      });
    });

    when('[t0] random() is ~1 (the high bound)', () => {
      then('the interval rises by the full ratio → 1100', () => {
        const out = getRouteReminderJitteredMs({
          intervalMs: 1000,
          ratio: 0.1,
          random: () => 1,
        });
        expect(out).toBe(1100);
      });
    });

    when('[t0] random spans its range', () => {
      then('every jittered value stays within ±ratio of the interval', () => {
        const samples = [0, 0.13, 0.37, 0.5, 0.68, 0.91, 0.999];
        const out = samples.map((r) =>
          getRouteReminderJitteredMs({
            intervalMs: 1000,
            ratio: 0.1,
            random: () => r,
          }),
        );
        for (const ms of out) {
          expect(ms).toBeGreaterThanOrEqual(900);
          expect(ms).toBeLessThanOrEqual(1100);
        }
      });
    });
  });
});
