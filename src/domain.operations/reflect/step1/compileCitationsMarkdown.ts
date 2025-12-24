import { genGitHubFileUrl } from '../../git/genGitHubFileUrl';

/**
 * .what = generates citations.md content from feedback files
 * .why = creates permanent record of all feedback sources for rule proposals
 */
export const compileCitationsMarkdown = (input: {
  feedbackFiles: string[];
  cwd: string;
}): string => {
  const lines: string[] = [
    '# citations',
    '',
    'feedback files extracted for rule proposal:',
    '',
  ];

  for (const file of input.feedbackFiles) {
    const url = genGitHubFileUrl({ filePath: file, cwd: input.cwd });
    lines.push(`- [${file}](${url})`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`generated: ${new Date().toISOString()}`);
  lines.push(`total: ${input.feedbackFiles.length} files`);

  return lines.join('\n');
};
