import { BadRequestError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { asReviewPartitionsFromFlags } from './asReviewPartitionsFromFlags';

describe('asReviewPartitionsFromFlags', () => {
  given('[case1] a partition declared with a brace list of globs', () => {
    when('[t0] the flags are cast', () => {
      const partitions = asReviewPartitionsFromFlags({
        partition: [
          'review={src/domain.operations/review/**, src/domain.objects/ }',
        ],
      });

      then('the slug is read from ahead of the first =', () => {
        expect(partitions.map((one) => one.slug)).toEqual(['review']);
      });

      then('the globs are kept verbatim, trimmed, in declared order', () => {
        expect(partitions[0]!.globs).toEqual([
          'src/domain.operations/review/**',
          'src/domain.objects/',
        ]);
      });

      then(
        'a glob-shaped member is a glob; a bare member is a prefix with its trailer slash trimmed',
        () => {
          expect(partitions[0]!.members).toEqual([
            {
              kind: 'glob',
              value: 'src/domain.operations/review/**',
              exclude: false,
            },
            { kind: 'prefix', value: 'src/domain.objects', exclude: false },
          ]);
        },
      );
    });
  });

  given('[case2] several partitions declared', () => {
    when('[t0] the flags are cast', () => {
      const partitions = asReviewPartitionsFromFlags({
        partition: ['route=src/route/**', 'review=src/review'],
      });

      then(
        '🔴 the declared order is kept — the first that lists a common file grades it',
        () => {
          expect(partitions.map((one) => one.slug)).toEqual([
            'route',
            'review',
          ]);
        },
      );
    });
  });

  given(
    '[case2b] a brace list whose member carries a brace list of its own',
    () => {
      when('[t0] the flags are cast', () => {
        const partitions = asReviewPartitionsFromFlags({
          partition: ['route={src/route/*,src/route/{stones,judges}/**}'],
        });

        then(
          '🔴 the outer list splits at its own commas only — the inner list stays whole',
          () => {
            expect(partitions[0]!.globs).toEqual([
              'src/route/*',
              'src/route/{stones,judges}/**',
            ]);
          },
        );
      });
    },
  );

  given('[case3] a brace inside a longer glob', () => {
    when('[t0] the flags are cast', () => {
      const partitions = asReviewPartitionsFromFlags({
        partition: ['ab=src/{a,b}/**'],
      });

      then('it stays one glob, never several members', () => {
        expect(partitions[0]!.members).toEqual([
          { kind: 'glob', value: 'src/{a,b}/**', exclude: false },
        ]);
      });
    });
  });

  given('[case3b] a member declared with a ! at its head', () => {
    when('[t0] the flags are cast', () => {
      const partitions = asReviewPartitionsFromFlags({
        partition: ['review=src/review/*,!src/review/compile*,!src/review/x'],
      });

      then('🔴 it is an exclusion, its ! stripped from the matcher', () => {
        expect(partitions[0]!.members).toEqual([
          { kind: 'glob', value: 'src/review/*', exclude: false },
          { kind: 'glob', value: 'src/review/compile*', exclude: true },
          { kind: 'prefix', value: 'src/review/x', exclude: true },
        ]);
      });

      then('the globs are kept verbatim, ! and all', () => {
        expect(partitions[0]!.globs).toEqual([
          'src/review/*',
          '!src/review/compile*',
          '!src/review/x',
        ]);
      });
    });
  });

  given('[case4] no partition flag', () => {
    when('[t0] the flags are cast', () => {
      then('the list is empty — the run never splits', () => {
        expect(asReviewPartitionsFromFlags({ partition: [] })).toEqual([]);
      });
    });
  });

  given('[case5] a malformed declaration', () => {
    when('[t0] a value with no slug', () => {
      then('🔴 it refuses loud, with the form that would parse', async () => {
        const error = await getError(() =>
          asReviewPartitionsFromFlags({ partition: ['src/review/**'] }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain("'<slug>=<globs>'");
      });
    });

    when('[t1] an unclosed brace list', () => {
      then('🔴 it refuses loud, with the corrected declaration', async () => {
        const error = await getError(() =>
          asReviewPartitionsFromFlags({
            partition: ['review={src/a/**,src/b/**'],
          }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain(
          "fix: --partition 'review=src/a/**,src/b/**'",
        );
      });
    });
  });
});

/**
 * .what = every form a partition's globs may be written in, and the globs each reads as
 * .why = the forms are interchangeable by contract, so one table proves each reads the same
 */
const FORM_CASES = [
  {
    description: 'a brace list',
    given: ['route={src/route/**,blackbox/driver.route.*}'],
    expect: [
      { slug: 'route', globs: ['src/route/**', 'blackbox/driver.route.*'] },
    ],
  },
  {
    description: 'a bare comma list, no braces',
    given: ['route=src/route/**,blackbox/driver.route.*'],
    expect: [
      { slug: 'route', globs: ['src/route/**', 'blackbox/driver.route.*'] },
    ],
  },
  {
    description: 'a bare comma list with spaces and a trailer comma',
    given: ['route= src/route/** , blackbox/driver.route.* ,'],
    expect: [
      { slug: 'route', globs: ['src/route/**', 'blackbox/driver.route.*'] },
    ],
  },
  {
    description: '🔴 one slug over several flags merges into one partition',
    given: ['route=src/route/**', 'route=blackbox/driver.route.*'],
    expect: [
      { slug: 'route', globs: ['src/route/**', 'blackbox/driver.route.*'] },
    ],
  },
  {
    description: 'a brace list widened by a repeated flag',
    given: [
      'route={src/route/**,src/domain.objects/**}',
      'route=blackbox/driver.route.*,blackbox/__snapshots__/driver.route.*',
    ],
    expect: [
      {
        slug: 'route',
        globs: [
          'src/route/**',
          'src/domain.objects/**',
          'blackbox/driver.route.*',
          'blackbox/__snapshots__/driver.route.*',
        ],
      },
    ],
  },
  {
    description:
      'a merged slug keeps its first-declared position, and a glob named twice once',
    given: [
      'route=src/route/**',
      'review=src/review/**',
      'route=src/route/**,blackbox/x.*',
    ],
    expect: [
      { slug: 'route', globs: ['src/route/**', 'blackbox/x.*'] },
      { slug: 'review', globs: ['src/review/**'] },
    ],
  },
  {
    description: 'a comma inside an inner brace never splits',
    given: [
      'route=src/route/{stones,judges}/**,blackbox/driver.route.{drive,set}.*',
    ],
    expect: [
      {
        slug: 'route',
        globs: [
          'src/route/{stones,judges}/**',
          'blackbox/driver.route.{drive,set}.*',
        ],
      },
    ],
  },
  {
    description: 'a brace list mixed with bare members',
    given: ['route={src/a/**,src/b/**},blackbox/x.*'],
    expect: [
      { slug: 'route', globs: ['src/a/**', 'src/b/**', 'blackbox/x.*'] },
    ],
  },
];

describe('asReviewPartitionsFromFlags, by form', () => {
  given('[case6] a declaration in each accepted form', () => {
    when('[t0] the flags are cast', () => {
      FORM_CASES.map((thisCase) =>
        then(thisCase.description, () => {
          const partitions = asReviewPartitionsFromFlags({
            partition: thisCase.given,
          });
          expect(
            partitions.map((one) => ({ slug: one.slug, globs: one.globs })),
          ).toEqual(thisCase.expect);
        }),
      );
    });
  });
});
