import { existsSync } from 'fs';
import { join } from 'path';
import { given, then, when } from 'test-fns';

import { ROLE_SKEPTIC } from './getSkepticRole';

/**
 * .what = unit cases that prove the skeptic role ships as persona and briefs, with no hooks and no skills
 * .why = every hook this role once held graded a reply's words and flagged honest replies as often as stale ones (F042).
 *        a hook re-added by habit would cry wolf again; this case makes that a deliberate change, never a drift
 */
describe('getSkepticRole', () => {
  given('[case1] the built skeptic role', () => {
    when('[t0] its hooks are inspected', () => {
      then('it declares none: the doubt lives in the briefs', () => {
        const hooks = ROLE_SKEPTIC.hooks?.onBrain;
        expect(hooks?.onStop ?? []).toHaveLength(0);
        expect(hooks?.onTool ?? []).toHaveLength(0);
        expect(hooks?.onTalk ?? []).toHaveLength(0);
        expect(hooks?.onBoot ?? []).toHaveLength(0);
      });
    });

    when('[t1] its skills are inspected', () => {
      then('it ships no skill dir', () => {
        expect(ROLE_SKEPTIC.skills?.dirs ?? []).toHaveLength(0);
        expect(existsSync(join(__dirname, 'skills'))).toEqual(false);
      });
    });

    when('[t2] its briefs are inspected', () => {
      then('it ships its briefs dir', () => {
        expect(existsSync(join(__dirname, 'briefs'))).toEqual(true);
      });
    });
  });
});
