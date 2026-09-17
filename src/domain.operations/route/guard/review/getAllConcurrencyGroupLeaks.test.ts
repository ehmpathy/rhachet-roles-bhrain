import { given, then, when } from 'test-fns';

import { getAllConcurrencyGroupLeaks } from './getAllConcurrencyGroupLeaks';

describe('getAllConcurrencyGroupLeaks', () => {
  given(
    '[case1] a level that mixes a grouped lane with an ungrouped one',
    () => {
      // 🔴 the F13 hazard itself — the shape this transformer exists to name
      when('[t0] the leaks are read', () => {
        then('that level is reported, with both halves named', () => {
          expect(
            getAllConcurrencyGroupLeaks({
              peers: [
                { slug: 'l3-a', level: 3, group: 'serial' },
                { slug: 'l3-b', level: 3, group: 'serial' },
                { slug: 'l3-x', level: 3, group: null },
              ],
            }),
          ).toEqual([{ level: 3, groups: ['serial'], ungrouped: ['l3-x'] }]);
        });
      });
    },
  );

  given('[case2] a level where every lane declared the same group', () => {
    when('[t0] the leaks are read', () => {
      then('no leak is reported — the bound governs every member', () => {
        expect(
          getAllConcurrencyGroupLeaks({
            peers: [
              { slug: 'l3-a', level: 3, group: 'serial' },
              { slug: 'l3-b', level: 3, group: 'serial' },
            ],
          }),
        ).toEqual([]);
      });
    });
  });

  given('[case3] a level where no lane declared a group', () => {
    // .why = this is the DEFAULT shape of every extant guard in the org. to
    //        report it would advise on every run and teach the author to
    //        ignore the advisory — `rule.forbid.emphasis-noise`, at the cli
    when('[t0] the leaks are read', () => {
      then('no leak is reported', () => {
        expect(
          getAllConcurrencyGroupLeaks({
            peers: [
              { slug: 'l1-a', level: 1, group: null },
              { slug: 'l1-b', level: 1, group: null },
            ],
          }),
        ).toEqual([]);
      });
    });
  });

  given('[case4] grouped and ungrouped lanes at DIFFERENT levels', () => {
    // 🔴 the false-positive clamp. only one level pours at a time, so an l1
    //    lane never contends with an l3 group's bound — that is the level gate
    when('[t0] the leaks are read', () => {
      then('no leak is reported', () => {
        expect(
          getAllConcurrencyGroupLeaks({
            peers: [
              { slug: 'l1-a', level: 1, group: null },
              { slug: 'l3-a', level: 3, group: 'serial' },
            ],
          }),
        ).toEqual([]);
      });
    });
  });

  given('[case5] one level that leaks past SEVERAL groups', () => {
    when('[t0] the leaks are read', () => {
      then('every group the lane escapes is named', () => {
        expect(
          getAllConcurrencyGroupLeaks({
            peers: [
              { slug: 'l3-a', level: 3, group: 'anthropic' },
              { slug: 'l3-b', level: 3, group: 'fireworks' },
              { slug: 'l3-x', level: 3, group: null },
            ],
          }),
        ).toEqual([
          {
            level: 3,
            groups: ['anthropic', 'fireworks'],
            ungrouped: ['l3-x'],
          },
        ]);
      });
    });
  });

  given('[case6] two levels that each leak', () => {
    when('[t0] the leaks are read', () => {
      then('both come back, lowest level first', () => {
        expect(
          getAllConcurrencyGroupLeaks({
            peers: [
              { slug: 'l3-a', level: 3, group: 'serial' },
              { slug: 'l3-x', level: 3, group: null },
              { slug: 'l1-a', level: 1, group: 'local' },
              { slug: 'l1-x', level: 1, group: null },
            ],
          }),
        ).toEqual([
          { level: 1, groups: ['local'], ungrouped: ['l1-x'] },
          { level: 3, groups: ['serial'], ungrouped: ['l3-x'] },
        ]);
      });
    });
  });

  given('[case7] a level with SEVERAL ungrouped lanes beside a group', () => {
    when('[t0] the leaks are read', () => {
      then('every escaped lane is named, in declared order', () => {
        expect(
          getAllConcurrencyGroupLeaks({
            peers: [
              { slug: 'l3-a', level: 3, group: 'serial' },
              { slug: 'l3-x', level: 3, group: null },
              { slug: 'l3-y', level: 3, group: null },
            ],
          }),
        ).toEqual([
          { level: 3, groups: ['serial'], ungrouped: ['l3-x', 'l3-y'] },
        ]);
      });
    });
  });

  given('[case8] no reviewers at all', () => {
    when('[t0] the leaks are read', () => {
      then('the result is empty rather than a throw', () => {
        expect(getAllConcurrencyGroupLeaks({ peers: [] })).toEqual([]);
      });
    });
  });

  given('[case9] any set at all', () => {
    when('[t0] the leaks are read', () => {
      then('the input array is left untouched', () => {
        const peers = [
          { slug: 'l3-a', level: 3, group: 'serial' },
          { slug: 'l1-a', level: 1, group: null },
        ];
        getAllConcurrencyGroupLeaks({ peers });
        expect(peers).toEqual([
          { slug: 'l3-a', level: 3, group: 'serial' },
          { slug: 'l1-a', level: 1, group: null },
        ]);
      });
    });
  });
});
