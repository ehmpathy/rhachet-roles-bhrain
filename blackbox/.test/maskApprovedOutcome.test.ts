import { maskApprovedOutcome } from './maskApprovedOutcome';
import { maskConcernMagnitudes } from './maskConcernMagnitudes';

/**
 * .what = the two approved renders a live brain draws on clean code, verbatim from ci run
 *         40052613926 (`review.by.learner` `[case-app]`), one with no nitpick, one with one
 * .why = the pass-case snapshot pinned the first, and the brain drew the second
 */
const RENDER_OF_NO_NITPICK = [
  '🦉 not even a vole',
  '',
  '🔍 review',
  '   ├─ review: .reviews/by=learner/rubric=term-application.md',
  '   └─ summary',
  '      ├─ 0 blockers',
  '      ├─ 0 nitpicks',
  '      └─ all good 👍',
].join('\n');
const RENDER_OF_ONE_NITPICK = [
  '🦉 just a few hoots',
  '',
  '🔍 review',
  '   ├─ review: .reviews/by=learner/rubric=term-application.md',
  '   └─ summary',
  '      ├─ 0 blockers',
  '      └─ 1 nitpick 🟠',
].join('\n');
const RENDER_MASKED = [
  '🦉 [APPROVED]',
  '',
  '🔍 review',
  '   ├─ review: .reviews/by=learner/rubric=term-application.md',
  '   └─ summary',
  '      ├─ 0 blockers',
  '      └─ [N] nitpicks',
].join('\n');

const asMasked = (text: string): string =>
  maskApprovedOutcome(maskConcernMagnitudes(text));

const TEST_CASES = [
  {
    description: 'an approved render with no nitpick masks to the one approved render',
    given: { text: RENDER_OF_NO_NITPICK },
    expect: { text: RENDER_MASKED },
  },
  {
    description: 'an approved render with a nitpick masks to the same render',
    given: { text: RENDER_OF_ONE_NITPICK },
    expect: { text: RENDER_MASKED },
  },
  {
    description: 'a zero blocker count survives, since it is the pass the case claims',
    given: { text: '      ├─ 0 blockers' },
    expect: { text: '      ├─ 0 blockers' },
  },
  {
    description: 'a nonzero blocker count masks, so a dirty pass case still differs',
    given: { text: '      ├─ 2 blockers 🔴' },
    expect: { text: '      ├─ [N] blockers 🔴' },
  },
  {
    description: 'a blocker verdict word is left verbatim',
    given: { text: '🦉 needs your talons' },
    expect: { text: '🦉 needs your talons' },
  },
];

describe('maskApprovedOutcome', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asMasked(thisCase.given.text)).toEqual(thisCase.expect.text);
    }),
  );
});
