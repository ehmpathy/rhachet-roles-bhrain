import { BadRequestError } from 'helpful-errors';
import { asIsoPriceHuman, type IsoPriceHuman } from 'iso-price';
import { type BrainSpec, calcBrainOutputCost } from 'rhachet/brains';

import { estimateTokenCount } from './estimateTokenCount';

/**
 * .what = compiles the review prompt from rules and target files
 * .why = prepares the prompt for brain invocation with token safeguards
 */
export const compileReviewPrompt = (input: {
  rules: Array<{ path: string; content: string }>;
  refs: Array<{ path: string; content: string }>;
  targets: Array<{ path: string; content: string }>;
  focus: 'pull' | 'push';
  goal: 'exhaustive' | 'representative';
  contextWindowSize: number;
  costSpec: BrainSpec['cost']['cash'];
}): {
  prompt: string;
  tokenEstimate: number;
  contextWindowPercent: number;
  costEstimate: IsoPriceHuman;
  warnings: string[];
} => {
  const contextWindow = input.contextWindowSize;
  const warnings: string[] = [];

  // build rules section (always include content for rules)
  const rulesSection = input.rules
    .map((rule) => `### ${rule.path}\n\n${rule.content}`)
    .join('\n\n---\n\n');

  // build refs section (reference documents for context)
  const refsSection =
    input.refs.length > 0
      ? input.refs
          .map((ref) => `### ${ref.path}\n\n${ref.content}`)
          .join('\n\n---\n\n')
      : null;

  // build target section based on mode
  const targetSection = (() => {
    if (input.focus === 'pull') {
      // pull focus: paths only, instruct brain to open files
      const pathList = input.targets.map((t) => `- ${t.path}`).join('\n');
      return `the following files are in scope for review. please open and read them as needed:\n\n${pathList}`;
    }

    // push focus: inject contents
    return input.targets
      .map(
        (target) => `### ${target.path}\n\n\`\`\`\n${target.content}\n\`\`\``,
      )
      .join('\n\n---\n\n');
  })();

  // build goal instructions
  const goalInstructions = (() => {
    if (input.goal === 'exhaustive') {
      return `## goal: exhaustive

report all the issues found, exhaustively. do not limit the number of issues. every violation of every rule should be documented. if there are many similar issues, collect their locations under one violation. be thorough and comprehensive.`;
    }
    return `## goal: representative

report the most important or representative issues. limit yourself to up to 10 defects. for each defect, list a sample of the locations where the violation occurs. prioritize impact via severity and coverage over completeness.`;
  })();

  // build full prompt
  const prompt = `# review task

you are a reviewer. apply the rules below to the target files.

## CRITICAL INSTRUCTIONS — READ CAREFULLY

1. ONLY review content in the <target> section
2. NEVER flag anything from the <rules> section — rules contain examples of bad patterns for illustration only
3. if you see "bad: X" or "good: Y" in a rule, those are examples to learn from, NOT content to flag
4. the "locations" array must ONLY contain paths from <target>, never from <rules>
5. if you cannot find the violation in <target>, do not report it${refsSection ? '\n6. <refs> section contains reference documents for context — use them to inform your review but do not flag content from refs' : ''}

${goalInstructions}

## rules (FOR REFERENCE ONLY — DO NOT FLAG CONTENT FROM THIS SECTION)

<rules>
${rulesSection}
</rules>
${
  refsSection
    ? `
## refs (REFERENCE DOCUMENTS — USE FOR CONTEXT, DO NOT FLAG)

<refs>
${refsSection}
</refs>
`
    : ''
}
## target (REVIEW THIS SECTION ONLY)

<target>
${targetSection}
</target>

## output format

IMPORTANT: output your review as text directly. do not use any tools to write files. your final response must be the JSON object below, printed as plain text.

note: the "locations" array must contain ONLY paths from the <target> section. never include rule file paths in locations.

\`\`\`json
{
  "done": true,
  "blockers": [
    {
      "rule": "path/to/rule.md (which rule was violated)",
      "title": "short title for the issue",
      "description": "detailed multiline explanation of the issue.\\ninclude context about why this violates the rule.\\nbe specific about what needs to change.",
      "locations": ["path/to/target-file.ts:42 (only target files, never rule files)"],
      "snippet": {
        "lang": "ts",
        "code": "// the exact code from the target file that violates the rule\\nconst x = badPattern();"
      }
    }
  ],
  "nitpicks": [
    {
      "rule": "path/to/rule.md (which rule was violated)",
      "title": "short title for the issue",
      "description": "detailed multiline explanation of the issue.\\ninclude context about why this violates the rule.\\nbe specific about what needs to change.",
      "locations": ["path/to/target-file.ts:42 (only target files, never rule files)"],
      "snippet": {
        "lang": "ts",
        "code": "// the exact code from the target file that violates the rule\\nconst x = badPattern();"
      }
    }
  ]
}
\`\`\`

IMPORTANT: every violation MUST include a "snippet" with the actual code from the target file that violates the rule. copy the exact code so the reader can identify the violation.

if no issues found, output: \`{"done": true, "blockers": [], "nitpicks": []}\`
`;

  // estimate tokens
  const tokenEstimate = estimateTokenCount({ content: prompt });
  const contextWindowPercent = (tokenEstimate / contextWindow) * 100;

  // check thresholds (only in push mode - pull mode is inherently lighter)
  if (input.focus === 'push') {
    // failfast if >75%
    if (contextWindowPercent > 75) {
      throw new BadRequestError(
        `prompt exceeds 75% of context window (${contextWindowPercent.toFixed(1)}% of ${contextWindow} tokens). ` +
          `reduce scope or use --focus pull to avoid quality degradation.`,
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

  // estimate cost via brain spec rates (assume output is ~10% of input for reviews)
  const estimatedOutputTokens = Math.round(tokenEstimate * 0.1);
  const costResult = calcBrainOutputCost({
    for: {
      tokens: {
        input: tokenEstimate,
        output: estimatedOutputTokens,
        cache: { get: 0, set: 0 },
      },
    },
    with: { cost: { cash: input.costSpec } },
  });
  const costEstimate = asIsoPriceHuman(costResult.cash.total);

  return {
    prompt,
    tokenEstimate,
    contextWindowPercent: Math.round(contextWindowPercent * 10) / 10,
    costEstimate,
    warnings,
  };
};
