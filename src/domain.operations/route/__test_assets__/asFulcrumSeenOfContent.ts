import { UnexpectedCodePathError } from 'helpful-errors';

import { asFulcrumFrontmatter } from '../fulcrum/asFulcrumFrontmatter';

/**
 * .what = the content hash a verdict row must carry to prove a fixture fulcrum
 * .why = a test that writes a ledger row by hand must bind it to the fixture's content, as the
 *        lever does, or the gate reads the verdict as reopened
 */
export const asFulcrumSeenOfContent = (input: { content: string }): string => {
  const parse = asFulcrumFrontmatter({ content: input.content });
  if (parse.kind !== 'valid')
    throw new UnexpectedCodePathError('the fixture should parse valid', {
      parse,
      hint: 'a hand-written ledger row needs a fixture with valid frontmatter',
    });
  return parse.seen;
};
