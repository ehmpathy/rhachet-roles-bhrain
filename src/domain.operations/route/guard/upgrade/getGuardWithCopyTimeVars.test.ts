import { given, then, when } from 'test-fns';

import { getGuardWithCopyTimeVars } from './getGuardWithCopyTimeVars';

describe('getGuardWithCopyTimeVars', () => {
  given('[case1] content with a $BEHAVIOR_DIR_REL placeholder', () => {
    const content = `artifacts:
  - $BEHAVIOR_DIR_REL/5.1.execution*.md
judges:
  - $rhachet judge --route $BEHAVIOR_DIR_REL
`;
    when('[t0] copy-time vars are replayed', () => {
      then('replaces every $BEHAVIOR_DIR_REL with the route rel dir', () => {
        const out = getGuardWithCopyTimeVars({
          content,
          routeRelDir: '.behavior/v2026_07_08.myroute',
        });
        expect(out).toContain(
          '.behavior/v2026_07_08.myroute/5.1.execution*.md',
        );
        expect(out).toContain('--route .behavior/v2026_07_08.myroute');
        expect(out).not.toContain('$BEHAVIOR_DIR_REL');
      });

      then('leaves runtime vars ($route, $rhachet) literal', () => {
        const out = getGuardWithCopyTimeVars({
          content,
          routeRelDir: '.behavior/v2026_07_08.myroute',
        });
        expect(out).toContain('$rhachet judge');
      });
    });
  });

  given('[case2] content with NO placeholder', () => {
    const content = `artifacts:
  - $route/5.1.execution*.md
`;
    when('[t0] copy-time vars are replayed', () => {
      then('returns the content unchanged', () => {
        expect(
          getGuardWithCopyTimeVars({ content, routeRelDir: '.behavior/x' }),
        ).toEqual(content);
      });
    });
  });
});
