import * as path from 'path';
import { given, then, when } from 'test-fns';

import { asTempPathBeside } from './asTempPathBeside';

/**
 * .what = unit cases for asTempPathBeside
 * .why = an atomic write publishes a temp file by rename or link, so two writers at once must
 *        never share a temp path: the pid and the random part are the guarantee
 */
describe('asTempPathBeside', () => {
  given('[case1] a target path', () => {
    const target = '/repo/.agent/.cache/x.pid';

    when('[t0] a temp path is built beside it', () => {
      then('it sits in the same dir and names this process pid', () => {
        const temp = asTempPathBeside({ path: target });
        expect(path.dirname(temp)).toEqual(path.dirname(target));
        expect(temp.startsWith(`${target}.${process.pid}.`)).toEqual(true);
        expect(temp.endsWith('.tmp')).toEqual(true);
      });
    });

    when('[t1] two temp paths are built for one target in one process', () => {
      then('they differ, so two writes never share a temp file', () => {
        expect(asTempPathBeside({ path: target })).not.toEqual(
          asTempPathBeside({ path: target }),
        );
      });
    });
  });
});
