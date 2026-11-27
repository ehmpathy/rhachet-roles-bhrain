import { given, then, when } from 'test-fns';

import { PedigreeCourse } from '@src/domain.objects/Learner/PedigreeCourse';
import { PedigreeEntry } from '@src/domain.objects/Learner/PedigreeEntry';

import { asPedigreeIndexMarkdown } from './asPedigreeIndexMarkdown';

/**
 * .what = a pedigree entry with one course per slug given
 */
const genEntry = (input: {
  date: string;
  slug: string;
  courses: string[];
}): PedigreeEntry =>
  new PedigreeEntry({
    role: 'mechanic',
    date: input.date,
    slug: input.slug,
    route: `.route/v${input.date}.education.pursuit.mechanic.${input.slug}`,
    courses: input.courses.map(
      (slug, index) =>
        new PedigreeCourse({
          ordinal: index + 1,
          slug,
          buildsOn: [],
          baseline: '0/1',
          after: '1/1',
          transfer: 'passed',
          greats: [],
          claimsHeld: 0,
          claimsRefuted: 0,
          claimsUntested: 0,
          briefs: 0,
          skills: 0,
        }),
    ),
  });

describe('asPedigreeIndexMarkdown', () => {
  given('[case1] entries out of order', () => {
    const entries = [
      genEntry({
        date: '2026_11_24',
        slug: 'observability',
        courses: ['logs'],
      }),
      genEntry({
        date: '2026_11_23',
        slug: 'reliable-writes',
        courses: ['idempotency', 'retries'],
      }),
    ];

    when('[t0] the index is rendered', () => {
      const markdown = asPedigreeIndexMarkdown({ role: 'mechanic', entries });

      then('it lists one row per pursuit, oldest first', () => {
        const rows = markdown
          .split('\n')
          .filter((line) => line.startsWith('| v'));
        expect(rows).toEqual([
          '| v2026_11_23 | reliable-writes | idempotency · retries | `pedigree.pursuit=v2026_11_23.reliable-writes.md` |',
          '| v2026_11_24 | observability | logs | `pedigree.pursuit=v2026_11_24.observability.md` |',
        ]);
      });

      then('it leaves the input order untouched', () => {
        expect(entries[0]!.slug).toEqual('observability');
      });

      then('it renders as the snapshot shows', () => {
        expect(markdown).toContain('# pedigree: mechanic');
        expect(markdown).toMatchSnapshot();
      });
    });
  });

  given('[case2] no entries', () => {
    when('[t0] the index is rendered', () => {
      then('it holds the header and no rows', () => {
        const markdown = asPedigreeIndexMarkdown({
          role: 'mechanic',
          entries: [],
        });
        expect(markdown).toContain('# pedigree: mechanic');
        expect(markdown).not.toContain('| v');
      });
    });
  });
});
