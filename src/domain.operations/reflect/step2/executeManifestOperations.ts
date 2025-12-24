import * as fs from 'fs/promises';
import * as path from 'path';

import { ReviewerReflectManifestOperation } from '@src/domain.objects/ManifestOperation';
import type { ReviewerReflectManifest } from '@src/domain.objects/ReflectManifest';

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
  let created = 0;
  let updated = 0;
  let appended = 0;
  let omitted = 0;

  for (const entry of input.manifest.pureRules) {
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
        // merge pure rule with existing rule
        const existingPath = path.join(input.targetDir, entry.existingPath!);
        const syncPath = path.join(input.syncDir, entry.syncPath!);

        // read both files
        const pureContent = await fs.readFile(purePath, 'utf-8');
        const existingContent = await fs.readFile(existingPath, 'utf-8');

        // merge: append pure content to existing
        const mergedContent = mergeRuleContent({
          existing: existingContent,
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
 * .what = merges pure rule content into existing rule
 * .why = combines insights without losing existing content
 */
const mergeRuleContent = (input: {
  existing: string;
  pure: string;
}): string => {
  // find the # deets section in existing
  const deetsMatch = input.existing.match(/(^|\n)# deets/);

  if (deetsMatch) {
    // extract new citations from pure rule
    const citationsMatch = input.pure.match(
      /## \.citations[\s\S]*?(?=\n## |$)/,
    );
    if (citationsMatch) {
      // append new citations to existing deets section
      return (
        input.existing.trimEnd() + '\n\n' + citationsMatch[0].trim() + '\n'
      );
    }
  }

  // fallback: append entire pure content
  return (
    input.existing.trimEnd() +
    '\n\n---\n\n# additional insights\n\n' +
    input.pure
  );
};
