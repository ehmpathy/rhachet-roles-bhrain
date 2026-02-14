/**
 * .what = issue shape from brain response
 * .why = enables typed parse of review issues
 */
interface ReviewIssue {
  rule: string;
  title: string;
  description: string;
  locations: string[];
  snippet: {
    lang: string;
    code: string;
  };
}

/**
 * .what = formats brain response into review markdown
 * .why = ensures consistent, machine-parseable review output
 */
export const formatReviewOutput = (input: {
  response: {
    done: boolean;
    blockers: ReviewIssue[];
    nitpicks: ReviewIssue[];
  };
}): string => {
  // extract blockers and nitpicks from response
  const blockers = input.response?.blockers ?? [];
  const nitpicks = input.response?.nitpicks ?? [];

  // handle no issues found
  if (!blockers.length && !nitpicks.length) {
    return '# review complete\n\nno issues found.\n';
  }

  // build output with blockers first (per template)
  const sections: string[] = [];

  // format a single issue into markdown
  const formatIssue = (
    issue: ReviewIssue,
    type: 'blocker' | 'nitpick',
    index: number,
  ): string => {
    const header = `# ${type}.${index + 1}: ${issue.title}`;
    const rule = `\n\n**rule**: ${issue.rule}`;
    const locations =
      issue.locations.length > 0
        ? `\n\n**locations**:\n${issue.locations.map((loc) => `- ${loc}`).join('\n')}`
        : '';
    const snippet = `\n\n**snippet**:\n\`\`\`${issue.snippet.lang}\n${issue.snippet.code}\n\`\`\``;
    return `${header}${rule}${locations}\n\n${issue.description}${snippet}`;
  };

  // emit blockers
  blockers.forEach((issue, index) => {
    sections.push(formatIssue(issue, 'blocker', index));
  });

  // emit nitpicks
  nitpicks.forEach((issue, index) => {
    sections.push(formatIssue(issue, 'nitpick', index));
  });

  return sections.join('\n\n---\n\n') + '\n';
};
