/**
 * .what = parse and validate cli args against a zod schema
 *
 * .why  = provides type-safe arg parse across all cli entry points
 *         with zod validation. rhachet args (repo, role, skill, s) should
 *         be declared as optional in the schema so they are parsed and ignored.
 */
import type { z } from 'zod';

type CliArgsSchema = z.ZodObject<{
  named: z.ZodObject<z.ZodRawShape>;
  ordered: z.ZodDefault<z.ZodArray<z.ZodString>>;
}>;

/**
 * .what = parse raw argv into named and ordered args
 *
 * .why  = converts argv array into structured object for zod validation
 */
const getCliArgsRaw = (
  argv: string[],
): { named: Record<string, string>; ordered: string[] } => {
  const named: Record<string, string> = {};
  const ordered: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg) continue;

    // skip rhachet separator
    if (arg === '--') continue;

    // named arg: --key value or --key=value
    if (arg.startsWith('--')) {
      const eqIndex = arg.indexOf('=');
      if (eqIndex !== -1) {
        const key = arg.slice(2, eqIndex);
        const value = arg.slice(eqIndex + 1);
        named[key] = value;
      } else {
        const key = arg.slice(2);
        const nextArg = argv[i + 1];
        if (nextArg && !nextArg.startsWith('-')) {
          named[key] = nextArg;
          i++;
        } else {
          named[key] = 'true';
        }
      }
      continue;
    }

    // short arg: -k value
    if (arg.startsWith('-') && arg.length === 2) {
      const key = arg.slice(1);
      const nextArg = argv[i + 1];
      if (nextArg && !nextArg.startsWith('-')) {
        named[key] = nextArg;
        i++;
      } else {
        named[key] = 'true';
      }
      continue;
    }

    // ordered arg
    ordered.push(arg);
  }

  return { named, ordered };
};

/**
 * .what = parse and validate cli args against a zod schema
 *
 * .why  = provides type-safe arg parse with automatic rhachet arg support
 */
export const getCliArgs = <T extends CliArgsSchema>(input: {
  schema: T;
  argv?: string[];
}): z.infer<T> => {
  // detect if argv[1] is script filename (direct invocation) vs user arg (package import)
  const argvFirstIsScriptFilename = process.argv[1]?.includes('/cli/');
  const argvWithoutScriptFilename = argvFirstIsScriptFilename
    ? process.argv.slice(2)
    : process.argv.slice(1);
  const argv = input.argv ?? argvWithoutScriptFilename;
  const raw = getCliArgsRaw(argv);

  // validate against schema
  const result = input.schema.safeParse(raw);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => {
        const path = issue.path.join('.');
        return `  ${path}: ${issue.message}`;
      })
      .join('\n');
    console.error('error: invalid arguments');
    console.error(errors);
    process.exit(1);
  }

  return result.data;
};
