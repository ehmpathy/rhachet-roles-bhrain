import * as fs from 'fs/promises';
import * as path from 'path';

import { enumFilesFromGlob } from '../../review/enumFilesFromGlob';

/**
 * .what = compiles step 2 brain prompt for rule blend
 * .why = instructs brain to create manifest.json for blend operations
 */
export const compileReflectStep2Prompt = async (input: {
  targetDir: string;
  draftDir: string;
  pureDir: string;
  mode: 'soft' | 'hard';
}): Promise<{
  prompt: string;
  tokenEstimate: number;
}> => {
  const sections: string[] = [];

  // enumerate existing rules in target
  const existingRuleFiles = await enumFilesFromGlob({
    glob: ['**/rule.*.md'],
    cwd: input.targetDir,
  });

  // enumerate pure proposals
  const pureProposalFiles = await enumFilesFromGlob({
    glob: ['*.md'],
    cwd: input.pureDir,
  });

  // objective section
  sections.push(`# objective

blend pure rule proposals with existing rules.

analyze each pure proposal against existing rules and create a manifest.json
specifying the planned operation for each proposal.
`);

  // existing rules section
  sections.push(`# existing rules

${existingRuleFiles.length === 0 ? 'no existing rules in target directory' : existingRuleFiles.map((f) => `- ${f}`).join('\n')}
`);

  // pure proposals section
  sections.push(`# pure proposals

${pureProposalFiles.map((f) => `- ${f}`).join('\n')}
`);

  // include content in hard mode
  if (input.mode === 'hard') {
    // existing rule content
    if (existingRuleFiles.length > 0) {
      sections.push('# existing rule content\n');
      for (const file of existingRuleFiles) {
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

  // instructions section
  sections.push(`# instructions

1. analyze each pure proposal against existing rules
2. determine the operation for each proposal:
   - OMIT: duplicate or not relevant (include reason)
   - SET_CREATE: new rule, adapt path to match target structure
   - SET_UPDATE: merge with existing rule
   - SET_APPEND: add as collocated document with [demo|ref|lesson] suffix

# output format

respond with ONLY the manifest JSON object (no markdown, no explanation):

\`\`\`json
{
  "timestamp": "ISO timestamp",
  "pureRules": [
    {
      "path": "rule.forbid.example.md",
      "operation": "SET_CREATE",
      "syncPath": "practices/code.prod/rule.forbid.example.md"
    },
    {
      "path": "rule.prefer.another.md",
      "operation": "OMIT",
      "reason": "duplicate of existing rule.prefer.similar.md"
    }
  ]
}
\`\`\`

the harness will execute the manifest operations after receiving this JSON.
`);

  const prompt = sections.join('\n');

  // estimate tokens (rough: 4 chars per token)
  const tokenEstimate = Math.ceil(prompt.length / 4);

  return { prompt, tokenEstimate };
};
