import { given, then, when } from 'test-fns';

import {
  isProgressArticulated,
  MIN_ARTICULATION_CHARS,
} from './isProgressArticulated';

/**
 * .what = a body of exactly MIN_ARTICULATION_CHARS non-whitespace chars
 * .why = pins the boundary so the threshold is verified at its exact edge, not just
 *        far above/below it
 */
const bodyAtThreshold = 'x'.repeat(MIN_ARTICULATION_CHARS);
const bodyBelowThreshold = 'x'.repeat(MIN_ARTICULATION_CHARS - 1);

const CASES: {
  slug: string;
  content: string | null;
  articulated: boolean;
}[] = [
  { slug: 'an absent sentinel (null)', content: null, articulated: false },
  { slug: 'an empty file (a bare touch)', content: '', articulated: false },
  {
    slug: 'a whitespace-only file (blank lines + spaces)',
    content: '\n\n   \n\t\n',
    articulated: false,
  },
  { slug: 'a one-word file', content: 'done', articulated: false },
  {
    slug: 'a body one char below the threshold',
    content: bodyBelowThreshold,
    articulated: false,
  },
  {
    slug: 'a body at exactly the threshold',
    content: bodyAtThreshold,
    articulated: true,
  },
  {
    slug: 'a real terse articulation (no new terms, with the why)',
    content:
      '## round\n\nno new terms this round — all names decomposed to sanctioned verbs.',
    articulated: true,
  },
];

describe('isProgressArticulated', () => {
  CASES.forEach((thisCase) => {
    given(`[${thisCase.slug}]`, () => {
      when('the content is judged', () => {
        then(`it reads as articulated=${thisCase.articulated}`, () => {
          expect(isProgressArticulated({ content: thisCase.content })).toEqual(
            thisCase.articulated,
          );
        });
      });
    });
  });
});
