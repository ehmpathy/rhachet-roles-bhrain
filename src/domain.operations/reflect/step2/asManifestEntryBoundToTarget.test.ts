import { given, then, when } from 'test-fns';

import type { ReviewerReflectManifestEntry } from '@src/domain.objects/Reviewer/ReviewerReflectManifest';
import { ReviewerReflectManifestOperation } from '@src/domain.objects/Reviewer/ReviewerReflectManifestOperation';

import { asManifestEntryBoundToTarget } from './asManifestEntryBoundToTarget';
import { asRulePathSet } from './asRulePathSet';
import { asRulesByName } from './asRulesByName';

/**
 * .what = the prior rules every case binds against
 * .why = one shared target corpus, so each case varies only its entry
 */
const TARGET_RULE_PATHS = [
  'practices/code.prod/rule.require.arrow-functions.md',
  'practices/code.test/rule.forbid.mocks.md',
];

const TEST_CASES: {
  description: string;
  given: { entry: ReviewerReflectManifestEntry };
  expect: {
    entry: ReviewerReflectManifestEntry;
    demotion: { path: string; targetPathStated: string | null } | null;
  };
}[] = [
  {
    description: '[case1] a non-update entry is kept as-is',
    given: {
      entry: {
        path: 'rule.forbid.gerunds.md',
        operation: ReviewerReflectManifestOperation.SET_CREATE,
        syncPath: 'practices/rule.forbid.gerunds.md',
      },
    },
    expect: {
      entry: {
        path: 'rule.forbid.gerunds.md',
        operation: ReviewerReflectManifestOperation.SET_CREATE,
        syncPath: 'practices/rule.forbid.gerunds.md',
      },
      demotion: null,
    },
  },
  {
    description:
      '[case2] an update with a stated targetPath of a real rule is kept',
    given: {
      entry: {
        path: 'rule.forbid.mocks.md',
        operation: ReviewerReflectManifestOperation.SET_UPDATE,
        syncPath: 'practices/code.test/rule.forbid.mocks.md',
        targetPath: 'practices//code.test/rule.forbid.mocks.md',
      },
    },
    expect: {
      entry: {
        path: 'rule.forbid.mocks.md',
        operation: ReviewerReflectManifestOperation.SET_UPDATE,
        syncPath: 'practices/code.test/rule.forbid.mocks.md',
        targetPath: 'practices//code.test/rule.forbid.mocks.md',
      },
      demotion: null,
    },
  },
  {
    description:
      '[case3] an update with no usable targetPath is bound to a prior rule by name',
    given: {
      entry: {
        path: 'rule.require.arrow_functions.md',
        operation: ReviewerReflectManifestOperation.SET_UPDATE,
        syncPath: 'practices/code.prod/rule.require.arrow-functions.md',
        targetPath: 'practices/',
      },
    },
    expect: {
      entry: {
        path: 'rule.require.arrow_functions.md',
        operation: ReviewerReflectManifestOperation.SET_UPDATE,
        syncPath: 'practices/code.prod/rule.require.arrow-functions.md',
        targetPath: 'practices/code.prod/rule.require.arrow-functions.md',
      },
      demotion: null,
    },
  },
  {
    description:
      '[case4] an update with no prior rule to merge into is demoted to a create',
    given: {
      entry: {
        path: 'rule.prefer.short-sentences.md',
        operation: ReviewerReflectManifestOperation.SET_UPDATE,
        syncPath: 'practices/rule.prefer.short-sentences.md',
        targetPath: 'practices/rule.prefer.typo.md',
      },
    },
    expect: {
      entry: {
        path: 'rule.prefer.short-sentences.md',
        operation: ReviewerReflectManifestOperation.SET_CREATE,
        syncPath: 'practices/rule.prefer.short-sentences.md',
        targetPath: undefined,
      },
      demotion: {
        path: 'rule.prefer.short-sentences.md',
        targetPathStated: 'practices/rule.prefer.typo.md',
      },
    },
  },
];

describe('asManifestEntryBoundToTarget', () => {
  const targetRulePaths = asRulePathSet({ rulePaths: TARGET_RULE_PATHS });
  const targetRulesByName = asRulesByName({ rulePaths: TARGET_RULE_PATHS });

  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the entry is bound against the target corpus', () => {
        then('the entry and demotion match the expected bind', () => {
          const result = asManifestEntryBoundToTarget({
            entry: thisCase.given.entry,
            targetRulePaths,
            targetRulesByName,
          });
          expect(result.entry).toEqual(thisCase.expect.entry);
          expect(result.demotion).toEqual(thisCase.expect.demotion);
        });
      });
    }),
  );
});
