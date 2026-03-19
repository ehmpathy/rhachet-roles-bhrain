import { given, then, when } from 'test-fns';

import { formatRouteStoneEmit } from './formatRouteStoneEmit';
import { getSelfReviewArticulationPath } from './guard/getSelfReviewArticulationPath';

describe('formatRouteStoneEmit', () => {
  given('[case1] challenge:absent action', () => {
    const route = '.behavior/v2026_03_08.feature';
    const stone = '3.1.blueprint';
    const slug = 'design';
    const articulationPath = getSelfReviewArticulationPath({
      route,
      stone,
      index: 1,
      slug,
    });

    when('[t0] formatRouteStoneEmit called with challenge:absent', () => {
      then('output contains what have you seen header', () => {
        const output = formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone,
          action: 'challenge:absent',
          slug,
          route,
          articulationPath,
        });
        expect(output).toContain('🍂 what have you seen?');
      });

      then('output contains articulation path', () => {
        const output = formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone,
          action: 'challenge:absent',
          slug,
          route,
          articulationPath,
        });
        expect(output).toContain(articulationPath);
      });

      then('output contains patience friend message', () => {
        const output = formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone,
          action: 'challenge:absent',
          slug,
          route,
          articulationPath,
        });
        expect(output).toContain('🗿 patience, friend');
      });

      then('snapshot matches vision', () => {
        const output = formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone,
          action: 'challenge:absent',
          slug,
          route,
          articulationPath,
        });
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case2] unguarded stone, passage allowed', () => {
    when('[t0] format is called', () => {
      const output = formatRouteStoneEmit({
        operation: 'route.stone.set',
        stone: '1.vision',
        action: 'passed',
        passage: 'allowed',
        note: 'unguarded',
      });

      then('output contains reminder text', () => {
        expect(output).toContain('the way continues, run');
      });

      then('output contains route.drive command', () => {
        expect(output).toContain('rhx route.drive');
      });
    });
  });

  given('[case3] unguarded stone, passage blocked', () => {
    when('[t0] format is called', () => {
      const output = formatRouteStoneEmit({
        operation: 'route.stone.set',
        stone: '1.vision',
        action: 'passed',
        passage: 'blocked',
        reason: 'blockers exceed threshold',
      });

      then('output does NOT contain reminder', () => {
        expect(output).not.toContain('the way continues');
        expect(output).not.toContain('rhx route.drive');
      });
    });
  });

  given('[case4] guarded stone, passage allowed', () => {
    when('[t0] format is called', () => {
      const output = formatRouteStoneEmit({
        operation: 'route.stone.set',
        stone: '3.blueprint',
        action: 'passed',
        passage: 'allowed',
        guard: {
          artifactFiles: ['3.blueprint.md'],
          reviews: [
            {
              index: 1,
              cmd: 'review cmd',
              cached: false,
              durationSec: 1.5,
              blockers: 0,
              nitpicks: 0,
              path: 'review.md',
            },
          ],
          judges: [
            {
              index: 1,
              cmd: 'judge cmd',
              cached: false,
              durationSec: 0.5,
              passed: true,
              reason: null,
              path: 'judge.md',
            },
          ],
        },
      });

      then('output contains reminder text', () => {
        expect(output).toContain('the way continues, run');
      });

      then('output contains route.drive command', () => {
        expect(output).toContain('rhx route.drive');
      });
    });
  });

  given('[case5] guarded stone, passage blocked', () => {
    when('[t0] format is called', () => {
      const output = formatRouteStoneEmit({
        operation: 'route.stone.set',
        stone: '3.blueprint',
        action: 'passed',
        passage: 'blocked',
        reason: 'blockers exceed threshold',
        guard: {
          artifactFiles: ['3.blueprint.md'],
          reviews: [
            {
              index: 1,
              cmd: 'review cmd',
              cached: false,
              durationSec: 1.5,
              blockers: 3,
              nitpicks: 1,
              path: 'review.md',
            },
          ],
          judges: [
            {
              index: 1,
              cmd: 'judge cmd',
              cached: false,
              durationSec: 0.5,
              passed: false,
              reason: 'blockers exceed threshold',
              path: 'judge.md',
            },
          ],
        },
      });

      then('output does NOT contain reminder', () => {
        expect(output).not.toContain('the way continues');
        expect(output).not.toContain('rhx route.drive');
      });
    });
  });
});
