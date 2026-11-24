import { given, then, when } from 'test-fns';

import { getStdoutFormDefects } from '@src/domain.operations/cli/stdout/getStdoutFormDefects';

import { asJudgeApprovalHaltLines } from './asJudgeApprovalHaltLines';

/**
 * .what = the `approved?` judge's halt render
 * .why = approval is a human's alone, so this halt is the one judge halt that must name a human.
 *        its peer, the urgent halt, names the driver; this test pins that the two stay apart
 */
describe('asJudgeApprovalHaltLines', () => {
  given('[case1] a stone that awaits approval', () => {
    when('[t0] rendered', () => {
      const lines = asJudgeApprovalHaltLines({ stone: '1.vision' });

      then('the owner is a human, who runs the approval', () => {
        expect(lines).toContain('   ├─ please ask your human to');
        expect(lines).toContain(
          '   │  └─ rhx route.stone.set --stone 1.vision --as approved',
        );
      });

      then('the follow-on passage is the driver command', () => {
        expect(lines).toContain(
          '      └─ rhx route.stone.set --stone 1.vision --as passed',
        );
      });

      then('it offers no budget lever', () => {
        expect(lines.join('\n')).not.toContain('route.guard.budget');
      });

      then('the halt is a well-formed tree, every fact a leaf', () => {
        expect(getStdoutFormDefects({ text: lines.join('\n') })).toEqual([]);
      });

      then('matches snapshot', () => {
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });
});
