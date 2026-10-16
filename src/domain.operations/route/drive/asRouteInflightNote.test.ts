import { given, then, when } from 'test-fns';

import { asRouteInflightNote } from './asRouteInflightNote';
import { RouteInflight } from './RouteInflight';

// a local clock instant, so the HH:MM label is the same in every timezone
const SINCE = new Date(2026, 9, 7, 9, 5).getTime();

const inflight = new RouteInflight({
  stone: '5.1.execution',
  since: SINCE,
  what: 'three delegates repair blockers 1-4',
});

describe('asRouteInflightNote', () => {
  given('[case1] a fresh watermark', () => {
    when('[t0] the note is rendered', () => {
      then('it is one quiet line that names stone, clock, and work', () => {
        const note = asRouteInflightNote({ of: 'fresh', inflight, ageMs: 0 });
        expect(note).toEqual(
          '⏳ repairs in flight for 5.1.execution since 09:05 — three delegates repair blockers 1-4',
        );
      });
    });
  });

  given('[case2] a stale watermark', () => {
    when('[t0] the note is rendered', () => {
      then('it names the watermark, its age, and the bound', () => {
        const note = asRouteInflightNote({
          of: 'stale',
          inflight,
          ageMs: 95 * 60_000,
        });
        expect(note).toContain(
          '⏳ repairs in flight for 5.1.execution since 09:05',
        );
        expect(note).toContain('stale: 95m old, past the 30m bound');
        expect(note).toMatchSnapshot();
      });
    });
  });
});
