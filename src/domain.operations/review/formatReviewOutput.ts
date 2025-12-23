/**
 * .what = formats brain response into review markdown
 * .why = ensures consistent, machine-parseable review output
 */
export const formatReviewOutput = (input: {
  response: {
    issues: Array<{
      type: 'blocker' | 'nitpick';
      message: string;
      file?: string;
      line?: number;
    }>;
  };
}): string => {
  // handle empty or missing issues
  const issues = input.response?.issues ?? [];
  if (!issues.length) {
    return '# review complete\n\nno issues found.\n';
  }

  // separate blockers and nitpicks
  const blockers = issues.filter((f) => f.type === 'blocker');
  const nitpicks = issues.filter((f) => f.type === 'nitpick');

  // build output with blockers first (per template)
  const sections: string[] = [];

  // emit blockers
  blockers.forEach((issue, index) => {
    const header = `# blocker.${index + 1}`;
    const location = issue.file
      ? issue.line
        ? `\n\n**location**: ${issue.file}:${issue.line}`
        : `\n\n**location**: ${issue.file}`
      : '';
    sections.push(`${header}${location}\n\n${issue.message}`);
  });

  // emit nitpicks
  nitpicks.forEach((issue, index) => {
    const header = `# nitpick.${index + 1}`;
    const location = issue.file
      ? issue.line
        ? `\n\n**location**: ${issue.file}:${issue.line}`
        : `\n\n**location**: ${issue.file}`
      : '';
    sections.push(`${header}${location}\n\n${issue.message}`);
  });

  return sections.join('\n\n---\n\n') + '\n';
};
