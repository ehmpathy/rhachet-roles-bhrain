import * as fs from 'fs/promises';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';

import type {
  ReviewerReflectManifest,
  ReviewerReflectManifestEntry,
} from '@src/domain.objects/Reviewer/ReviewerReflectManifest';
import { ReviewerReflectManifestOperation } from '@src/domain.objects/Reviewer/ReviewerReflectManifestOperation';
// a sanctioned exposure, declared in src/domain.operations/review/.readme.md
import { enumFilesFromGlob } from '@src/domain.operations/review/enumFilesFromGlob';

import { asManifestEntriesAndDemotions } from './asManifestEntriesAndDemotions';
import { asManifestEntryBoundToTarget } from './asManifestEntryBoundToTarget';
import { asRulePathSet } from './asRulePathSet';
import { asRulePathsOutsideDraft } from './asRulePathsOutsideDraft';
import { asRulesByName } from './asRulesByName';

/**
 * .what = checks whether a file is present on disk
 * .why = lets an UPDATE find that its target rule is absent before it reads the path
 */
const isFileFound = async (input: { path: string }): Promise<boolean> =>
  fs
    .access(input.path)
    .then(() => true)
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return false;
      throw error;
    });

/**
 * .what = binds each SET_UPDATE to a target rule that exists, or demotes it to SET_CREATE
 * .why = an update merges INTO a prior rule. models may omit the targetPath, name a path
 *        that is not a rule file (a directory, a typo), or propose an update against a
 *        target that holds no such rule at all. with no prior rule to merge into, the
 *        proposal is a new rule — so it lands as a create, never as a crash that drops
 *        every other proposal in the manifest
 *
 * .note = a stated targetPath wins when it names a real rule file; else the target is
 *         inferred by rule name (underscores vs hyphens ignored); else demoted
 * .note = it reports each demotion as data and writes no log; the caller owns the console
 */
const getAllEntriesWithUpdateTargets = async (input: {
  entries: ReviewerReflectManifestEntry[];
  targetDir: string;
}): Promise<{
  entries: ReviewerReflectManifestEntry[];
  demotions: { path: string; targetPathStated: string | null }[];
}> => {
  // get all target rules (excluding .draft directory)
  const allTargetRules = await enumFilesFromGlob({
    glob: ['**/rule.*.md'],
    cwd: input.targetDir,
  });
  const targetRules = asRulePathsOutsideDraft({ rulePaths: allTargetRules });

  // the two lookups a bind reads: by exact path, and by rule name
  const targetRulePaths = asRulePathSet({ rulePaths: targetRules });
  const targetRulesByName = asRulesByName({ rulePaths: targetRules });

  // bind each entry; a demotion is recorded beside the entry it demoted, null where none
  const bound = input.entries.map((entry) =>
    asManifestEntryBoundToTarget({ entry, targetRulePaths, targetRulesByName }),
  );

  // split the bound entries from the demotions among them
  return asManifestEntriesAndDemotions({ bound });
};

/**
 * .what = reads the trimmed content of every target rule
 * .why = lets an OMIT prove it is an exact duplicate, the one case the prompt allows it for
 */
const getAllTargetRuleContents = async (input: {
  targetDir: string;
}): Promise<Set<string>> => {
  const allTargetRules = await enumFilesFromGlob({
    glob: ['**/rule.*.md'],
    cwd: input.targetDir,
  });
  const targetRules = asRulePathsOutsideDraft({ rulePaths: allTargetRules });
  const contents = await Promise.all(
    targetRules.map((rule) =>
      fs.readFile(path.join(input.targetDir, rule), 'utf-8'),
    ),
  );
  return new Set(contents.map((content) => content.trim()));
};

/**
 * .what = checks whether an OMIT names a pure rule that no target rule duplicates
 * .why = the prompt allows OMIT only for an exact duplicate. any other OMIT drops a real
 *        proposal, so it is created instead, per the prompt's own "otherwise → SET_CREATE"
 *
 * .note = an OMIT whose pure file is absent stays an OMIT, since there is no content to create
 */
const isOmitWithoutDuplicate = async (input: {
  purePath: string;
  targetRuleContents: Set<string>;
}): Promise<boolean> => {
  const pureFound = await isFileFound({ path: input.purePath });
  if (!pureFound) return false;
  const pureContent = await fs.readFile(input.purePath, 'utf-8');
  return !input.targetRuleContents.has(pureContent.trim());
};

/**
 * .what = validates manifest entries have required fields per operation type
 * .why = fail-fast on malformed model output before executing operations
 */
const validateManifestEntries = (entries: ReviewerReflectManifestEntry[]) => {
  // .note = deliberate mutation, and a SCOPED ZONE: `errors` is born in this call and only
  //         escapes as the thrown error's metadata, once the fold is done
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
  // bind each SET_UPDATE to a real target rule, or demote it to SET_CREATE
  const { entries: entriesWithInferredPaths, demotions } =
    await getAllEntriesWithUpdateTargets({
      entries: input.manifest.pureRules,
      targetDir: input.targetDir,
    });

  // report each demotion, so a reader sees why an update landed as a create
  for (const demotion of demotions)
    input.log.log(
      `   └─ UPDATE→CREATE: ${demotion.path} (no target rule at '${demotion.targetPathStated ?? '(none)'}')`,
    );

  // validate all entries upfront - fail fast on malformed model output
  validateManifestEntries(entriesWithInferredPaths);

  // read target rule contents once, so each OMIT can prove it is an exact duplicate
  const targetRuleContents = await getAllTargetRuleContents({
    targetDir: input.targetDir,
  });

  // .note = deliberate mutation, and a SCOPED ZONE: the four tallies are born in this call
  //         and only their final values escape, in the return below. the loop must run in
  //         order, one file write per entry, so each tally rises beside its side effect
  //         (rule.require.immutable-vars, scoped zone)
  let created = 0;
  let updated = 0;
  let appended = 0;
  let omitted = 0;

  for (const entry of entriesWithInferredPaths) {
    const purePath = path.join(input.pureDir, entry.path);

    switch (entry.operation) {
      case ReviewerReflectManifestOperation.OMIT: {
        // create the pure rule instead, when no target rule duplicates it
        const omitWithoutDuplicate = await isOmitWithoutDuplicate({
          purePath,
          targetRuleContents,
        });
        if (omitWithoutDuplicate) {
          const syncPathRelative = path.join('practices', entry.path);
          const syncPath = path.join(input.syncDir, syncPathRelative);
          await fs.mkdir(path.dirname(syncPath), { recursive: true });
          await fs.copyFile(purePath, syncPath);
          input.log.log(
            `   └─ CREATE: ${syncPathRelative} (OMIT without a duplicate: ${entry.reason})`,
          );
          created++;
          break;
        }

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

        // create the pure rule instead, when the brain names a target the target dir does not hold
        const targetFound = await isFileFound({ path: targetRulePath });
        if (!targetFound) {
          await fs.mkdir(path.dirname(syncPath), { recursive: true });
          await fs.copyFile(purePath, syncPath);
          input.log.log(
            `   └─ CREATE: ${entry.syncPath} (UPDATE target absent: ${entry.targetPath})`,
          );
          created++;
          break;
        }

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
