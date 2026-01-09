import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = compiles step 1 brain prompt for rule proposal
 * .why = instructs brain to extract rules from feedback citations
 */
export const compileReflectStep1Prompt = async (input: {
  feedbackFiles: string[];
  citationsMarkdown: string;
  draftDir: string;
  cwd: string;
  mode: 'soft' | 'hard';
}): Promise<{
  prompt: string;
  tokenEstimate: number;
}> => {
  const sections: string[] = [];

  // objective section
  sections.push(`# objective

propose rules from feedback citations.

extract generalized insights from the feedback and propose them as rule files.
do NOT consult any existing rules - propose with fresh perspective.

IMPORTANT: you MUST write rule files using the Write tool. do NOT ask clarifying questions.
if feedback is unclear, skip it - only create rules for clear patterns.
`);

  // citations section
  sections.push(`# citations

${input.citationsMarkdown}
`);

  // feedback content (hard mode only)
  if (input.mode === 'hard') {
    sections.push('# feedback content\n');
    for (const file of input.feedbackFiles) {
      const content = await fs.readFile(path.join(input.cwd, file), 'utf-8');
      sections.push(`## ${file}\n\n\`\`\`\n${content}\n\`\`\`\n`);
    }
  }

  // instructions section
  sections.push(`# instructions

1. analyze the feedback citations${input.mode === 'hard' ? ' and content' : ''}
2. identify patterns and generalizable insights
3. propose rules as \`rule.$directive.$topic.md\` files
4. each rule must include:
   - # tldr section with ## severity, .what summary, .why rationale
   - ---\\n---\\n--- separator
   - # deets section with ## .citations which contain a github url and relevant excerpt
5. directives: forbid (blocker), require (blocker), avoid (nitpick), prefer (nitpick)
6. consolidate multiple feedback citations into single rule where applicable
7. be thorough - include code examples and detailed explanations where helpful

# output

use the Write tool to write each rule file to: ${input.draftDir}/pure/

CRITICAL: after writing all rules, respond with ONLY this JSON and nothing else:
\`\`\`json
{
  "rules": [
    { "name": "rule.forbid.example.md", "content": "..." },
    { "name": "rule.require.other.md", "content": "..." }
  ]
}
\`\`\`

do NOT include any explanation, analysis, or markdown outside the JSON. your entire response must be valid JSON.
`);

  const prompt = sections.join('\n');

  // estimate tokens (rough: 4 chars per token)
  const tokenEstimate = Math.ceil(prompt.length / 4);

  return { prompt, tokenEstimate };
};
