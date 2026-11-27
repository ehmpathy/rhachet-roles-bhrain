import { ConstraintError } from 'helpful-errors';

import { getOwnInvocationArgs } from '@src/domain.operations/cli/getOwnInvocationArgs';

/**
 * .what = the parse state: verb words, flag values, and a flag that awaits its value
 */
interface ArgsParse {
  words: string[];
  flags: Record<string, string[]>;
  flagOpen: string | null;
  flagsUnknown: string[];
}

/**
 * .what = the parse with one more value appended to a flag
 */
const asParseWithValue = (input: {
  parse: ArgsParse;
  flag: string;
  value: string;
}): ArgsParse => ({
  ...input.parse,
  flags: {
    ...input.parse.flags,
    [input.flag]: [...(input.parse.flags[input.flag] ?? []), input.value],
  },
  flagOpen: null,
});

/**
 * .what = the parsed args of an education face: verb words, flag values, and a help ask
 * .why = three faces share one parse, so each refuses an unknown flag the same way
 * .note = `--skill`, `--role`, `--repo` belong to the harness: `rhx` reads `--role` as its own
 *         role filter and never forwards it, so no face may claim one. the role to educate is
 *         `--for`; the harness flags are dropped wherever they sit
 * .note = each verb declares the flags it reads; a flag its verb does not read is refused, so
 *         `exit --course x` never exits some other course in silence
 */
export const asEducationArgs = (input: {
  argv: string[];
  flagsOfVerb: Record<string, string[]>;
}): { words: string[]; flags: Record<string, string[]>; help: boolean } => {
  const flagsOfFace = [...new Set(Object.values(input.flagsOfVerb).flat())];
  const parsed = asEducationArgsParsed({
    argv: input.argv,
    flagsKnown: flagsOfFace,
  });
  const verb = parsed.words.join(' ');
  const flagsOfThisVerb = input.flagsOfVerb[verb] ?? null;

  // an unknown flag refuses; the fix names the flags of the verb, else of the face
  const flagUnknown = parsed.flagsUnknown[0] ?? null;
  if (flagUnknown)
    throw new ConstraintError(`unknown flag ${flagUnknown}`, {
      hint: `use one of: ${(flagsOfThisVerb ?? flagsOfFace).join(', ')}`,
    });

  // a known verb refuses each flag it does not read
  if (flagsOfThisVerb === null) return parsed;
  const flagsUnread = Object.keys(parsed.flags).filter(
    (flag) => !flagsOfThisVerb.includes(flag),
  );
  if (flagsUnread.length > 0)
    throw new ConstraintError(
      `${verb} does not read ${flagsUnread.join(', ')}`,
      {
        hint:
          flagsOfThisVerb.length > 0
            ? `${verb} reads only: ${flagsOfThisVerb.join(', ')}`
            : `${verb} reads no flag; drop ${flagsUnread.join(', ')}`,
      },
    );
  return { words: parsed.words, flags: parsed.flags, help: parsed.help };
};

/**
 * .what = the parse of an education face's args, against the union of every verb's flags
 * .note = an unknown flag is collected, never thrown mid-scan: the verb word may trail it, and
 *         the refusal names that verb's flags. its value is dropped, so it reads as no verb word
 */
const asEducationArgsParsed = (input: {
  argv: string[];
  flagsKnown: string[];
}): {
  words: string[];
  flags: Record<string, string[]>;
  flagsUnknown: string[];
  help: boolean;
} => {
  const args = getOwnInvocationArgs(input.argv);
  const help = args.some((arg) => arg === '--help' || arg === '-h');

  // pair each `--flag value` (or `--flag=value`); a bare word is a verb word
  const parsed = args
    .filter((arg) => arg !== '--help' && arg !== '-h')
    .reduce<ArgsParse>(
      (parse, arg) => {
        if (parse.flagOpen && parse.flagsUnknown.includes(parse.flagOpen))
          return { ...parse, flagOpen: null };
        if (parse.flagOpen)
          return asParseWithValue({ parse, flag: parse.flagOpen, value: arg });
        if (!arg.startsWith('--'))
          return { ...parse, words: [...parse.words, arg] };
        const [flag = arg, ...rest] = arg.split('=');
        if (!input.flagsKnown.includes(flag))
          return {
            ...parse,
            flagsUnknown: [...parse.flagsUnknown, flag],
            flagOpen: rest.length === 0 ? flag : null,
          };
        if (rest.length === 0) return { ...parse, flagOpen: flag };
        return asParseWithValue({ parse, flag, value: rest.join('=') });
      },
      { words: [], flags: {}, flagOpen: null, flagsUnknown: [] },
    );
  if (parsed.flagOpen && parsed.flagsUnknown.length === 0)
    throw new ConstraintError(`${parsed.flagOpen} needs a value`, {
      hint: `pass ${parsed.flagOpen} <value>`,
    });
  return {
    words: parsed.words,
    flags: parsed.flags,
    flagsUnknown: parsed.flagsUnknown,
    help,
  };
};
