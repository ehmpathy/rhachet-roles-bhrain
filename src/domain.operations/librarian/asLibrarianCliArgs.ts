import { ConstraintError } from 'helpful-errors';

import { asCliOptionsOfArgs } from '../cli/asCliOptionsOfArgs';
import {
  LIBRARIAN_COMMANDS,
  type LibrarianCommand,
} from './LIBRARIAN_COMMANDS';

/**
 * .what = parse the own args of one librarian command into its typed options
 * .why = the three commands share one flag grammar (`--glob` repeats; a few booleans; one
 *        `--mode`). one strict parse means a typo (`--emti`), a flag the command does not read,
 *        or a bare `--glob` fails loud with the surface it does read, rather than run a report
 *        on the wrong input (rule.forbid.failhide, rule.require.errors-name-the-fix)
 *
 * .note = `args` are the caller's own args: the rhachet-injected flags stripped, `--flag=value`
 *         already spaced. a help request returns early and reads no other flag
 */
export const asLibrarianCliArgs = (input: {
  args: string[];
  command: LibrarianCommand;
}): {
  wantHelp: boolean;
  globs: string[];
  wantFiles: boolean;
  wantEmit: boolean;
  mode: 'plan' | 'apply';
} => {
  const surface = LIBRARIAN_COMMANDS[input.command].flags;
  const flagsOfSurface = surface.map((flag) => `--${flag.name}`).join(' ');
  const usageHint = `run \`rhx ${input.command} --help\`; this command reads: ${flagsOfSurface}`;

  // a help request short-circuits before any other flag is read
  const wantHelp = input.args.some((arg) => ['--help', '-h'].includes(arg));
  if (wantHelp)
    return {
      wantHelp: true,
      globs: [],
      wantFiles: false,
      wantEmit: false,
      mode: 'plan',
    };

  // parse the flags this command reads; a boolean never takes a value
  const parsed = asCliOptionsOfArgs({
    args: input.args,
    booleans: surface
      .filter((flag) => flag.kind === 'boolean')
      .map((flag) => flag.name),
  });

  // refuse a flag the command does not read
  const keysTyped = [
    ...new Set([...Object.keys(parsed.options), ...parsed.valueless]),
  ];
  const keysUnknown = keysTyped.filter(
    (key) => !surface.some((flag) => flag.name === key),
  );
  if (keysUnknown.length > 0)
    throw new ConstraintError(
      `unknown flag(s): ${keysUnknown.map((key) => `--${key}`).join(', ')}`,
      { hint: usageHint },
    );

  // refuse a value flag typed bare, which would otherwise read as an absent glob
  if (parsed.valueless.length > 0)
    throw new ConstraintError(
      `flag(s) typed with no value: ${parsed.valueless.map((key) => `--${key}`).join(', ')}`,
      { hint: usageHint },
    );

  // a glob set is the whole input; absent is a caller slip, never a clean zero
  const globs = parsed.optionsMulti.glob ?? [];
  if (globs.length === 0)
    throw new ConstraintError('no --glob given', { hint: usageHint });

  // the mode defaults to plan, the safe preview
  const modeTyped = parsed.options.mode ?? 'plan';
  if (modeTyped !== 'plan' && modeTyped !== 'apply')
    throw new ConstraintError(`unknown --mode: ${modeTyped}`, {
      hint: 'use --mode plan (default) or --mode apply',
    });

  return {
    wantHelp: false,
    globs,
    wantFiles: parsed.options.files === 'true',
    wantEmit: parsed.options.emit === 'true',
    mode: modeTyped,
  };
};
