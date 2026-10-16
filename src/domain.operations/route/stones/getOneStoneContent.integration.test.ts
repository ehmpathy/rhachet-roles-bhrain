import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, getError, given, then, when } from 'test-fns';

import { getOneStoneContent } from './getOneStoneContent';

describe('getOneStoneContent', () => {
  given('[case1] a stone file on disk', () => {
    const dir = genTempDir({ slug: 'stone-content' });
    const stonePath = path.join(dir, '1.vision.stone');
    fs.writeFileSync(stonePath, '# vision\n\nwrite the vision.\n');

    when('[t0] it is read', () => {
      then('it returns the body verbatim, as utf-8 text', async () => {
        const content = await getOneStoneContent({ path: stonePath });
        expect(content).toEqual('# vision\n\nwrite the vision.\n');
      });
    });
  });

  given('[case2] a stone path with no file behind it', () => {
    const dir = genTempDir({ slug: 'stone-content-absent' });

    when('[t0] it is read', () => {
      then('it fails loud — a stone the route names must exist', async () => {
        const error = await getError(
          getOneStoneContent({ path: path.join(dir, 'absent.stone') }),
        );
        // node fs errors come from another realm, so the class is not jest's `Error`;
        // the code in the message proves the read was attempted and refused
        expect(error.message).toContain('ENOENT');
      });
    });
  });
});
