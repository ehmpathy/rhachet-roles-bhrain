import { given, then, when } from 'test-fns';

import { formatHashbarRetired } from './formatHashbarRetired';

describe('formatHashbarRetired', () => {
  given('[case1] no guard sets the key', () => {
    when('[t0] format is called with an empty list', () => {
      /**
       * .why = the notice must cost naught to a route that never set the key. a retirement
       *        line printed to every driver on every stone is noise, and noise is what makes
       *        a real notice easy to skip.
       */
      then('renders no lines at all', () => {
        expect(formatHashbarRetired({ found: [] })).toEqual([]);
      });
    });
  });

  given('[case2] one guard still carries the key', () => {
    const output = formatHashbarRetired({
      found: [{ stone: '1.vision', slug: 'all-done' }],
    }).join('\n');

    when('[t0] format is called', () => {
      then('names where it was found, so the author can go delete it', () => {
        expect(output).toContain('found in 1.vision → review.self.all-done');
      });

      /**
       * 🔴 .why = "you no longer need this" leaves an author to wonder why their route
       *           misbehaved anyway. the honest sentence is that the knob NEVER fired — the
       *           persist branch read the newest trigger, and a new hash was instantly newest.
       */
      then(
        'states the workaround never fired, not merely that it is obsolete',
        () => {
          expect(output).toContain('it never fired');
          expect(output).toContain('NEWEST trigger');
        },
      );

      then('states the defect is gone at the root', () => {
        expect(output).toContain('hashless');
        expect(output).toContain('gone at the root');
      });

      then('names the fix', () => {
        expect(output).toContain('safe to delete the key');
      });

      then('snapshot matches vision', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case3] several guards carry the key', () => {
    const output = formatHashbarRetired({
      found: [
        { stone: '1.vision', slug: 'all-done' },
        { stone: '3.1.blueprint', slug: 'design' },
      ],
    }).join('\n');

    when('[t0] format is called', () => {
      /**
       * .why = one row per site. a notice that names only the first leaves the author to
       *        re-run the guard once per deletion to discover the next.
       */
      then('names every site, never just the first', () => {
        expect(output).toContain('found in 1.vision → review.self.all-done');
        expect(output).toContain('found in 3.1.blueprint → review.self.design');
      });

      then('states the reason once, not once per site', () => {
        expect(output.match(/it never fired/g)).toHaveLength(1);
      });
    });
  });
});
