import * as path from 'path';

import type { ReviewerReflectManifestEntry } from '@src/domain.objects/Reviewer/ReviewerReflectManifest';
import { ReviewerReflectManifestOperation } from '@src/domain.objects/Reviewer/ReviewerReflectManifestOperation';

import { asRuleName } from './asRuleName';

/**
 * .what = binds ONE manifest entry to a target rule that exists, or demotes it to SET_CREATE
 * .why = an update merges INTO a prior rule. with no prior rule to merge into, the proposal
 *        is a new rule — so it lands as a create, beside a record of the demotion
 *
 * .note = four outcomes, in order:
 *         - not a SET_UPDATE → kept as-is
 *         - a stated targetPath that names a real rule file → kept as-is
 *         - a prior rule of the same name → bound to it
 *         - else → demoted to SET_CREATE, with the demotion recorded
 */
export const asManifestEntryBoundToTarget = (input: {
  entry: ReviewerReflectManifestEntry;
  targetRulePaths: Set<string>;
  targetRulesByName: Map<string, string>;
}): {
  entry: ReviewerReflectManifestEntry;
  demotion: { path: string; targetPathStated: string | null } | null;
} => {
  const { entry } = input;

  // only SET_UPDATE needs a target rule
  if (entry.operation !== ReviewerReflectManifestOperation.SET_UPDATE)
    return { entry, demotion: null };

  // keep a stated targetPath that names a real rule file
  if (
    entry.targetPath &&
    input.targetRulePaths.has(path.join(entry.targetPath))
  )
    return { entry, demotion: null };

  // infer the target rule by name
  const matchedTarget = input.targetRulesByName.get(
    asRuleName({ rulePath: entry.path }),
  );
  if (matchedTarget)
    return { entry: { ...entry, targetPath: matchedTarget }, demotion: null };

  // no prior rule to merge into: the proposal is a new rule
  return {
    entry: {
      ...entry,
      operation: ReviewerReflectManifestOperation.SET_CREATE,
      targetPath: undefined,
    },
    demotion: {
      path: entry.path,
      targetPathStated: entry.targetPath ?? null,
    },
  };
};
