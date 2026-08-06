import { given, then, when } from 'test-fns';

import { formatRouteStoneEmit } from './formatRouteStoneEmit';
import { JUDGE_LEVEL } from './guard/review/peer/meter/JUDGE_LEVEL';
import { getSelfReviewArticulationPath } from './guard/review/self/getSelfReviewArticulationPath';

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

      then('snapshot matches', () => {
        expect(output).toMatchSnapshot();
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

      then('snapshot matches', () => {
        expect(output).toMatchSnapshot();
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
              exitClass: 'passed',
              tallier: 'deterministic',
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

      then('snapshot matches', () => {
        expect(output).toMatchSnapshot();
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
              exitClass: 'passed',
              tallier: 'deterministic',
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

      then('snapshot matches', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given(
    '[case5b] guarded stone, a review tallied by the sub-brain fallback',
    () => {
      when('[t0] format is called with a probabilistic review', () => {
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
                nitpicks: 1,
                path: 'review.md',
                exitClass: 'passed',
                tallier: 'probabilistic',
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

        then('output shows the tallied-by branch on the pass path', () => {
          expect(output).toContain('tallied by reviewer@');
        });

        then('snapshot matches', () => {
          expect(output).toMatchSnapshot();
        });
      });
    },
  );

  given('[case6] blocked action (agent tried to approve)', () => {
    when('[t0] format is called with blocked action', () => {
      const output = formatRouteStoneEmit({
        operation: 'route.stone.set',
        stone: '1.vision',
        action: 'blocked',
        reason: 'only humans can approve',
        guidance: [
          'as a driver, you should:',
          '   ├─ `--as passed` to signal work complete, proceed',
          '   ├─ `--as arrived` to signal work complete, request review',
          '   └─ `--as blocked` to escalate if stuck',
          '',
          'the human will run `--as approved` when ready.',
        ].join('\n'),
      });

      then('output contains owl header', () => {
        expect(output).toContain('🦉 the way speaks for itself');
      });

      then('output contains driver guidance', () => {
        expect(output).toContain('as a driver, you should:');
      });

      then('output contains all three alternatives', () => {
        expect(output).toContain('--as passed');
        expect(output).toContain('--as arrived');
        expect(output).toContain('--as blocked');
      });

      then('output contains human note', () => {
        expect(output).toContain(
          'the human will run `--as approved` when ready.',
        );
      });

      then('snapshot matches', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case7] route.stone.add plan mode', () => {
    when('[t0] format is called with plan mode', () => {
      const output = formatRouteStoneEmit({
        operation: 'route.stone.add',
        mode: 'plan',
        stone: '3.1.6.research.custom',
        route: '.behavior/v2026_04_12.myroute',
        source: '@stdin',
        content:
          'investigate X:\n- what is X?\n- how does X relate to our wish?',
        path: '.behavior/v2026_04_12.myroute/3.1.6.research.custom.stone',
      });

      then('output contains owl header', () => {
        expect(output).toContain('🦉 another stone on the path');
      });

      then('output contains stone name', () => {
        expect(output).toContain('stone  = 3.1.6.research.custom');
      });

      then('output contains route', () => {
        expect(output).toContain('route  = .behavior/v2026_04_12.myroute');
      });

      then('output contains source', () => {
        expect(output).toContain('source = @stdin');
      });

      then('output contains preview with content', () => {
        expect(output).toContain('preview');
        expect(output).toContain('investigate X:');
      });

      then('output indicates no creation in plan mode', () => {
        expect(output).toContain('✋ created = false');
      });

      then('output contains rerun hint', () => {
        expect(output).toContain('rerun with --mode apply to execute');
      });

      then('snapshot matches', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case8] route.stone.add apply mode', () => {
    when('[t0] format is called with apply mode', () => {
      const output = formatRouteStoneEmit({
        operation: 'route.stone.add',
        mode: 'apply',
        stone: '3.1.6.research.custom',
        route: '.behavior/v2026_04_12.myroute',
        source: '@stdin',
        content:
          'investigate X:\n- what is X?\n- how does X relate to our wish?',
        path: '.behavior/v2026_04_12.myroute/3.1.6.research.custom.stone',
      });

      then('output contains owl header', () => {
        expect(output).toContain('🦉 another stone on the path');
      });

      then('output contains created path', () => {
        expect(output).toContain(
          'created = .behavior/v2026_04_12.myroute/3.1.6.research.custom.stone',
        );
      });

      then('output contains reminder to drive', () => {
        expect(output).toContain('the way continues, run');
        expect(output).toContain('rhx route.drive');
      });

      then('output does not contain preview', () => {
        expect(output).not.toContain('preview');
        expect(output).not.toContain('source =');
      });

      then('snapshot matches', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case-overrule-scoped] a level-scoped overrule', () => {
    when('[t0] format is called with a level and a ready-next level', () => {
      const output = formatRouteStoneEmit({
        operation: 'route.stone.set',
        stone: '1.plan',
        action: 'overruled',
        level: 1,
        readyLevel: 3,
      });

      then('it names the waved level and the newly-ready level', () => {
        expect(output).toContain('level 1, overruled');
        expect(output).toContain('level 3, ready');
      });

      then(
        'it carries NO stone-wide full-forgive alert (this is the safe, scoped case)',
        () => {
          expect(output).not.toContain('stone-wide');
        },
      );

      then('snapshot matches', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case-overrule-judge] an overrule of the judge rung', () => {
    when('[t0] format is called with level = JUDGE_LEVEL', () => {
      const output = formatRouteStoneEmit({
        operation: 'route.stone.set',
        stone: '1.plan',
        action: 'overruled',
        level: JUDGE_LEVEL,
      });

      then('it renders the judge rung, not the sentinel number', () => {
        // .why = the judge is the top rung; the human sees "judge, overruled", never the raw
        //        JUDGE_LEVEL sentinel value (define.review.human-forgiveness)
        expect(output).toContain('judge, overruled');
        expect(output).not.toContain(String(JUDGE_LEVEL));
      });

      then('it carries NO stone-wide full-forgive alert', () => {
        expect(output).not.toContain('stone-wide');
      });

      then('snapshot matches', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given(
    '[case-overrule-peer-judge-ready] an overrule of a peer level where the JUDGE becomes ready',
    () => {
      when('[t0] format is called with readyLevel = JUDGE_LEVEL', () => {
        const output = formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: '1.plan',
          action: 'overruled',
          level: 3,
          readyLevel: JUDGE_LEVEL,
        });

        then(
          'the ready line reads "judge, ready", never the sentinel number',
          () => {
            // .why = an overrule of the topmost peer level makes the JUDGE the next live gate; the
            //        readyLevel render must honor the same JUDGE_LEVEL guard as the rung line,
            //        or a human sees "level 9007199254740991, ready" (the paired sentinel-leak bug)
            expect(output).toContain('level 3, overruled');
            expect(output).toContain('judge, ready');
            expect(output).not.toContain(String(JUDGE_LEVEL));
          },
        );

        then('snapshot matches', () => {
          expect(output).toMatchSnapshot();
        });
      });
    },
  );
});
