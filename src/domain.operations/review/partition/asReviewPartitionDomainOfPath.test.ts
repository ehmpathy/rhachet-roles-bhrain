import { given, then, when } from 'test-fns';

import { asReviewPartitionDomainOfPath } from './asReviewPartitionDomainOfPath';

const TEST_CASES = [
  {
    description: 'a root file is config, claimed by its own path',
    given: 'biome.jsonc',
    expect: { slug: 'config', glob: 'biome.jsonc', wordsOfDir: null },
  },
  {
    description: 'a brief is briefs, claimed at its briefs dir',
    given: '.agent/repo=.this/role=any/briefs/rule.require.x.md',
    expect: {
      slug: 'briefs',
      glob: '.agent/repo=.this/role=any/briefs/**',
      wordsOfDir: null,
    },
  },
  {
    description: 'a dot dir with a domain word names the domain',
    given: '.agent/repo=.this/role=any/boot.yml',
    expect: { slug: 'agent', glob: '.agent/**', wordsOfDir: ['agent'] },
  },
  {
    description:
      'the first dir beneath src with a domain word names the domain',
    given: 'src/domain.roles/driver/readme.md',
    expect: {
      slug: 'roles',
      glob: 'src/domain.roles/**',
      wordsOfDir: ['roles'],
    },
  },
  {
    description: 'tier dirs with no domain word are the domain, two deep',
    given: 'src/contract/cli/route.ts',
    expect: {
      slug: 'contract-cli',
      glob: 'src/contract/cli/**',
      wordsOfDir: null,
    },
  },
  {
    description: '🔴 a test-layer dir is never the domain; the stem is',
    given: 'blackbox/keyrack.unlock.acceptance.test.ts',
    expect: {
      slug: 'keyrack',
      glob: 'blackbox/{,__snapshots__/}keyrack.*',
      wordsOfDir: null,
    },
  },
  {
    description:
      '🔴 a test-layer snapshot rides its test domain, never a horizontal __snapshots__/**',
    given: 'blackbox/__snapshots__/keyrack.unlock.acceptance.test.ts.snap',
    expect: {
      slug: 'keyrack',
      glob: 'blackbox/{,__snapshots__/}keyrack.*',
      wordsOfDir: null,
    },
  },
  {
    description: '🔴 a derived slug never collides with rest',
    given: 'src/rest/a.ts',
    expect: { slug: 'rest-domain', glob: 'src/rest/**', wordsOfDir: ['rest'] },
  },
];

describe('asReviewPartitionDomainOfPath', () => {
  given('[case1] an unclaimed path no declared partition fits', () => {
    when('[t0] its domain is derived', () => {
      TEST_CASES.map((thisCase) =>
        then(thisCase.description, () => {
          expect(
            asReviewPartitionDomainOfPath({ path: thisCase.given }),
          ).toEqual(thisCase.expect);
        }),
      );
    });
  });
});
