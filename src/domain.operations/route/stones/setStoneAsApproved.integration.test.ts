import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, getError, given, then, useThen, when } from 'test-fns';

import { genFulcrumEntryContent } from '../__test_assets__/genFulcrumEntryContent';
import { setStoneAsApproved } from './setStoneAsApproved';

const ASSETS_DIR = path.join(__dirname, '../.test/assets');

/**
 * .what = a temp copy of route.simple
 */
const genRouteSimple = async (input: { slug: string }): Promise<string> => {
  const route = genTempDir({ slug: input.slug });
  await fs.cp(path.join(ASSETS_DIR, 'route.simple'), route, {
    recursive: true,
  });
  return route;
};

/**
 * .what = writes one open human-owed dispute, F44, into a route
 */
const setOpenDispute = async (input: { route: string }): Promise<void> => {
  await fs.mkdir(path.join(input.route, '.fulcrums'), { recursive: true });
  await fs.writeFile(
    path.join(
      input.route,
      '.fulcrums',
      'inventory.of=fulcrums.case=F44-rename-table.md',
    ),
    genFulcrumEntryContent({ case: 'F44', confidence: 0.7 }),
  );
};

/**
 * .what = the route's passage log, or empty where none was written
 */
const getPassageLog = async (input: { route: string }): Promise<string> =>
  fs
    .readFile(path.join(input.route, '.route', 'passage.jsonl'), 'utf-8')
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return '';
      throw error;
    });

/**
 * .what = masks the temp route in a refusal, so its bytes snap stable across runs
 */
const asStableRefusal = (input: { message: string; route: string }): string =>
  input.message.split(input.route).join('<route>');

describe('setStoneAsApproved, at the dispute gate', () => {
  given('[case1] a route with an open dispute that owes the human', () => {
    when('[t0] a human approves the stone', () => {
      // the call-site clamp of invariant 2: remove the assert from setStoneAsApproved and the
      // approval lands, so this case goes red
      const result = useThen('it is refused', async () => {
        const route = await genRouteSimple({ slug: 'approve-dispute-open' });
        await setOpenDispute({ route });
        const error = await getError(
          setStoneAsApproved({ stone: '1.vision', route }, { isTTY: true }),
        );
        const log = await getPassageLog({ route });
        return { error, log, route };
      });

      then('🔴 the approval is refused, and names the dispute', () => {
        expect(result.error.message).toContain('F44');
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

    when('[t1] the dispute was raised after the human approved', () => {
      const result = useThen('the re-approval is refused', async () => {
        const route = await genRouteSimple({
          slug: 'approve-dispute-after-approval',
        });
        await setStoneAsApproved({ stone: '1.vision', route }, { isTTY: true });
        await setOpenDispute({ route });
        const error = await getError(
          setStoneAsApproved({ stone: '1.vision', route }, { isTTY: true }),
        );
        return { error };
      });

      then(
        '🔴 a re-approval names the later dispute, never a silent no-op',
        () => {
          expect(result.error.message).toContain(
            'rhx route.fulcrum.rule --case F44 --as upheld|conceded',
          );
        },
      );
    });
  });
});
