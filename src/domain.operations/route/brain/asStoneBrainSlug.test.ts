import { given, then, when } from 'test-fns';

import { asStoneBrainSlug } from './asStoneBrainSlug';

/**
 * .what = pins which outcomes yield a slug for the drive's `where do we go?` line
 * .why = it is the ONE narrow-down all four drive surfaces read, so a wrong arm here
 *        prints a wrong brain on every halt at once. a pure transformer, which
 *        `rule.require.test-coverage-by-grain` puts at the UNIT grain
 *
 * 🔴 .why the union matters = three of the four arms carry a `brain` and one does not, so
 *    the arm that returns null is the ONLY one a reader can get wrong by omission. every
 *    case below asserts the slug ITSELF rather than its presence — a `toBeTruthy` would
 *    pass on a build that returned the stone name
 */
describe('asStoneBrainSlug', () => {
  given('[case1] a stone that declared no brain', () => {
    when('[t0] the slug is read', () => {
      const slug = asStoneBrainSlug({ outcome: { outcome: 'none' } });

      then('it is null, so the bucket omits the line entirely', () => {
        // 🔴 .why = case=10's bound rests on this arm. a build that returned a placeholder
        //          string here would add a `brain = ` row to every route in every repo
        expect(slug).toBeNull();
      });
    });
  });

  given('[case2] a stone whose brain was dispatched', () => {
    when('[t0] the slug is read', () => {
      const slug = asStoneBrainSlug({
        outcome: {
          outcome: 'requested',
          brain: 'claude-opus-5[1m]',
          effort: null,
          guard: '.behavior/v1/5.3.verification.guard',
          reviewers: [{ slug: 'primo', brain: 'opus' }],
        },
      });

      then('it is the brain the guard prescribed', () => {
        expect(slug).toEqual('claude-opus-5[1m]');
      });
    });
  });

  given('[case5] a brainless stone that INHERITED a prior brain', () => {
    when('[t0] the slug is read', () => {
      const slug = asStoneBrainSlug({
        outcome: {
          outcome: 'inherited',
          brain: 'claude-opus-5[1m]',
          effort: null,
          stone: '3.3.1.blueprint',
        },
      });

      then('it is the inherited brain, NOT null', () => {
        // 🔴 .why = the bucket answers "what is live right now?". an inherited brain is
        //          live, so it is named — the driver runs on it exactly as a requested one
        expect(slug).toEqual('claude-opus-5[1m]');
      });

      then('the stone that set it does NOT reach this line', () => {
        // .why = provenance answers a different question than "what is live"; it stays out
        expect(slug).not.toContain('3.3.1.blueprint');
      });
    });
  });

  given('[case3] a stone whose brain was never dispatched', () => {
    when('[t0] the slug is read', () => {
      const slug = asStoneBrainSlug({
        outcome: {
          outcome: 'undispatched',
          brain: 'claude-opus-5[1m]',
          effort: null,
          guard: '.behavior/v1/5.3.verification.guard',
          cause: 'unenrolled',
        },
      });

      then(
        'it is the PRESCRIBED brain, which the halt beside it contradicts',
        () => {
          // 🔴 .why it is not null = the fact a reader needs is WHICH brain the guard asked
          //    for, so they can fix the guard. the halt says plainly the switch did not
          //    land, so this line cannot read as a claim that it did (case=8 [t2])
          expect(slug).toEqual('claude-opus-5[1m]');
        },
      );
    });
  });

  given('[case4] the four outcomes, read as a set', () => {
    when('[t0] each is narrowed', () => {
      const slugs = [
        asStoneBrainSlug({ outcome: { outcome: 'none' } }),
        asStoneBrainSlug({
          outcome: {
            outcome: 'requested',
            brain: 'b',
            effort: null,
            guard: 'g.guard',
            reviewers: [],
          },
        }),
        asStoneBrainSlug({
          outcome: {
            outcome: 'undispatched',
            brain: 'b',
            effort: null,
            guard: 'g.guard',
            cause: 'unenrolled',
          },
        }),
        asStoneBrainSlug({
          outcome: {
            outcome: 'inherited',
            brain: 'b',
            effort: null,
            stone: 'prior',
          },
        }),
      ];

      then('exactly ONE of the four is null', () => {
        // 🔴 .why = `none` is the only arm that omits the line, and it must be the only
        //          one. this pins BOTH halves in one assert
        expect(slugs.filter((slug) => slug === null)).toHaveLength(1);
      });

      then('the other THREE name their brain', () => {
        expect(slugs.filter((slug) => slug === 'b')).toHaveLength(3);
      });
    });
  });
});
