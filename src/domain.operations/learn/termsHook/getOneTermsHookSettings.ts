import { lstatSync } from 'fs';
import { ConstraintError } from 'helpful-errors';

import { asClaudeSettingsShapeFault } from './asClaudeSettingsShapeFault';
import type { ClaudeSettingsOfRepo } from './ClaudeSettingsOfRepo';
import { getOneFileTextOrNull } from './getOneFileTextOrNull';
import { isClaudeSettingsOfRepo } from './isClaudeSettingsOfRepo';

/**
 * .what = the parsed json, or the parser's own account of where the text broke
 * .why = a caller told only "repair the json" must reread the whole file; the parser names
 *        the byte, so the refusal carries it
 */
const asJsonParsedOrFault = (input: {
  text: string;
}): { parsed: unknown; fault: string | null } => {
  try {
    return { parsed: JSON.parse(input.text), fault: null };
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return { parsed: undefined, fault: error.message };
  }
};

/**
 * .what = whether a read fault is a denied permission
 * .why = a file the caller may not read is a state they fix with a chmod, so it is refused by
 *        name with that fix; every other read fault stays a malfunction
 */
const isPermissionFault = (input: { error: unknown }): boolean =>
  input.error instanceof Error &&
  'code' in input.error &&
  (input.error.code === 'EACCES' || input.error.code === 'EPERM');

/**
 * .what = read the claude settings target, or null when it is absent
 * .why = every verb reads the file the same way, and refuses the same states before it claims
 *        aught: a link (a write through it lands in a file the toggle does not own), a dir,
 *        and an unparseable or misshapen file (a read that cannot parse cannot honestly
 *        report absence)
 */
export const getOneTermsHookSettings = async (input: {
  path: string;
  pathShown: string;
}): Promise<ClaudeSettingsOfRepo | null> => {
  // refuse a link target
  const stat = lstatSync(input.path, { throwIfNoEntry: false });
  if (stat?.isSymbolicLink())
    throw new ConstraintError(
      'the settings target is a link, so learn.terms.hook will not read or write through it',
      {
        settings: input.pathShown,
        hint: 'replace the link with a real file, then rerun the command',
      },
    );

  // an absent target holds no hook
  if (!stat) return null;

  // refuse a dir where a file belongs
  if (stat.isDirectory())
    throw new ConstraintError(
      'the settings target is a dir, so learn.terms.hook cannot read or write it',
      {
        settings: input.pathShown,
        hint: 'replace the dir with a settings json file, then rerun the command',
      },
    );

  // read; a target gone since the stat is absent, and one the caller may not read is refused
  const text = await getOneFileTextOrNull({ path: input.path }).catch(
    (error: unknown) => {
      if (!isPermissionFault({ error })) throw error;
      throw new ConstraintError(
        'the settings target cannot be read, so learn.terms.hook will not read or rewrite it',
        {
          settings: input.pathShown,
          hint: `grant read and write on it (chmod u+rw ${input.pathShown}), then rerun the command`,
        },
      );
    },
  );
  if (text === null) return null;

  // refuse text that does not parse, with the parser's own account of where it broke
  const { parsed, fault } = asJsonParsedOrFault({ text });
  if (fault !== null)
    throw new ConstraintError(
      'the settings target is not valid json, so learn.terms.hook will not read or rewrite it',
      {
        settings: input.pathShown,
        parse: fault,
        hint: 'repair the json, then rerun the command',
      },
    );

  // refuse json that parses but holds a shape the verbs cannot walk, with where it breaks
  if (!isClaudeSettingsOfRepo(parsed))
    throw new ConstraintError(
      'the settings target holds a shape learn.terms.hook cannot walk, so it will not read or rewrite it',
      {
        settings: input.pathShown,
        found: asClaudeSettingsShapeFault({ value: parsed }),
        hint: 'make hooks map each event to a list of { matcher, hooks }, then rerun',
      },
    );
  return parsed;
};
