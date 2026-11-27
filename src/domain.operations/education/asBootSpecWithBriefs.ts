import { ConstraintError } from 'helpful-errors';

import { asBootClaim } from './asBootClaim';
import { asBootSpecNames, type BootSpecMode } from './asBootSpecNames';

/**
 * .what = the index of the first line at or after `from` that matches, within a block that
 *         ends at the first line indented less than `indent`; -1 when absent
 * .why = a boot spec nests `say` and `ref` under `briefs`; a search must stay inside one block,
 *        or a `say:` of another section reads as this one's
 */
const getIndexInBlock = (input: {
  lines: string[];
  from: number;
  indent: number;
  pattern: RegExp;
}): number => {
  const tail = input.lines.slice(input.from);
  const end = tail.findIndex((line) => {
    const lead = line.length - line.trimStart().length;
    return (
      line.trim() !== '' && !line.trim().startsWith('#') && lead < input.indent
    );
  });
  const block = end === -1 ? tail : tail.slice(0, end);
  const found = block.findIndex((line) => input.pattern.test(line));
  return found === -1 ? -1 : input.from + found;
};

/**
 * .what = the key path a mode keeps brief curation under, as a hint names it
 */
export const asBriefsKeyOfMode = (input: { mode: BootSpecMode }): string =>
  input.mode === 'subject' ? 'always.briefs' : 'briefs';

/**
 * .what = name briefs in a boot spec, in the spec's own mode, comments kept
 * .why = rhachet boots only what a boot spec names, and refuses a mod whose mode differs from
 *        its role's; a yaml round trip would drop the comments that carry each entry's why, so
 *        this inserts lines in place, under `always.briefs` (subject) or `briefs` (simple)
 * .note = the mode is the spec's own; a spec with no section takes `modeOfRole` (a linked
 *         role's published mode), else simple, which is how rhachet reads a section-free spec
 * .note = a role's simple spec with no `say` says all: an index owed at `say` is booted already,
 *         and no `say` key is added, since one would narrow "say all" to the index alone
 * .note = idempotent: a path already booted where it is asked is left as is
 * .note = refuses (ConstraintError) a spec that does not parse, a mode that differs from the
 *         role's, and a splice whose result does not boot each path where it was asked
 */
export const asBootSpecWithBriefs = (input: {
  spec: string;
  say: string[];
  ref: string[];
  at: string;
  isRoleSpec: boolean;
  modeOfRole: BootSpecMode | null;
}): string => {
  const names = asBootSpecNames({ spec: input.spec, at: input.at });
  if (names.mode && input.modeOfRole && names.mode !== input.modeOfRole)
    throw new ConstraintError(
      `the boot spec is in ${names.mode} mode, but its role's is in ${input.modeOfRole} mode`,
      {
        at: input.at,
        hint:
          input.modeOfRole === 'simple'
            ? 'rewrite it with top-level `briefs:` / `skills:`, as the role does'
            : 'rewrite it with `always:` sections, as the role does',
      },
    );
  const mode = names.mode ?? input.modeOfRole ?? 'simple';

  // what is owed: a say not yet said, a ref neither ref'd nor said by name
  const claimOf = (spec: string, p: string) => {
    const read = asBootSpecNames({ spec, at: input.at });
    return {
      claim: asBootClaim({
        curation: read.briefs,
        mode: read.mode ?? mode,
        isRoleSpec: input.isRoleSpec,
        path: p,
      }),
      saidByName: read.briefs.say?.includes(p) ?? false,
    };
  };
  const sayOwed = input.say.filter(
    (p) => claimOf(input.spec, p).claim !== 'say',
  );
  const refOwed = input.ref.filter((p) => {
    const { claim, saidByName } = claimOf(input.spec, p);
    return claim !== 'ref' && !saidByName;
  });
  if (sayOwed.length === 0 && refOwed.length === 0) return input.spec;
  const spliced = asBootSpecSpliced({
    spec: input.spec,
    mode,
    sayOwed,
    refOwed,
  });

  // the splice is checked by a parse, so a spec shape it does not know refuses, never ships
  const sayAbsent = sayOwed.filter((p) => claimOf(spliced, p).claim !== 'say');
  const refAbsent = refOwed.filter((p) => {
    const { claim, saidByName } = claimOf(spliced, p);
    return claim !== 'ref' && !saidByName;
  });
  if (sayAbsent.length > 0 || refAbsent.length > 0)
    throw new ConstraintError(
      'the boot spec has a shape the splice cannot name briefs into',
      {
        at: input.at,
        sayAbsent,
        refAbsent,
        hint: `name each path by hand, under ${asBriefsKeyOfMode({ mode })}.say or .ref`,
      },
    );
  return spliced;
};

/**
 * .what = the boot spec with each owed path inserted under its key, lines kept in place
 * .note = subject mode nests `briefs` under `always:` (keys at 4, items at 6); simple mode
 *         keeps `briefs:` at the top (keys at 2, items at 4)
 */
const asBootSpecSpliced = (input: {
  spec: string;
  mode: BootSpecMode;
  sayOwed: string[];
  refOwed: string[];
}): string => {
  const { sayOwed, refOwed } = input;
  const lines = input.spec.replace(/\n*$/, '').split('\n');
  const indentOfBriefs = input.mode === 'subject' ? 2 : 0;
  const indentOfKey = indentOfBriefs + 2;

  // subject mode: the `always:` key; appended when absent. a bare key, or an empty flow map
  //   (`always: {}`), which opens as a bare key
  const always = (() => {
    if (input.mode !== 'subject') return -1;
    const found = lines.findIndex((l) => /^always:\s*(\{\s*\})?\s*$/.test(l));
    if (found !== -1) {
      lines[found] = 'always:';
      return found;
    }
    lines.push('always:');
    return lines.length - 1;
  })();

  // the `briefs:` key, under `always:` or at the top; inserted when absent. a bare key, or an
  //   empty flow map (`briefs: {}`), which opens as a bare key
  const briefs = (() => {
    const keyBare = `${' '.repeat(indentOfBriefs)}briefs:`;
    const pattern = new RegExp(`^${keyBare}\\s*(\\{\\s*\\})?\\s*$`);
    const found =
      input.mode !== 'subject'
        ? lines.findIndex((l) => pattern.test(l))
        : getIndexInBlock({
            lines,
            from: always + 1,
            indent: indentOfBriefs,
            pattern,
          });
    if (found !== -1) {
      lines[found] = keyBare;
      return found;
    }
    if (input.mode !== 'subject') {
      lines.push(keyBare);
      return lines.length - 1;
    }
    lines.splice(always + 1, 0, keyBare);
    return always + 1;
  })();

  // each owed path, at the end of its key's list; the key is inserted when absent
  const pad = ' '.repeat(indentOfKey);
  const insertUnder = ({
    key,
    paths,
  }: {
    key: 'say' | 'ref';
    paths: string[];
  }) => {
    if (paths.length === 0) return;
    // a bare key, or an empty flow list (`say: []`), which opens as a bare key
    const pattern = new RegExp(`^${pad}${key}:\\s*(\\[\\s*\\])?\\s*$`);
    const keyFound = getIndexInBlock({
      lines,
      from: briefs + 1,
      indent: indentOfKey,
      pattern,
    });
    if (keyFound === -1) lines.splice(briefs + 1, 0, `${pad}${key}:`);
    if (keyFound !== -1) lines[keyFound] = `${pad}${key}:`;
    const at = keyFound === -1 ? briefs + 1 : keyFound;

    // items match the indent the list already uses, and land after its last item, so a
    //   role's own lead briefs keep their place at the head of the boot
    const itemPattern = new RegExp(`^( {${indentOfKey},})(- |#)`);
    const itemIndent =
      lines
        .slice(at + 1)
        .map((line) => itemPattern.exec(line))
        .find((match) => match?.[2] === '- ')?.[1] ??
      ' '.repeat(indentOfKey + 2);
    const isOfList = (line: string) =>
      line.startsWith(`${itemIndent}- `) || line.startsWith(`${itemIndent}#`);
    const itemsLast = lines.slice(at + 1).findIndex((line) => !isOfList(line));
    const end = itemsLast === -1 ? lines.length : at + 1 + itemsLast;
    lines.splice(end, 0, ...paths.map((p) => `${itemIndent}- ${p}`));
  };
  insertUnder({ key: 'ref', paths: refOwed });
  insertUnder({ key: 'say', paths: sayOwed });

  return `${lines.join('\n')}\n`;
};
