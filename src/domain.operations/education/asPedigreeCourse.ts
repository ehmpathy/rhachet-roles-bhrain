import { PedigreeCourse } from '@src/domain.objects/Learner/PedigreeCourse';

import type { CourseProof } from './getOneCourseProof';

/**
 * .what = the count of cells equal to a value
 * .why = the proof read refuses a value it does not know, so an exact count drops none
 */
const asCountOf = (input: { cells: string[]; word: string }): number =>
  input.cells.filter((cell) => cell === input.word).length;

/**
 * .what = what a course proved, tallied into the shape a pedigree entry cites
 * .why = the entry keeps the counts a reader scans; the claims and yields themselves stay
 *        listed below the table, so a refuted claim is still on record
 */
export const asPedigreeCourse = (input: {
  proof: CourseProof;
}): PedigreeCourse => {
  const verdicts = input.proof.claims.map((c) => c.verdict);
  const kinds = input.proof.yields.map((y) => y.kind);
  return new PedigreeCourse({
    ordinal: input.proof.ordinal,
    slug: input.proof.slug,
    buildsOn: input.proof.buildsOn,
    baseline: input.proof.outcome.baseline,
    after: input.proof.outcome.after,
    transfer: input.proof.outcome.transfer,
    greats: input.proof.greats,
    claimsHeld: asCountOf({ cells: verdicts, word: 'held' }),
    claimsRefuted: asCountOf({ cells: verdicts, word: 'refuted' }),
    claimsUntested: asCountOf({ cells: verdicts, word: 'untested' }),
    briefs: asCountOf({ cells: kinds, word: 'brief' }),
    skills: asCountOf({ cells: kinds, word: 'skill' }),
  });
};
