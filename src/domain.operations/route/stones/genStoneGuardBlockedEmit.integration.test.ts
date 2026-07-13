import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getStoneGuardBlockerReport } from '../drive/getStoneGuardBlockerReport';
import { genStoneGuardBlockedEmit } from './genStoneGuardBlockedEmit';

describe('genStoneGuardBlockedEmit', () => {
  given('[case1] a blocked branch persists a blocker report', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'route-blocked-'));
      const result = await genStoneGuardBlockedEmit({
        stone: '1.vision',
        route,
        blocker: 'review.peer.uncontemplated',
        reason: 'peer review awaits contemplation: arch',
        refs: { reviews: ['a.md'], judges: ['b.md'] },
        emit: { stdout: 'the reply prompt', stderr: 'some detail' },
      });
      return { route, result };
    });

    when('[t0] the shared tail runs', () => {
      then('returns the standard blocked shape verbatim', () => {
        expect(scene.result.passed).toBe(false);
        expect(scene.result.refs).toEqual({
          reviews: ['a.md'],
          judges: ['b.md'],
        });
        expect(scene.result.emit).toEqual({
          stdout: 'the reply prompt',
          stderr: 'some detail',
        });
      });

      then('persists the blocker report for the stophook to read', async () => {
        const report = await getStoneGuardBlockerReport({
          stone: '1.vision',
          route: scene.route,
        });
        expect(report).not.toBeNull();
        expect(report!.blocker).toBe('review.peer.uncontemplated');
        expect(report!.reason).toBe('peer review awaits contemplation: arch');
      });
    });
  });

  given('[case2] a raw (unstamped) emit is passed through unchanged', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'route-blocked-'));
      const result = await genStoneGuardBlockedEmit({
        stone: '1.vision',
        route,
        blocker: 'review.self',
        reason: 'review.self required: arch',
        refs: { reviews: [], judges: [] },
        emit: { stdout: 'review.self required' },
      });
      return { route, result };
    });

    when('[t0] no stderr is supplied', () => {
      then('the emit carries only stdout', () => {
        expect(scene.result.emit).toEqual({ stdout: 'review.self required' });
      });

      then('persists the review.self blocker', async () => {
        const report = await getStoneGuardBlockerReport({
          stone: '1.vision',
          route: scene.route,
        });
        expect(report!.blocker).toBe('review.self');
      });
    });
  });
});
