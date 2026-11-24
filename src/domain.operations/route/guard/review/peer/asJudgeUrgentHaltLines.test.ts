import { getError, given, then, when } from 'test-fns';

import { getStdoutFormDefects } from '@src/domain.operations/cli/stdout/getStdoutFormDefects';

import { asJudgeUrgentHaltLines } from './asJudgeUrgentHaltLines';
import type { BudgetGrantMeter } from './meter/computeBudgetGrantRefusal';

/**
 * .what = a lane meter at a given spend, for the dry vs round-in-hand split
 */
const asMeter = (input: {
  slug: string;
  rounds: number;
  budget: number;
}): BudgetGrantMeter => ({ level: 1, ...input });

/**
 * .what = the urgent halt's render, per lane count and per lane spend
 * .why = the multi-lane branch (a `├─` row before the `└─`) is reached only when two lanes carry
 *        an urgent concession, which no route fixture drives. so it is pinned here, beside the
 *        one-lane form every acceptance clamp renders. the round-in-hand branch is the halt's
 *        main path (a concede, then a re-arrive with the lane cached), so it is pinned too
 */
describe('asJudgeUrgentHaltLines', () => {
  given('[case1] one urgent lane, run dry', () => {
    when('[t0] rendered', () => {
      const lines = asJudgeUrgentHaltLines({
        slugs: { urgent: ['friction'] },
        meters: [asMeter({ slug: 'friction', rounds: 3, budget: 3 })],
        stone: '1.vision',
      });

      then('the one command is scoped to the lane and closes the list', () => {
        expect(lines).toContain(
          '   │  └─ rhx route.guard.budget --for review --add 2 --peer friction --stone 1.vision',
        );
      });

      then('the halt names the lane', () => {
        expect(lines).toContain(
          '✋ halted, an urgent concession stands — friction',
        );
      });

      then("the budget lever is the driver's own, never a human ask", () => {
        expect(lines).toContain('   ├─ increase budget — yours to spend');
        expect(lines.join('\n')).not.toContain('ask your human');
      });

      then('the driver is asked to write its human a note', () => {
        expect(lines).toContain(
          '   ├─ 🟡 tell your human why this stone bought budget',
        );
      });

      then('the halt is a well-formed tree, every fact a leaf', () => {
        expect(getStdoutFormDefects({ text: lines.join('\n') })).toEqual([]);
      });

      then('matches snapshot', () => {
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case2] two urgent lanes, both run dry', () => {
    when('[t0] rendered', () => {
      const lines = asJudgeUrgentHaltLines({
        slugs: { urgent: ['intent', 'friction'] },
        meters: [
          asMeter({ slug: 'intent', rounds: 2, budget: 2 }),
          asMeter({ slug: 'friction', rounds: 3, budget: 3 }),
        ],
        stone: '1.vision',
      });

      then('each lane gets its own scoped command, in the order given', () => {
        expect(lines.filter((line) => line.includes('--peer '))).toEqual([
          '   │  ├─ rhx route.guard.budget --for review --add 2 --peer intent --stone 1.vision',
          '   │  └─ rhx route.guard.budget --for review --add 2 --peer friction --stone 1.vision',
        ]);
      });

      then('the halt names both lanes', () => {
        expect(lines).toContain(
          '✋ halted, an urgent concession stands — intent, friction',
        );
      });

      then('one owner label covers every lane, and no human is asked', () => {
        expect(
          lines.filter((line) => line.includes('yours to spend')),
        ).toHaveLength(1);
        expect(lines.join('\n')).not.toContain('ask your human');
      });

      then('the halt is a well-formed tree, every fact a leaf', () => {
        expect(getStdoutFormDefects({ text: lines.join('\n') })).toEqual([]);
      });

      then('matches snapshot', () => {
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case4] one urgent lane with a round in hand', () => {
    when('[t0] rendered', () => {
      const lines = asJudgeUrgentHaltLines({
        slugs: { urgent: ['friction'] },
        meters: [asMeter({ slug: 'friction', rounds: 1, budget: 3 })],
        stone: '1.vision',
      });

      then(
        'no grant is offered — the gate would refuse it rounds-remain',
        () => {
          expect(lines.join('\n')).not.toContain('route.guard.budget');
          expect(lines.join('\n')).not.toContain('yours to spend');
        },
      );

      then('the halt names the round in hand', () => {
        expect(lines).toContain(
          '   ├─ a round is in hand — friction; a grant opens once it runs dry',
        );
      });

      then('the next act is the fix, then passage — never a human ask', () => {
        expect(lines).toContain('   └─ address the concession, then run');
        expect(lines).toContain(
          '      └─ rhx route.stone.set --stone 1.vision --as passed',
        );
        expect(lines.join('\n')).not.toContain('ask your human');
      });

      then('the halt is a well-formed tree, every fact a leaf', () => {
        expect(getStdoutFormDefects({ text: lines.join('\n') })).toEqual([]);
      });

      then('matches snapshot', () => {
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given(
    '[case5] two urgent lanes, one dry and one with a round in hand',
    () => {
      when('[t0] rendered', () => {
        const lines = asJudgeUrgentHaltLines({
          slugs: { urgent: ['intent', 'friction'] },
          meters: [
            asMeter({ slug: 'intent', rounds: 3, budget: 3 }),
            asMeter({ slug: 'friction', rounds: 1, budget: 3 }),
          ],
          stone: '1.vision',
        });

        then('only the dry lane is offered a grant', () => {
          expect(lines.filter((line) => line.includes('--peer '))).toEqual([
            '   │  └─ rhx route.guard.budget --for review --add 2 --peer intent --stone 1.vision',
          ]);
        });

        then('the lane with a round in hand is named apart', () => {
          expect(lines).toContain(
            '   ├─ a round is in hand — friction; a grant opens once it runs dry',
          );
        });

        then('the halt is a well-formed tree, every fact a leaf', () => {
          expect(getStdoutFormDefects({ text: lines.join('\n') })).toEqual([]);
        });

        then('matches snapshot', () => {
          expect(lines.join('\n')).toMatchSnapshot();
        });
      });
    },
  );

  given('[case6] an urgent lane with no meter', () => {
    when('[t0] rendered', () => {
      const lines = asJudgeUrgentHaltLines({
        slugs: { urgent: ['friction'] },
        meters: [],
        stone: '1.vision',
      });

      then('no grant is offered — an unread lane is never called dry', () => {
        expect(lines.join('\n')).not.toContain('route.guard.budget');
      });

      then('nor is it called in hand — its spend is named unread', () => {
        expect(lines.join('\n')).not.toContain('a round is in hand');
        expect(lines).toContain(
          '   ├─ spend unread — friction; no grant is offered until its meter reads dry',
        );
      });

      then('the halt is a well-formed tree, every fact a leaf', () => {
        expect(getStdoutFormDefects({ text: lines.join('\n') })).toEqual([]);
      });

      then('matches snapshot', () => {
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case3] no urgent lane', () => {
    when('[t0] rendered', () => {
      then(
        'it fails fast — a halt that names no lane is a caller defect',
        async () => {
          const error = await getError(async () =>
            asJudgeUrgentHaltLines({
              slugs: { urgent: [] },
              meters: [],
              stone: '1.vision',
            }),
          );
          expect(error.message).toContain(
            'urgent halt rendered with no urgent lane',
          );
          expect(error.message).toMatchSnapshot();
        },
      );
    });
  });
});
