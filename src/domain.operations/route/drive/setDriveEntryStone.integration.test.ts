import { genTempDir, given, then, useThen, when } from 'test-fns';

import { setDriveEntryStone } from './setDriveEntryStone';

/**
 * .what = the carry rule of the brain inheritance record, one dispatch at a time
 * .why = the two axes carry through on different terms, and a drive that names a stale
 *        axis names a price the session does not pay (F30):
 *
 *        | dispatched | slug after | effort after |
 *        |---|---|---|
 *        | choice + effort | the choice | the effort |
 *        | choice alone | the choice | null — a new model runs at its default |
 *        | effort alone | the prior slug | the effort |
 *        | naught | the prior record | the prior record |
 */
describe('setDriveEntryStone.integration', () => {
  given('[case1] a route that walks four stones', () => {
    const route = genTempDir({ slug: 'test-setDriveEntryStone-carry' });

    when('[t0] each stone dispatches a different pair of axes', () => {
      const records = useThen('each write lands', async () => {
        const first = await setDriveEntryStone({
          route,
          stone: '1',
          brain: 'opus',
          effort: 'high',
        });
        const second = await setDriveEntryStone({
          route,
          stone: '2',
          brain: null,
          effort: 'low',
        });
        const third = await setDriveEntryStone({
          route,
          stone: '3',
          brain: 'sonnet',
          effort: null,
        });
        const fourth = await setDriveEntryStone({
          route,
          stone: '4',
          brain: null,
          effort: null,
        });
        return [first, second, third, fourth].map((one) => one.state.brain);
      });

      then('choice + effort records both', () => {
        expect(records[0]).toMatchObject({
          slug: 'opus',
          effort: 'high',
          stone: '1',
        });
      });

      then(
        'effort alone keeps the prior slug and records the new level',
        () => {
          expect(records[1]).toMatchObject({
            slug: 'opus',
            effort: 'low',
            stone: '2',
          });
        },
      );

      then('choice alone clears the level — effort is model-scoped', () => {
        expect(records[2]).toMatchObject({
          slug: 'sonnet',
          effort: null,
          stone: '3',
        });
      });

      then('naught dispatched keeps the prior record whole', () => {
        expect(records[3]).toMatchObject({
          slug: 'sonnet',
          effort: null,
          stone: '3',
        });
      });
    });
  });
});
