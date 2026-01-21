import { BadRequestError } from 'helpful-errors';

import { estimateTokenCount } from './estimateTokenCount';

/**
 * .what = compiles the review prompt from rules and target files
 * .why = prepares the prompt for brain invocation with token safeguards
 */
export const compileReviewPrompt = (input: {
  rules: Array<{ path: string; content: string }>;
  targets: Array<{ path: string; content: string }>;
  mode: 'pull' | 'push';
  contextWindowSize?: number;
}): {
  prompt: string;
  tokenEstimate: number;
  contextWindowPercent: number;
  costEstimate: number;
  warnings: string[];
} => {
  // default context window size for claude
  const contextWindow = input.contextWindowSize ?? 200000;
  const warnings: string[] = [];

  // build rules section (always include content for rules)
  const rulesSection = input.rules
    .map((rule) => `### ${rule.path}\n\n${rule.content}`)
    .join('\n\n---\n\n');

  // build target section based on mode
  const targetSection = (() => {
    if (input.mode === 'pull') {
      // pull mode: paths only, instruct brain to open files
      const pathList = input.targets.map((t) => `- ${t.path}`).join('\n');
      return `the following files are in scope for review. please open and read them as needed:\n\n${pathList}`;
    }

    // push mode: inject contents
    return input.targets
      .map(
        (target) => `### ${target.path}\n\n\`\`\`\n${target.content}\n\`\`\``,
      )
      .join('\n\n---\n\n');
  })();

  // build full prompt
  const prompt = `# review task

you are a reviewer. apply the rules below to the target files.

## rules

<rules>
${rulesSection}
</rules>

## target

<target>
${targetSection}
</target>

## output format

IMPORTANT: output your review as text directly. do not use any tools to write files. your final response must be the JSON object below, printed as plain text.

\`\`\`json
{
  "done": true,
  "blockers": [
    {
      "rule": "path/to/rule.md",
      "title": "short title for the issue",
      "description": "detailed multiline explanation of the issue.\\ninclude context about why this violates the rule.\\nbe specific about what needs to change.",
      "file": "path/to/file.ts",
      "line": 42
    }
  ],
  "nitpicks": [
    {
      "rule": "path/to/rule.md",
      "title": "short title for the issue",
      "description": "detailed multiline explanation of the issue.\\ninclude context about why this violates the rule.\\nbe specific about what needs to change.",
      "file": "path/to/file.ts",
      "line": 42
    }
  ]
}
\`\`\`

if no issues found, output: \`{"done": true, "blockers": [], "nitpicks": []}\`
`;

  // estimate tokens
  const tokenEstimate = estimateTokenCount({ content: prompt });
  const contextWindowPercent = (tokenEstimate / contextWindow) * 100;

  // check thresholds (only in push mode - pull mode is inherently lighter)
  if (input.mode === 'push') {
    // failfast if >75%
    if (contextWindowPercent > 75) {
      throw new BadRequestError(
        `prompt exceeds 75% of context window (${contextWindowPercent.toFixed(1)}% of ${contextWindow} tokens). ` +
          `reduce scope or use --pull mode to avoid quality degradation.`,
        { tokenEstimate, contextWindowPercent, contextWindow },
      );
    }

    // warn if >60%
    if (contextWindowPercent > 60) {
      warnings.push(
        `potential quality degradation: prompt uses ${contextWindowPercent.toFixed(1)}% of context window`,
      );
    }
  }

  // estimate cost (claude: ~$3/1M input tokens, ~$15/1M output tokens)
  // assume output is ~10% of input for reviews
  const inputCost = (tokenEstimate / 1_000_000) * 3;
  const outputCost = ((tokenEstimate * 0.1) / 1_000_000) * 15;
  const costEstimate = Math.round((inputCost + outputCost) * 1000) / 1000;

  return {
    prompt,
    tokenEstimate,
    contextWindowPercent: Math.round(contextWindowPercent * 10) / 10,
    costEstimate,
    warnings,
  };
};
