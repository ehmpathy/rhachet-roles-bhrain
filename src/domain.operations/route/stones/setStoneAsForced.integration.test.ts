import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, getError, given, then, useThen, when } from 'test-fns';

import { genFulcrumEntryContent } from '../__test_assets__/genFulcrumEntryContent';
import { setStoneAsForced } from './setStoneAsForced';

const ASSETS_DIR = path.join(__dirname, '../.test/assets');

/**
 * .what = masks the temp route in a refusal, so its bytes snap stable across runs
 */
const asStableRefusal = (input: { message: string; route: string }): string =>
  input.message.split(input.route).join('<route>');

describe('setStoneAsForced, at the dispute gate', () => {
  given('[case1] a route with an open dispute that owes the human', () => {
    when('[t0] a human forces the stone', () => {
      // the call-site clamp of invariant 2: a force is approve + overrule, so it must not be a
      // side door. remove the assert from setStoneAsForced and the force lands; this goes red
      const result = useThen('it is refused', async () => {
        const route = genTempDir({ slug: 'force-dispute-open' });
        await fs.cp(path.join(ASSETS_DIR, 'route.simple'), route, {
          recursive: true,
        });
        await fs.mkdir(path.join(route, '.fulcrums'), { recursive: true });
        await fs.writeFile(
          path.join(
            route,
            '.fulcrums',
            'inventory.of=fulcrums.case=F44-rename-table.md',
          ),
          genFulcrumEntryContent({ case: 'F44', confidence: 0.7 }),
        );
        const error = await getError(
          setStoneAsForced({ stone: '1.vision', route }, { isTTY: true }),
        );
        const log = await fs
          .readFile(path.join(route, '.route', 'passage.jsonl'), 'utf-8')
          .catch((fault: NodeJS.ErrnoException) => {
            if (fault.code === 'ENOENT') return '';
            throw fault;
          });
        return { error, log, route };
      });

      then('🔴 the force is refused, and names the dispute', () => {
        expect(result.error.message).toContain(
          'rhx route.fulcrum.rule --case F44 --as upheld|conceded',
        );
      });

      then('no approval is written', () => {
        expect(result.log).not.toContain('"status":"approved"');
      });

      then('the refusal a human reads is pinned', () => {
        expect(
          asStableRefusal({
            message: result.error.message,
            route: result.route,
          }),
        ).toMatchSnapshot();
      });
    });
  });
});
