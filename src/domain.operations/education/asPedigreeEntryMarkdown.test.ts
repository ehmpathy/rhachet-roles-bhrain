import { ConstraintError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { PedigreeEntry } from '@src/domain.objects/Learner/PedigreeEntry';

import { asPedigreeCourse } from './asPedigreeCourse';
import { asPedigreeEntryMarkdown } from './asPedigreeEntryMarkdown';
import { asPedigreeEntryParsed } from './asPedigreeEntryParsed';
import type { CourseProof } from './getOneCourseProof';

const ROUTE = '.route/v2026_11_23.education.pursuit.mechanic.reliable-writes';

const proofs: CourseProof[] = [
  {
    ordinal: 1,
    slug: 'idempotency',
    route: `${ROUTE}/2.courses.pursue.yield/course=1.idempotency`,
    buildsOn: [],
    outcome: { baseline: '1/4', after: '4/4', transfer: 'passed' },
    greats: ['helland', 'kleppmann'],
    claims: [
      { claim: 'k1 natural-key upsert dedupes a replay', verdict: 'held' },
      { claim: 'k3 a key at the boundary dedupes a charge', verdict: 'held' },
      { claim: 'k7 backoff alone makes a write safe', verdict: 'refuted' },
    ],
    yields: [
      {
        path: 'briefs/rule.require.idempotency-key-at-external-boundaries.md',
        kind: 'brief',
        boot: 'say',
      },
      {
        path: 'briefs/howto.replay-a-consumer-in-vitro.md',
        kind: 'brief',
        boot: 'ref',
      },
    ],
  },
  {
    ordinal: 2,
    slug: 'retries',
    route: `${ROUTE}/2.courses.pursue.yield/course=2.retries`,
    buildsOn: ['idempotency'],
    outcome: { baseline: '0/3', after: '3/3', transfer: 'passed' },
    greats: ['aws builders library'],
    claims: [{ claim: 'k1 jitter spreads a retry storm', verdict: 'held' }],
    yields: [{ path: 'skills/retry.replay.sh', kind: 'skill', boot: null }],
  },
];

const entry = new PedigreeEntry({
  role: 'mechanic',
  date: '2026_11_23',
  slug: 'reliable-writes',
  route: ROUTE,
  courses: proofs.map((proof) => asPedigreeCourse({ proof })),
});

describe('asPedigreeEntryMarkdown', () => {
  given('[case1] a pursuit of two courses', () => {
    when('[t0] the entry is rendered', () => {
      const markdown = asPedigreeEntryMarkdown({ entry, proofs });

      then('it tallies claims and yields per course', () => {
        expect(entry.courses[0]).toMatchObject({
          claimsHeld: 2,
          claimsRefuted: 1,
          briefs: 2,
          skills: 0,
        });
        expect(entry.courses[1]).toMatchObject({
          claimsHeld: 1,
          claimsRefuted: 0,
          briefs: 0,
          skills: 1,
        });
      });

      then('it keeps a refuted claim on record', () => {
        expect(markdown).toContain(
          '| k7 backoff alone makes a write safe | refuted |',
        );
      });

      then('it reads back to the same entry', () => {
        expect(asPedigreeEntryParsed({ markdown })).toEqual(entry);
      });

      then('it renders as the snapshot shows', () => {
        expect(markdown).toContain('# pedigree: mechanic · v2026_11_23');
        expect(markdown).toMatchSnapshot();
      });
    });
  });

  given('[case3] a course whose free text holds a pipe', () => {
    when('[t0] the entry is rendered and read back', () => {
      const proofsPiped: CourseProof[] = [
        {
          ...proofs[0]!,
          outcome: { ...proofs[0]!.outcome, transfer: 'retry | backoff' },
          claims: [{ claim: 'k1 a | in a claim', verdict: 'held' }],
        },
      ];
      const entryPiped = new PedigreeEntry({
        ...entry,
        courses: proofsPiped.map((proof) => asPedigreeCourse({ proof })),
      });
      const markdown = asPedigreeEntryMarkdown({
        entry: entryPiped,
        proofs: proofsPiped,
      });

      then('the pipe is escaped and no cell shifts', () => {
        expect(markdown).toContain('retry \\| backoff');
        expect(asPedigreeEntryParsed({ markdown })).toEqual(entryPiped);
      });
    });
  });

  given('[case4] an entry whose courses table was damaged by hand', () => {
    when('[t0] a count cell reads n/a', () => {
      then('it refuses, and names the column and the cell', async () => {
        const markdown = asPedigreeEntryMarkdown({ entry, proofs }).replace(
          '| 2 | 1 | 0 | 2 | 0 |',
          '| n/a | 1 | 0 | 2 | 0 |',
        );
        const error = await getError(async () =>
          asPedigreeEntryParsed({ markdown }),
        );
        expect(error).toBeInstanceOf(ConstraintError);
        expect(error.message).toContain('no whole number');
        expect(error.message).toContain('n/a');
      });
    });

    when('[t1] the route line is gone', () => {
      then('it refuses, rather than read back an empty route', async () => {
        const markdown = asPedigreeEntryMarkdown({ entry, proofs }).replace(
          /route: `[^`]+`/,
          'route: none',
        );
        const error = await getError(async () =>
          asPedigreeEntryParsed({ markdown }),
        );
        expect(error).toBeInstanceOf(ConstraintError);
        expect(error.message).toContain('names no route');
      });
    });
  });

  given('[case2] a text that is no pedigree entry', () => {
    when('[t0] it is parsed', () => {
      then('it reads as null', () => {
        expect(
          asPedigreeEntryParsed({ markdown: '# some brief\n\nprose' }),
        ).toBeNull();
      });
    });
  });
});
