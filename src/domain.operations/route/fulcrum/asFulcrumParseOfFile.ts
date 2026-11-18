import {
  asFulcrumCaseFromFileName,
  FULCRUM_FILE_NAME_MALFORMED,
} from './asFulcrumCaseFromFileName';
import {
  asFulcrumFrontmatter,
  type FulcrumFrontmatterParse,
} from './asFulcrumFrontmatter';
import { asFulcrumParseFitToFileCase } from './asFulcrumParseFitToFileCase';

/**
 * .what = the frontmatter parse of one fulcrum file, judged against the case its name declares
 * .why = the linter and the dispute-time check each read one entry; a file whose name declares no
 *        case is named by its file name on both, never compared to a case it cannot carry
 *
 * .note = `content` is null for a file whose name declares no case; it is never read
 */
export const asFulcrumParseOfFile = (input: {
  name: string;
  content: string | null;
}): FulcrumFrontmatterParse => {
  // a name that declares no case is the defect, whatever the file holds
  const declared = asFulcrumCaseFromFileName({ name: input.name });
  if (!declared || input.content === null)
    return {
      kind: 'invalid',
      absent: [],
      malformed: [FULCRUM_FILE_NAME_MALFORMED],
    };

  // the frontmatter's case must equal the id the name declares
  return asFulcrumParseFitToFileCase({
    parse: asFulcrumFrontmatter({ content: input.content }),
    slug: declared.slug,
  });
};
