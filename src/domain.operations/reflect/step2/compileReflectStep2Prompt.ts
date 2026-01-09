import * as fs from 'fs/promises';
import * as path from 'path';

import { enumFilesFromGlob } from '@src/domain.operations/review/enumFilesFromGlob';

/**
 * .what = compiles step 2 brain prompt for rule blend
 * .why = instructs brain to create manifest.json for blend operations
 *
 * .note = when rapid=true (haiku), SET_UPDATE is disabled because haiku cannot
 *         reliably provide required fields. this means duplicates may be produced
 *         when prior rules exist. use rapid=false (sonnet) for proper deduplication.
 */
export const compileReflectStep2Prompt = async (input: {
  targetDir: string;
  draftDir: string;
  pureDir: string;
  mode: 'soft' | 'hard';
  rapid?: boolean;
}): Promise<{ prompt: string; tokenEstimate: number }> => {
  const rapid = input.rapid ?? false;
  const sections: string[] = [];

  // enumerate prior rules in target (excluding .draft directory which contains pure proposals)
  const allRuleFiles = await enumFilesFromGlob({
    glob: ['**/rule.*.md'],
    cwd: input.targetDir,
  });
  const priorRuleFiles = allRuleFiles.filter((f) => !f.startsWith('.draft/'));

  // enumerate pure proposals
  const pureProposalFiles = await enumFilesFromGlob({
    glob: ['*.md'],
    cwd: input.pureDir,
  });

  // objective section
  sections.push(`# objective

blend pure rule proposals with target rules.

analyze each pure proposal against target rules and create a manifest.json
specifying the planned operation for each proposal.
`);

  // target rules section (numbered for reference)
  sections.push(`# target rules

${priorRuleFiles.length === 0 ? 'no rules in target directory' : priorRuleFiles.map((f, i) => `[${i + 1}] ${f}`).join('\n')}
`);

  // pure proposals section
  sections.push(`# pure proposals

${pureProposalFiles.length === 0 ? 'no pure proposals found (step 1 may not have produced rules)' : pureProposalFiles.map((f) => `- ${f}`).join('\n')}
`);

  // include content in hard mode
  if (input.mode === 'hard') {
    // target rule content
    if (priorRuleFiles.length > 0) {
      sections.push('# target rule content\n');
      for (const file of priorRuleFiles) {
        const content = await fs.readFile(
          path.join(input.targetDir, file),
          'utf-8',
        );
        sections.push(`## ${file}\n\n\`\`\`\n${content}\n\`\`\`\n`);
      }
    }

    // pure proposal content
    sections.push('# pure proposal content\n');
    for (const file of pureProposalFiles) {
      const content = await fs.readFile(
        path.join(input.pureDir, file),
        'utf-8',
      );
      sections.push(`## ${file}\n\n\`\`\`\n${content}\n\`\`\`\n`);
    }
  }

  // instructions section - different for rapid vs normal mode
  if (rapid) {
    // rapid mode (haiku): simplified operations, no SET_UPDATE
    // haiku cannot reliably provide required fields for SET_UPDATE
    sections.push(`# instructions

## operations

1. **SET_CREATE** - create new rule in target
   - use for: all new rules
   - requires: path, operation, syncPath

2. **OMIT** - skip this proposal
   - use for: exact duplicates (identical content to a target rule)
   - requires: path, operation, reason

3. **SET_APPEND** - add supplementary material
   - use for: demos, references, examples (not rules)
   - requires: path, operation, syncPath

## decision process

for each pure proposal:
1. is it an exact duplicate (identical content)? → OMIT
2. is it supplementary material? → SET_APPEND
3. otherwise → SET_CREATE

## output

use the Write tool to write manifest to: ${input.draftDir}/manifest.json

example:
\`\`\`json
{
  "timestamp": "2025-01-01T00:00:00.000Z",
  "pureRules": [
    {
      "path": "rule.forbid.example.md",
      "operation": "SET_CREATE",
      "syncPath": "practices/code.prod/rule.forbid.example.md"
    },
    {
      "path": "rule.require.tests.md",
      "operation": "SET_CREATE",
      "syncPath": "practices/code.test/rule.require.tests.md"
    }
  ]
}
\`\`\`

CRITICAL: after writing the manifest file, respond with ONLY this JSON and nothing else:
\`{ "written": true }\`

do NOT include any explanation, analysis, or markdown. your response must be exactly: { "written": true }
`);
  } else {
    // normal mode (sonnet): full operations including SET_UPDATE
    sections.push(`# instructions

## operations

1. **SET_CREATE** - create new rule in target
   - use for: new rules, rules on different topics than existing target rules
   - requires: path, operation, syncPath

2. **SET_UPDATE** - merge proposal with existing target rule
   - use when: proposal covers the SAME topic as an existing target rule (e.g., both about arrow functions)
   - requires: path, operation, targetPath, syncPath (ALL FOUR FIELDS ARE MANDATORY)
   - **targetPath is REQUIRED** - must be the EXACT path from the numbered target rules list above
   - example: if updating rule [1] from target list, set targetPath = "practices/rule.require.arrow-functions.md"
   - WARNING: omitting targetPath will cause the operation to FAIL

3. **OMIT** - skip this proposal
   - use for: exact duplicates (identical content)
   - requires: path, operation, reason

4. **SET_APPEND** - add supplementary material
   - use for: demos, references, examples (not rules)
   - requires: path, operation, syncPath

## decision process

for each pure proposal:
1. does proposal cover the SAME topic as a target rule? → SET_UPDATE
   - MUST include targetPath copied from the "# target rules" list above
   - e.g., "rule.require.arrow_functions.md" matches "[1] practices/rule.require.arrow-functions.md" → targetPath = "practices/rule.require.arrow-functions.md"
2. is it an exact duplicate (identical content)? → OMIT
3. is it supplementary material? → SET_APPEND
4. otherwise → SET_CREATE

## output

use the Write tool to write manifest to: ${input.draftDir}/manifest.json

example:
\`\`\`json
{
  "timestamp": "2025-01-01T00:00:00.000Z",
  "pureRules": [
    {
      "path": "rule.forbid.example.md",
      "operation": "SET_CREATE",
      "syncPath": "practices/code.prod/rule.forbid.example.md"
    },
    {
      "path": "rule.require.arrow-functions.md",
      "operation": "SET_UPDATE",
      "targetPath": "practices/rule.require.arrow-functions.md",
      "syncPath": "practices/rule.require.arrow-functions.md"
    }
  ]
}
\`\`\`

CRITICAL: after writing the manifest file, respond with ONLY this JSON and nothing else:
\`{ "written": true }\`

do NOT include any explanation, analysis, or markdown. your response must be exactly: { "written": true }
`);
  }

  const prompt = sections.join('\n');

  // estimate tokens (rough: 4 chars per token)
  const tokenEstimate = Math.ceil(prompt.length / 4);

  return { prompt, tokenEstimate };
};
