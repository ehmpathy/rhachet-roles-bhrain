import { given, then, when } from 'test-fns';

import { parseReviewByArgs } from './review.by';

/**
 * .what = unit test for the review.by CLI arg parser, focused on dispatch-flag tolerance
 * .why = `rhx review.by --repo bhrain --role reviewer` forwards --repo/--role/--skill through
 *        into the skill's argv (rhachet never eats them). the base engine — and a role's own
 *        review.by wrapper that calls the base — must TOLERATE those forwarded dispatch flags
 *        rather than reject them as unknown, while a genuine typo (--rool) still errors loud.
 *        this seam is the exact fix that made `rhx review.by` invocation work, so its contract
 *        is clamped here without an expensive end-to-end dispatch round-trip.
 *
 * argv shape mirrors a real invocation: [node, entrypoint, ...flags]
 */
const asArgv = (flags: string[]): string[] => [
  'node',
  'review.by.js',
  ...flags,
];

describe('parseReviewByArgs', () => {
  given(
    '[case1] rhachet forwards --skill/--repo dispatch flags alongside --role',
    () => {
      when('[t0] parsed', () => {
        then(
          'the dispatch flags are tolerated (not collected as unknown)',
          () => {
            const options = parseReviewByArgs({
              argv: asArgv([
                '--skill',
                'review.by',
                '--repo',
                'bhrain',
                '--role',
                'reviewer',
              ]),
            });
            expect(options.unknownFlags).toEqual([]);
            expect(options.valueAbsentFlags).toEqual([]);
          },
        );

        then('--role is still parsed as a real skill arg', () => {
          const options = parseReviewByArgs({
            argv: asArgv([
              '--skill',
              'review.by',
              '--repo',
              'bhrain',
              '--role',
              'reviewer',
            ]),
          });
          expect(options.role).toEqual('reviewer');
        });
      });
    },
  );

  given('[case2] a genuine typo flag (--rool) among real flags', () => {
    when('[t0] parsed', () => {
      then('the typo is collected as an unknown flag (errors loud)', () => {
        const options = parseReviewByArgs({
          argv: asArgv(['--rool', 'reviewer']),
        });
        expect(options.unknownFlags).toEqual(['--rool']);
      });
    });
  });

  given(
    '[case3] a wrapper supplies --role after the forwarded dispatch --role',
    () => {
      when('[t0] parsed', () => {
        then(
          'the later --role wins (last-wins overrides the dispatch role)',
          () => {
            const options = parseReviewByArgs({
              argv: asArgv([
                '--repo',
                'bhrain',
                '--role',
                'reviewer',
                '--role',
                'demo',
              ]),
            });
            expect(options.role).toEqual('demo');
          },
        );
      });
    },
  );

  given(
    '[case4] a known value-flag given with no value (--brain alone)',
    () => {
      when('[t0] parsed (next token is another flag)', () => {
        then(
          'the flag is collected as value-absent (so reviewBy can fail loud)',
          () => {
            const options = parseReviewByArgs({
              argv: asArgv(['--brain', '--role', 'reviewer']),
            });
            expect(options.valueAbsentFlags).toEqual(['--brain']);
          },
        );
      });
    },
  );

  given('[case5] a bare invocation with only --role', () => {
    when('[t0] parsed', () => {
      then('role is set and no flags are flagged', () => {
        const options = parseReviewByArgs({
          argv: asArgv(['--role', 'reviewer']),
        });
        expect(options.role).toEqual('reviewer');
        expect(options.unknownFlags).toEqual([]);
        expect(options.valueAbsentFlags).toEqual([]);
      });
    });
  });
});
