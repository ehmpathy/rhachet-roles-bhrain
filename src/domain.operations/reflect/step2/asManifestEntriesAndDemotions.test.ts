import { given, then, when } from 'test-fns';

import type { ReviewerReflectManifestEntry } from '@src/domain.objects/Reviewer/ReviewerReflectManifest';
import { ReviewerReflectManifestOperation } from '@src/domain.objects/Reviewer/ReviewerReflectManifestOperation';

import { asManifestEntriesAndDemotions } from './asManifestEntriesAndDemotions';

const ENTRY_CREATE: ReviewerReflectManifestEntry = {
  path: 'rule.forbid.gerunds.md',
  operation: ReviewerReflectManifestOperation.SET_CREATE,
  syncPath: 'practices/rule.forbid.gerunds.md',
};
const ENTRY_UPDATE: ReviewerReflectManifestEntry = {
  path: 'rule.forbid.mocks.md',
  operation: ReviewerReflectManifestOperation.SET_UPDATE,
  syncPath: 'practices/rule.forbid.mocks.md',
  targetPath: 'practices/rule.forbid.mocks.md',
};
const DEMOTION = { path: 'rule.forbid.mocks.md', targetPathStated: 'gone.md' };

const TEST_CASES: {
  description: string;
  given: Parameters<typeof asManifestEntriesAndDemotions>[0];
  expect: ReturnType<typeof asManifestEntriesAndDemotions>;
}[] = [
  {
    description: '[case1] no bound entries',
    given: { bound: [] },
    expect: { entries: [], demotions: [] },
  },
  {
    description: '[case2] no entry carries a demotion',
    given: {
      bound: [
        { entry: ENTRY_CREATE, demotion: null },
        { entry: ENTRY_UPDATE, demotion: null },
      ],
    },
    expect: { entries: [ENTRY_CREATE, ENTRY_UPDATE], demotions: [] },
  },
  {
    description: '[case3] one entry carries a demotion — every entry is kept',
    given: {
      bound: [
        { entry: ENTRY_CREATE, demotion: null },
        { entry: ENTRY_UPDATE, demotion: DEMOTION },
      ],
    },
    expect: { entries: [ENTRY_CREATE, ENTRY_UPDATE], demotions: [DEMOTION] },
  },
  {
    description:
      '[case4] a demotion with no stated targetPath is still reported',
    given: {
      bound: [
        {
          entry: ENTRY_UPDATE,
          demotion: { path: 'rule.forbid.mocks.md', targetPathStated: null },
        },
      ],
    },
    expect: {
      entries: [ENTRY_UPDATE],
      demotions: [{ path: 'rule.forbid.mocks.md', targetPathStated: null }],
    },
  },
];

describe('asManifestEntriesAndDemotions', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the bound entries are split', () => {
        then(
          'the entries keep their order and each demotion is reported',
          () => {
            expect(asManifestEntriesAndDemotions(thisCase.given)).toEqual(
              thisCase.expect,
            );
          },
        );
      });
    }),
  );
});
