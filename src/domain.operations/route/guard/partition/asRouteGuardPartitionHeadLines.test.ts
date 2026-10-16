import { given, then, when } from 'test-fns';

import { asRouteGuardPartitionHeadLines } from './asRouteGuardPartitionHeadLines';

const ROUTE = '.behavior/v2026_01_01.demo';

describe('asRouteGuardPartitionHeadLines', () => {
  given('[case1] the @all scope, applied', () => {
    const lines = asRouteGuardPartitionHeadLines({
      route: ROUTE,
      scope: { kind: 'all' },
      mode: 'apply',
      peerNote: null,
    });

    when('[t0] the head is rendered', () => {
      then('it names the typed flag, the route, and every reviewer', () => {
        expect(lines).toEqual([
          '🗿 route.guard.partition --mode apply',
          `   ├─ route = ${ROUTE}`,
          '   ├─ peer = @all (every reviewer, every stone)',
        ]);
      });
    });
  });

  given('[case2] one peer scope, planned, with a note', () => {
    const lines = asRouteGuardPartitionHeadLines({
      route: ROUTE,
      scope: { kind: 'peer', peer: 'r2', stone: '3.blueprint' },
      mode: 'plan',
      peerNote: '(overrides @all)',
    });

    when('[t0] the head is rendered', () => {
      then('the title echoes the typed flag, never `(plan)`', () => {
        expect(lines[0]).toEqual('🗿 route.guard.partition --mode plan');
        expect(lines[0]).not.toContain('(plan)');
      });
      then('the peer line names the peer, its stone, and the note', () => {
        expect(lines[2]).toEqual(
          '   ├─ peer = r2 on 3.blueprint (overrides @all)',
        );
      });
      then('the lines match the snapshot', () => {
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case3] no single scope — a stone coverage read', () => {
    const lines = asRouteGuardPartitionHeadLines({
      route: ROUTE,
      scope: null,
      mode: null,
      peerNote: null,
    });

    when('[t0] the head is rendered', () => {
      then('a read takes no mode, so the title names none', () => {
        expect(lines).toEqual([
          '🗿 route.guard.partition',
          `   ├─ route = ${ROUTE}`,
        ]);
      });
    });
  });
});
