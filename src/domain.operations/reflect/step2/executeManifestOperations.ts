import * as fs from 'fs/promises';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';

import type {
  ReviewerReflectManifest,
  ReviewerReflectManifestEntry,
} from '@src/domain.objects/Reviewer/ReviewerReflectManifest';
import { ReviewerReflectManifestOperation } from '@src/domain.objects/Reviewer/ReviewerReflectManifestOperation';

import { enumFilesFromGlob } from '../../review/enumFilesFromGlob';

/**
 * .what = extracts rule name from a file path
 * .why = enables matching rules by name across different directory structures
 *
 * .note = handles paths like "practices/rule.require.arrow-functions.md" and
 *         normalizes underscores to hyphens for fuzzy matching
 */
const extractRuleName = (filePath: string): string => {
  const basename = path.basename(filePath);
  // normalize underscores to hyphens for matching
  return basename.replace(/_/g, '-').toLowerCase();
};

/**
 * .what = infers missing targetPath for SET_UPDATE operations
 * .why = models may identify matching rules but omit the targetPath field
 *
 * .note = matches by normalized rule name (ignoring underscores vs hyphens)
 */
const inferMissingTargetPaths = async (
  entries: ReviewerReflectManifestEntry[],
  targetDir: string,
): Promise<ReviewerReflectManifestEntry[]> => {
  // get all target rules (excluding .draft directory)
  const allTargetRules = await enumFilesFromGlob({
    glob: ['**/rule.*.md'],
    cwd: targetDir,
  });
  const targetRules = allTargetRules.filter((f) => !f.startsWith('.draft/'));

  // create normalized lookup map
  const targetRulesByName = new Map<string, string>();
  for (const rule of targetRules) {
    const normalized = extractRuleName(rule);
    targetRulesByName.set(normalized, rule);
  }

  return entries.map((entry) => {
    // only infer for SET_UPDATE with missing targetPath
    if (
      entry.operation !== ReviewerReflectManifestOperation.SET_UPDATE ||
      entry.targetPath
    ) {
      return entry;
    }

    // try to find a matching target rule by normalized name
    const pureName = extractRuleName(entry.path);
    const matchedTarget = targetRulesByName.get(pureName);

    if (matchedTarget) {
      return { ...entry, targetPath: matchedTarget };
    }

    return entry;
  });
};

/**
 * .what = validates manifest entries have required fields per operation type
 * .why = fail-fast on malformed model output before executing operations
 */
const validateManifestEntries = (entries: ReviewerReflectManifestEntry[]) => {
  const errors: string[] = [];

  for (const entry of entries) {
    switch (entry.operation) {
      case ReviewerReflectManifestOperation.OMIT:
        if (!entry.reason)
          errors.push(`OMIT entry missing 'reason': ${entry.path}`);
        break;
      case ReviewerReflectManifestOperation.SET_CREATE:
        if (!entry.syncPath)
          errors.push(`SET_CREATE entry missing 'syncPath': ${entry.path}`);
        break;
      case ReviewerReflectManifestOperation.SET_UPDATE:
        if (!entry.targetPath)
          errors.push(`SET_UPDATE entry missing 'targetPath': ${entry.path}`);
        if (!entry.syncPath)
          errors.push(`SET_UPDATE entry missing 'syncPath': ${entry.path}`);
        break;
      case ReviewerReflectManifestOperation.SET_APPEND:
        if (!entry.syncPath)
          errors.push(`SET_APPEND entry missing 'syncPath': ${entry.path}`);
        break;
    }
  }

  if (errors.length > 0)
    throw new UnexpectedCodePathError(
      'manifest entries have missing required fields',
      { errors },
    );
};

/**
 * .what = executes manifest operations to create sync directory
 * .why = applies blend plan from brain to create final output
 */
export const executeManifestOperations = async (input: {
  manifest: ReviewerReflectManifest;
  pureDir: string;
  syncDir: string;
  targetDir: string;
  log: Pick<Console, 'log'>;
}): Promise<{
  created: number;
  updated: number;
  appended: number;
  omitted: number;
}> => {
  // infer missing targetPath for SET_UPDATE operations before validation
  const entriesWithInferredPaths = await inferMissingTargetPaths(
    input.manifest.pureRules,
    input.targetDir,
  );

  // validate all entries upfront - fail fast on malformed model output
  validateManifestEntries(entriesWithInferredPaths);

  let created = 0;
  let updated = 0;
  let appended = 0;
  let omitted = 0;

  for (const entry of entriesWithInferredPaths) {
    const purePath = path.join(input.pureDir, entry.path);

    switch (entry.operation) {
      case ReviewerReflectManifestOperation.OMIT: {
        input.log.log(`   └─ OMIT: ${entry.path} (${entry.reason})`);
        omitted++;
        break;
      }

      case ReviewerReflectManifestOperation.SET_CREATE: {
        // copy pure rule to sync with adapted path
        const syncPath = path.join(input.syncDir, entry.syncPath!);
        await fs.mkdir(path.dirname(syncPath), { recursive: true });
        await fs.copyFile(purePath, syncPath);
        input.log.log(`   └─ CREATE: ${entry.syncPath}`);
        created++;
        break;
      }

      case ReviewerReflectManifestOperation.SET_UPDATE: {
        // merge pure rule with target rule
        const targetRulePath = path.join(input.targetDir, entry.targetPath!);
        const syncPath = path.join(input.syncDir, entry.syncPath!);

        // read both files
        const pureContent = await fs.readFile(purePath, 'utf-8');
        const targetContent = await fs.readFile(targetRulePath, 'utf-8');

        // merge: append pure content to target content
        const mergedContent = mergeRuleContent({
          target: targetContent,
          pure: pureContent,
        });

        await fs.mkdir(path.dirname(syncPath), { recursive: true });
        await fs.writeFile(syncPath, mergedContent, 'utf-8');
        input.log.log(`   └─ UPDATE: ${entry.syncPath}`);
        updated++;
        break;
      }

      case ReviewerReflectManifestOperation.SET_APPEND: {
        // add as support document next to existing rule
        const syncPath = path.join(input.syncDir, entry.syncPath!);
        await fs.mkdir(path.dirname(syncPath), { recursive: true });
        await fs.copyFile(purePath, syncPath);
        input.log.log(`   └─ APPEND: ${entry.syncPath}`);
        appended++;
        break;
      }
    }
  }

  return { created, updated, appended, omitted };
};

/**
 * .what = merges pure rule content into target rule
 * .why = combines insights without losing target content
 */
const mergeRuleContent = (input: { target: string; pure: string }): string => {
  // find the # deets section in target
  const deetsMatch = input.target.match(/(^|\n)# deets/);

  if (deetsMatch) {
    // extract new citations from pure rule
    const citationsMatch = input.pure.match(
      /## \.citations[\s\S]*?(?=\n## |$)/,
    );
    if (citationsMatch) {
      // append new citations to target deets section
      return input.target.trimEnd() + '\n\n' + citationsMatch[0].trim() + '\n';
    }
  }

  // fallback: append entire pure content
  return (
    input.target.trimEnd() + '\n\n---\n\n# additional insights\n\n' + input.pure
  );
};
