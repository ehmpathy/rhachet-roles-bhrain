import { given, then, when } from 'test-fns';

import { getOneReviewPartitionsFault } from './getOneReviewPartitionsFault';

const TEST_CASES = [
  {
    description: 'a sound brace-list declaration has no fault',
    given: { partition: ['review={src/review/**,src/domain.objects/**}'] },
    expect: { headline: null, hint: null },
  },
  {
    description: 'a sound bare comma list has no fault',
    given: { partition: ['review=src/review/**,src/domain.objects/**'] },
    expect: { headline: null, hint: null },
  },
  {
    description: '🔴 one slug declared twice is no fault — its flags merge',
    given: { partition: ['review=src/a/**', 'review=src/b/**'] },
    expect: { headline: null, hint: null },
  },
  {
    description: 'a nested brace list that closes is sound',
    given: { partition: ['route={src/a/**,src/{b,c}/**}'] },
    expect: { headline: null, hint: null },
  },
  {
    description: 'a value with no = proposes the slug of its last literal dir',
    given: { partition: ['src/domain.operations/review/**'] },
    expect: {
      headline: "--partition 'src/domain.operations/review/**' does not parse",
      hint: "fix: --partition 'review=src/domain.operations/review/**'",
    },
  },
  {
    description: 'a slugless glob of a file stem proposes the stem as slug',
    given: { partition: ['blackbox/driver.route.*'] },
    expect: {
      headline: "--partition 'blackbox/driver.route.*' does not parse",
      hint: "fix: --partition 'driver.route=blackbox/driver.route.*'",
    },
  },
  {
    description: 'a slugless glob with no literal dir proposes a placeholder',
    given: { partition: ['**/*.ts'] },
    expect: {
      headline: "--partition '**/*.ts' does not parse",
      hint: "fix: --partition '<slug>=**/*.ts'",
    },
  },
  {
    description: 'a slug with capitals proposes it lowercased',
    given: { partition: ['Review=src/**'] },
    expect: {
      headline: "the slug 'Review' must be lowercase",
      hint: "fix: --partition 'review=src/**'",
    },
  },
  {
    description: 'a slug with spaces proposes it hyphenated',
    given: { partition: ['my route=src/route/**'] },
    expect: {
      headline: "the slug 'my route' must be lowercase",
      hint: "fix: --partition 'my-route=src/route/**'",
    },
  },
  {
    description: 'an empty slug proposes one from its globs',
    given: { partition: ['=src/route/**'] },
    expect: {
      headline: "the slug '' must be lowercase",
      hint: "fix: --partition 'route=src/route/**'",
    },
  },
  {
    description: "an append with '+=' proposes the repeated-slug form",
    given: { partition: ['route+=blackbox/driver.route.*'] },
    expect: {
      headline: "there is no '+='",
      hint: "fix: --partition 'route=blackbox/driver.route.*'",
    },
  },
  {
    description: 'a slug with no globs does not parse',
    given: { partition: ['review={ , }'] },
    expect: {
      headline: "--partition 'review={ , }' does not parse; it names no glob",
      hint: 'e.g. --partition',
    },
  },
  {
    description:
      '🔴 an unclosed outer brace list proposes the bare comma list, no brace',
    given: { partition: ['review={src/review/**,src/domain.objects/**'] },
    expect: {
      headline: "--partition 'review' has unbalanced braces",
      hint: "fix: --partition 'review=src/review/**,src/domain.objects/**'",
    },
  },
  {
    description:
      'an unclosed inner brace list proposes it closed, the outer unwrapped',
    given: {
      partition: ['route={src/a/**,blackbox/driver.route.{drive,set.*'],
    },
    expect: {
      headline: "--partition 'route' has unbalanced braces",
      hint: "fix: --partition 'route=src/a/**,blackbox/driver.route.{drive,set.*}'",
    },
  },
  {
    description: 'a stray close brace proposes it dropped',
    given: { partition: ['route=src/a/**},blackbox/x.*'] },
    expect: {
      headline: "--partition 'route' has unbalanced braces",
      hint: "fix: --partition 'route=src/a/**,blackbox/x.*'",
    },
  },
];

describe('getOneReviewPartitionsFault', () => {
  given('[case1] a set of --partition values', () => {
    when('[t0] each is checked', () => {
      TEST_CASES.map((thisCase) =>
        then(thisCase.description, () => {
          const fault = getOneReviewPartitionsFault(thisCase.given);
          if (thisCase.expect.headline === null)
            return expect(fault).toEqual(null);
          expect(fault?.headline).toContain(thisCase.expect.headline);
          expect(fault?.hint).toContain(thisCase.expect.hint);
        }),
      );
    });
  });

  given('[case2] every malformed form', () => {
    when('[t0] each fault is rendered', () => {
      then('each headline and its printed fix match the snapshot', () => {
        const rendered = TEST_CASES.filter(
          (thisCase) => thisCase.expect.headline !== null,
        ).map((thisCase) => ({
          given: thisCase.given.partition,
          fault: getOneReviewPartitionsFault(thisCase.given),
        }));
        expect(rendered.every((one) => one.fault !== null)).toBe(true);
        expect(rendered).toMatchSnapshot();
      });
    });
  });
});
