import { ConstraintError } from 'helpful-errors';

// note: js-yaml ships no types in this repo; the require form is the repo's convention (setGoal.ts)
const yaml = require('js-yaml');

/**
 * .what = the two shapes rhachet reads a boot spec in
 * .why = `simple` holds top-level `briefs:` / `skills:`; `subject` holds `always:` and
 *        `subject.<slug>:` sections. rhachet refuses a mod whose mode differs from its role's
 */
export type BootSpecMode = 'simple' | 'subject';

/**
 * .what = what one resource kind's curation names: `say` null when the key is absent
 * .why = in a role's simple spec an absent `say` means "say all"; a mod's absent `say` claims
 *        naught. the reader keeps absent apart from empty so each caller can apply its rule
 */
export interface BootSpecCuration {
  say: string[] | null;
  ref: string[];
}

/**
 * .what = the paths a list cell of a boot spec names; null when the cell is absent
 * .why = a boot spec key may be absent, `[]`, or a list; any other shape is no list rhachet reads
 */
const asPathsOfCell = (input: {
  cell: unknown;
  key: string;
  at: string;
}): string[] | null => {
  if (input.cell === undefined || input.cell === null) return null;
  if (
    Array.isArray(input.cell) &&
    input.cell.every((item) => typeof item === 'string')
  )
    return input.cell;
  throw new ConstraintError(`a boot spec's ${input.key} is no list of paths`, {
    at: input.at,
    hint: `make ${input.key} a yaml list, one \`- path\` per line`,
  });
};

/**
 * .what = the mode a parsed boot spec is in; null when it holds no section at all
 */
const asBootSpecModeOfParsed = (input: {
  parsed: Record<string, unknown> | null;
}): BootSpecMode | null => {
  const keys = Object.keys(input.parsed ?? {});
  if (keys.some((key) => key === 'always' || key.startsWith('subject.')))
    return 'subject';
  if (keys.some((key) => key === 'briefs' || key === 'skills')) return 'simple';
  return null;
};

/**
 * .what = one kind's curation of a parsed spec, read where its mode keeps it
 */
const asCurationOfKind = (input: {
  parsed: Record<string, unknown> | null;
  mode: BootSpecMode | null;
  kind: 'briefs' | 'skills';
  at: string;
}): BootSpecCuration => {
  const section =
    input.mode === 'subject'
      ? (input.parsed?.always as Record<string, unknown> | null | undefined)
      : input.parsed;
  const cell = (section?.[input.kind] ?? null) as {
    say?: unknown;
    ref?: unknown;
  } | null;
  const prefix = input.mode === 'subject' ? `always.${input.kind}` : input.kind;
  return {
    say: asPathsOfCell({ cell: cell?.say, key: `${prefix}.say`, at: input.at }),
    ref:
      asPathsOfCell({ cell: cell?.ref, key: `${prefix}.ref`, at: input.at }) ??
      [],
  };
};

/**
 * .what = a boot spec read as rhachet reads it: its mode, and what it names for briefs and skills
 * .why = the stamp, the course proof, and the splice each ask "does this spec name that path";
 *        a parse is the only read that sees what rhachet sees, in either mode
 * .note = refuses (ConstraintError) a spec that does not parse, a duplicate key included
 */
export const asBootSpecNames = (input: {
  spec: string;
  at: string;
}): {
  mode: BootSpecMode | null;
  briefs: BootSpecCuration;
  skills: BootSpecCuration;
} => {
  const parsed: Record<string, unknown> | null = (() => {
    try {
      return yaml.load(input.spec) ?? null;
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      throw new ConstraintError('a boot spec does not parse as yaml', {
        at: input.at,
        cause: error,
        hint: 'repair the yaml; rhachet refuses to boot a role whose boot spec does not parse',
      });
    }
  })();
  const mode = asBootSpecModeOfParsed({ parsed });
  return {
    mode,
    briefs: asCurationOfKind({ parsed, mode, kind: 'briefs', at: input.at }),
    skills: asCurationOfKind({ parsed, mode, kind: 'skills', at: input.at }),
  };
};
