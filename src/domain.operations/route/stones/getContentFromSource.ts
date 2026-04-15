import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';

/**
 * .what = extracts content from source specifier
 * .why = enables flexible content sources (stdin, template, literal)
 *
 * .note = sources:
 *         - @stdin: reads from stdin (passed via cli)
 *         - template($path): reads template file ($behavior expands to route path)
 *         - literal: any other string is returned directly
 */
export const getContentFromSource = async (input: {
  source: string;
  stdin: string | null;
  route: string;
}): Promise<{ content: string }> => {
  // @stdin branch
  if (input.source === '@stdin') {
    if (!input.stdin || input.stdin.trim() === '') {
      throw new BadRequestError('no content provided via stdin', {});
    }
    return { content: input.stdin };
  }

  // template($path) branch
  const templateMatch = input.source.match(/^template\((.+)\)$/);
  if (templateMatch) {
    const templatePath = templateMatch[1]!.replace(/\$behavior/g, input.route);
    try {
      const content = await fs.readFile(templatePath, 'utf-8');
      return { content };
    } catch {
      throw new BadRequestError('template file not found', {
        path: templatePath,
      });
    }
  }

  // literal branch
  return { content: input.source };
};
