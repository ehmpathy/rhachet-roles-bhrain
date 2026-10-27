import { getError, given, then, when } from 'test-fns';

import { asJudgeUrgentHaltLines } from './asJudgeUrgentHaltLines';

/**
 * .what = the urgent halt's render, per lane count
 * .why = the multi-lane branch (a `├─` row before the `└─`) is reached only when two lanes carry
 *        an urgent concession, which no route fixture drives. so it is pinned here, beside the
 *        one-lane form every acceptance clamp renders
 */
describe('asJudgeUrgentHaltLines', () => {
  given('[case1] one urgent lane', () => {
    when('[t0] rendered', () => {
      const lines = asJudgeUrgentHaltLines({
        slugs: { urgent: ['friction'] },
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

      then('matches snapshot', () => {
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case2] two urgent lanes', () => {
    when('[t0] rendered', () => {
      const lines = asJudgeUrgentHaltLines({
        slugs: { urgent: ['intent', 'friction'] },
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
