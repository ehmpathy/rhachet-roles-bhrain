import { given, then, when } from 'test-fns';

import { getSelfReviewArticulationPath } from '../review/self/getSelfReviewArticulationPath';
import { formatLetsReflect } from './formatLetsReflect';
import { formatPatienceFriend } from './formatPatienceFriend';
import { formatPromiseCommand } from './formatPromiseCommand';

const SCENE = {
  stone: '1.vision',
  slug: 'all-done',
  route: '.behavior/v2026_03_05.behavior-example',
};

describe('formatPromiseCommand', () => {
  given('[case1] a stone, a slug, and a route', () => {
    when('[t0] formatPromiseCommand called', () => {
      then('output matches snapshot (vibecheck)', () => {
        expect(formatPromiseCommand(SCENE).join('\n')).toMatchSnapshot();
      });

      then('it names the owed path, computed by the one operation', () => {
        expect(formatPromiseCommand(SCENE).join('\n')).toContain(
          `--into ${getSelfReviewArticulationPath(SCENE)}`,
        );
      });

      then('it carries the promise command with both operands', () => {
        const output = formatPromiseCommand(SCENE).join('\n');
        expect(output).toContain('--stone 1.vision');
        expect(output).toContain('--as promised');
        expect(output).toContain('--that all-done');
      });
    });
  });

  /**
   * 🔴 .what = the clamp for the defect this operation exists to retire
   * .why = the block was byte-identical in both callers and no lane saw it for 17 rounds,
   *        because each file was read alone. this case reads them TOGETHER, which is the
   *        one act that makes a drift visible (`rule.forbid.duplicate-format-tree-operations`)
   */
  given('[case2] both prompts that close with the command', () => {
    when('[t0] each is rendered', () => {
      then('each ends with the identical command block', () => {
        const owed = formatPromiseCommand(SCENE).join('\n');

        // formatPatienceFriend must not drift from formatPromiseCommand
        expect(formatPatienceFriend(SCENE).endsWith(owed)).toEqual(true);

        // formatLetsReflect must not drift from formatPromiseCommand
        const reflected = formatLetsReflect({
          ...SCENE,
          reviewSelf: { slug: SCENE.slug, say: 'a guide' },
          index: 1,
          total: 1,
        });
        expect(reflected.endsWith(owed)).toEqual(true);
      });
    });
  });
});
