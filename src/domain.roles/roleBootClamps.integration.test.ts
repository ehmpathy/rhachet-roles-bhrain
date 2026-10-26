import { ConstraintError, MalfunctionError } from 'helpful-errors';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { asHeadersOrphanedOfText } from '@src/domain.operations/learn/asHeadersOrphanedOfText';
import { getRoleRegistry } from '@src/domain.roles/getRoleRegistry';

import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { stripVTControlCharacters } from 'node:util';

// .note = js-yaml ships no types; required as the rest of src does (asReviewRubricsConfig.ts)
const yaml = require('js-yaml');

/**
 * .what = the clamps on each budgeted role's boot: its budget is declared, snapped, and holds
 *         under the real `rhachet roles boot`; the cue lines of every brief it boots at say are
 *         snapped; every ref it boots is snapped; each booted min has its `.md`; and its `not`
 *         list is snapped
 * .why  = a boot budget sees growth and is blind to a cut: a cue line dropped to reach a number
 *         costs fewer tokens, so the budget passes it. the snapshots make every cut, every rule
 *         dropped from say or ref, and every budget raise a diff a reviewer must read
 *         (rule.require.a-cue-is-not-a-claim). the set of booted files is read from what the
 *         real cli emits, never re-derived here
 */

// the roles whose briefs boot as condensed mins: beyond the budget, their cue lines, refs, and
// min peers are clamped too
const ROLES_CONDENSED = ['learner', 'driver', 'librarian'] as const;

// the roles whose briefs boot whole: only the budget is clamped
const ROLES_BUDGET_ONLY = [
  'achiever',
  'navigator',
  'researcher',
  'reviewer',
  'telepath',
  'thinker',
  'reflector',
] as const;

// the role dirs the registry does not hold: no seat links them, so their boot is read from the
// dir alone. each is still budgeted (#692, no exceptions); the list names them so a role that
// drops out of the registry, or joins it, is a diff here
const ROLES_UNREGISTERED = ['architect'] as const;

// the registered roles this repo clamps to a declared budget, every one, no exceptions (#692) —
// the expectation, so a budget removed from any of them, or a budget added to another, fails here
// rather than slips past the suite
const ROLES_BUDGETED = [...ROLES_CONDENSED, ...ROLES_BUDGET_ONLY] as const;

// the budget the owner set per role (#692): each boot.yml declares exactly this figure, so a
// raise past it, or a role booted over it, fails here for every role, never for one alone
const BUDGET_SET_BY_OWNER: Partial<Record<string, number>> = {
  learner: 10_000,
  driver: 10_000,
  librarian: 5_000,
  telepath: 7_000,
};

// the cap no role may cross, in budget or in payload (#692): a role that needs more boots as its
// catalog (rule.always.boot-an-oversized-subdomain-as-its-catalog), never as a raised budget
const BUDGET_CAP_OF_ANY_ROLE = 10_000;

// the cues each role must boot at say by name — a snapshot line dropped and resnapped would pass,
// so the briefs a journey step names are asserted here, one by one
const SAYS_REQUIRED: Record<(typeof ROLES_CONDENSED)[number], string[]> = {
  learner: ['learner/briefs/rule.always.entool-the-skills-you-touch.md.min'],
  driver: [],
  librarian: [],
};

const REPO_ROOT: string = path.join(__dirname, '..', '..');
const RHACHET_BIN: string = path.join(
  REPO_ROOT,
  'node_modules',
  '.bin',
  'rhachet',
);

// a real boot takes seconds; a minute means it hung
const RHACHET_TIMEOUT_MS = 60_000;

type BootSpec = {
  bootUri: string;
  budgetTokens: number | null;
  say: string[];
  ref: string[];
  not: string[];
};

type BootEmitted = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  says: string[];
  refs: string[];
  budgetRendered: number | null;
};

// communicator: the text of one file on disk
const getOneTextOfFile = (input: { file: string }): string =>
  fs.readFileSync(input.file, 'utf8');

// communicator: whether one path names a file on disk (a dangled symlink reads false)
const isFileFound = (input: { file: string }): boolean =>
  fs.existsSync(input.file);

// communicator: write one file, its dir included
const setOneFixtureFile = (input: { file: string; lines: string[] }): void => {
  fs.mkdirSync(path.dirname(input.file), { recursive: true });
  fs.writeFileSync(input.file, input.lines.join('\n'));
};

// the dir each cli run writes its stdout and stderr into
const STDIO_DIR: string = genTempDir({ slug: 'role-boot-clamps-stdio' });

// communicator: run the real rhachet cli, from the repo root
// .note = `roles boot` reads and prints; it writes no file, so the repo root is a safe cwd, and
//         the booted paths it prints are relative to that root
// .note = its stdout and stderr go to files, never pipes. a cli that exits while a pipe write is
//         still queued loses the tail, and under a loaded suite a pipe can shrink to one page:
//         the refs block, which prints last, vanished from the librarian boot that way. a write
//         to a file is synchronous, so the whole emit lands
const runRhachet = (input: {
  args: string[];
  cwd?: string;
}): { stdout: string; stderr: string; exitCode: number | null } => {
  const stdoutFile = path.join(
    STDIO_DIR,
    `${Date.now()}.${Math.random()}.stdout`,
  );
  const stderrFile = path.join(
    STDIO_DIR,
    `${Date.now()}.${Math.random()}.stderr`,
  );
  const stdoutFd = fs.openSync(stdoutFile, 'w');
  const stderrFd = fs.openSync(stderrFile, 'w');
  const result = spawnSync(RHACHET_BIN, input.args, {
    cwd: input.cwd ?? REPO_ROOT,
    stdio: ['ignore', stdoutFd, stderrFd],
    timeout: RHACHET_TIMEOUT_MS,
  });
  fs.closeSync(stdoutFd);
  fs.closeSync(stderrFd);

  // fail loud on a cli that could not run, so it never reads as a budget verdict
  if (result.error)
    throw new MalfunctionError('rhachet cli could not run', {
      bin: RHACHET_BIN,
      args: input.args,
      error: result.error.message,
      hint: 'run `npm ci` so node_modules/.bin/rhachet exists and runs; a timeout means the boot hung',
    });

  // fail loud on a cli killed by a signal, which leaves no exit code to read as a verdict
  if (result.status === null)
    throw new MalfunctionError('rhachet cli was killed before it exited', {
      bin: RHACHET_BIN,
      args: input.args,
      signal: result.signal,
      hint: 'a SIGKILL is often the oom killer; rerun the suite alone to confirm',
    });

  return {
    stdout: getOneTextOfFile({ file: stdoutFile }),
    stderr: getOneTextOfFile({ file: stderrFile }),
    exitCode: result.status,
  };
};

// transformer: whether a value is a list of strings
const isListOfStrings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((one) => typeof one === 'string');

// transformer: whether a value is a positive whole count of tokens
const isCountOfTokens = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

// transformer: the boot spec held in one boot.yml text, shape-checked before any field is read
// .note = a spec curates its briefs under `always.briefs` (subject mode) or `briefs` (simple
//         mode). a section with no `say` key says every brief, as a role with no spec does
const asBootSpec = (input: { text: string; bootUri: string }): BootSpec => {
  const spec = yaml.load(input.text);
  const briefs = spec?.always?.briefs ?? spec?.briefs;

  // reject a spec with no briefs section — a boot with no briefs curation has naught to clamp
  if (briefs === undefined || briefs === null || typeof briefs !== 'object')
    throw new ConstraintError('boot.yml has no briefs section', {
      bootUri: input.bootUri,
      hint: 'add `always.briefs.say` with the brief paths to say, or `briefs: {}` to say all',
    });

  // reject a `say` that is present but not a list — an absent `say` says all
  const say = briefs.say;
  if (say !== undefined && !isListOfStrings(say))
    throw new ConstraintError('boot.yml briefs `say` is not a list', {
      bootUri: input.bootUri,
      hint: 'set `say` to a list of brief paths, or remove it to say all',
    });

  // reject a `ref` that is present but not a list — an absent `ref` is an empty one
  const ref = briefs.ref;
  if (ref !== undefined && !isListOfStrings(ref))
    throw new ConstraintError('boot.yml `always.briefs.ref` is not a list', {
      bootUri: input.bootUri,
      hint: 'set `always.briefs.ref` to a list of brief paths, or remove it',
    });

  // reject a `not` that is present but not a list — an absent `not` is an empty one
  const not = briefs.not;
  if (not !== undefined && !isListOfStrings(not))
    throw new ConstraintError('boot.yml `always.briefs.not` is not a list', {
      bootUri: input.bootUri,
      hint: 'set `always.briefs.not` to a list of globs, or remove it',
    });

  // reject a budget that is present but not a positive count — a typo must not read as absence
  const tokens = spec?.budget?.tokens;
  if (tokens !== undefined && !isCountOfTokens(tokens))
    throw new ConstraintError('boot.yml `budget.tokens` is not a token count', {
      bootUri: input.bootUri,
      tokens,
      hint: 'set `budget.tokens` to a positive integer, unquoted (e.g. `21_500`), or remove it',
    });

  return {
    bootUri: input.bootUri,
    budgetTokens: tokens ?? null,
    say: say ?? [],
    ref: ref ?? [],
    not: not ?? [],
  };
};

// transformer: the declared entries of one tier that the boot did not emit, each named by its
// declared path. a declared `briefs/x.md` is emitted as itself or as its `briefs/x.md.min`
const getAllDeclaredAbsentFromEmit = (input: {
  bootUri: string;
  declared: string[];
  emitted: string[];
}): string[] => {
  const bootAbs = path.isAbsolute(input.bootUri)
    ? input.bootUri
    : path.join(REPO_ROOT, input.bootUri);
  const roleDir = path.relative(__dirname, path.dirname(bootAbs));
  const emitted = new Set(input.emitted);
  return input.declared.filter((entry) => {
    const asEmitted = path.join(roleDir, entry);
    return !emitted.has(asEmitted) && !emitted.has(`${asEmitted}.min`);
  });
};

// transformer: a repo-relative path, made relative to src/domain.roles
const asPathOfRoleDir = (input: { repoPath: string }): string =>
  path.relative(__dirname, path.join(REPO_ROOT, input.repoPath));

// transformer: the briefs a boot emitted at say, one `<brief.say path>` tag each
const asPathsOfBriefSay = (input: { stdout: string }): string[] =>
  [...input.stdout.matchAll(/<brief\.say path="([^"]+)"/g)].map((match) =>
    asPathOfRoleDir({ repoPath: match[1]! }),
  );

// transformer: the briefs a boot emitted at ref, from each `<briefs.ref base>` block
// (one file per line, `<also>` blocks included) and each single `<brief.ref path>` tag
const asPathsOfBriefRef = (input: { stdout: string }): string[] => {
  const fromBlocks = [
    ...input.stdout.matchAll(
      /<briefs\.ref base="([^"]+)">\n([\s\S]*?)<\/briefs\.ref>/g,
    ),
  ].flatMap((match) =>
    match[2]!
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((file) => asPathOfRoleDir({ repoPath: path.join(match[1]!, file) })),
  );
  const fromTags = [
    ...input.stdout.matchAll(/<brief\.ref path="([^"]+)"/g),
  ].map((match) => asPathOfRoleDir({ repoPath: match[1]! }));
  return [...fromBlocks, ...fromTags].sort();
};

// transformer: the budget a boot rendered in its stats (`budget = 20,233 / 20,500 tokens`)
const asBudgetOfBootStats = (input: { stdout: string }): number | null => {
  const match = input.stdout.match(/budget = [\d,]+ \/ ([\d,]+) tokens/);
  return match ? Number(match[1]!.replace(/,/g, '')) : null;
};

// transformer: the payload an over-budget halt names (`payload = 37`); fail loud where none
const asPayloadOfHalt = (input: { output: string }): number => {
  const match = stripVTControlCharacters(input.output).match(
    /payload\s+=\s+([\d,]+)/,
  );
  if (!match)
    throw new MalfunctionError('the halt named no payload', {
      output: input.output,
      hint: 'rhachet reworded its over-budget halt; update this parse',
    });
  return Number(match[1]!.replace(/,/g, ''));
};

// transformer: the `.md` path beside a min
const asMdPathOfMin = (input: { min: string }): string =>
  input.min.replace(/\.min$/, '');

// transformer: the lines of one text, in order, with space at each line's end trimmed
// .why = a blank line parts two tables and an indent nests a bullet; a snap that drops either
//        pins a structure the brief does not have
const asLinesOfText = (input: { text: string }): string[] =>
  input.text
    .replace(/\n+$/, '')
    .split('\n')
    .map((line) => line.trimEnd());

// transformer: the budget a seat payload owes — the least multiple of 250 strictly above it
const asBudgetOfSeatPayload = (input: { payload: number }): number =>
  (Math.floor(input.payload / 250) + 1) * 250;

// fail loud where a declared budget is not the one its seat payload owes, and name the fix
const assertBudgetFitsSeatPayload = (input: {
  slug: string;
  payload: number;
  budget: number;
}): void => {
  const budgetExpected = asBudgetOfSeatPayload({ payload: input.payload });

  // a shrink or a growth past the step both land here; name the number to set
  if (input.budget !== budgetExpected)
    throw new ConstraintError(
      'boot.yml budget is not the least multiple of 250 above the seat payload',
      {
        slug: input.slug,
        payload: input.payload,
        budget: input.budget,
        budgetExpected,
        hint: `set budget.tokens to ${budgetExpected} in src/domain.roles/${input.slug}/boot.yml; the seat payload is the [t4] snapshot`,
      },
    );
};

// fail loud where a role's declared budget or measured payload crosses the cap, and name the fix
const assertRoleUnderCap = (input: {
  slug: string;
  budget: number | null;
  payload: number | null;
}): void => {
  // a budget over the cap is a raise past the ceiling, whatever the role boots today
  if (input.budget !== null && input.budget > BUDGET_CAP_OF_ANY_ROLE)
    throw new ConstraintError('role budget exceeds the cap of any role', {
      slug: input.slug,
      budget: input.budget,
      cap: BUDGET_CAP_OF_ANY_ROLE,
      hint: `boot src/domain.roles/${input.slug} as its catalog: the catalog at say, its members under \`not\` or at ref`,
    });

  // a payload over the cap is a boot past the ceiling, whatever its budget declares
  if (input.payload !== null && input.payload > BUDGET_CAP_OF_ANY_ROLE)
    throw new ConstraintError('role payload exceeds the cap of any role', {
      slug: input.slug,
      payload: input.payload,
      cap: BUDGET_CAP_OF_ANY_ROLE,
      hint: `boot src/domain.roles/${input.slug} as its catalog: the catalog at say, its members under \`not\` or at ref`,
    });
};

// the boot uri of one role: the registry's declared uri, or, for a role the registry does not
// hold, the boot.yml in its own dir — the one place the loader can boot it from
const getOneBootUriOfRole = (input: { slug: string }): string | undefined => {
  const role = getRoleRegistry().roles.find((one) => one.slug === input.slug);
  if (role) return role.boot?.uri;
  const isUnregistered = (ROLES_UNREGISTERED as readonly string[]).includes(
    input.slug,
  );
  return isUnregistered
    ? path.join(__dirname, input.slug, 'boot.yml')
    : undefined;
};

// the slugs of every role dir under src/domain.roles: a dir that carries a readme
const getAllSlugsOfRoleDirs = (): string[] =>
  fs
    .readdirSync(__dirname, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) =>
      isFileFound({ file: path.join(__dirname, entry.name, 'readme.md') }),
    )
    .map((entry) => entry.name)
    .sort();

// the boot spec of one role, found via the role's own declared boot uri
const getOneBootSpecOfRole = (input: { slug: string }): BootSpec => {
  // find the role in the registry, never by a path into its dir, save for a role it lacks
  const bootUri = getOneBootUriOfRole({ slug: input.slug });

  // reject a role with no boot uri — there is no spec to clamp
  if (!bootUri)
    throw new ConstraintError('role declares no boot uri', {
      slug: input.slug,
      hint: 'set `boot: { uri }` on the role',
    });

  return asBootSpec({ text: getOneTextOfFile({ file: bootUri }), bootUri });
};

// the slugs of every registry role whose boot declares a budget
const getAllSlugsOfRolesBudgeted = (): string[] =>
  getRoleRegistry()
    .roles.filter((role) => role.boot?.uri)
    .filter(
      (role) =>
        asBootSpec({
          text: getOneTextOfFile({ file: role.boot!.uri }),
          bootUri: role.boot!.uri,
        }).budgetTokens !== null,
    )
    .map((role) => role.slug)
    .sort();

// what the real `roles boot` emits for one boot spec: its exit, its output, and its booted paths
const getOneBootEmitted = (input: { bootUri: string }): BootEmitted => {
  const result = runRhachet({
    args: ['roles', 'boot', '--what', input.bootUri],
  });
  return {
    ...result,
    says: asPathsOfBriefSay({ stdout: result.stdout }),
    refs: asPathsOfBriefRef({ stdout: result.stdout }),
    budgetRendered: asBudgetOfBootStats({ stdout: result.stdout }),
  };
};

// communicator: the absolute paths git ignores under one dir, each ignored dir named once
const getAllPathsIgnoredUnder = (input: { dir: string }): string[] => {
  const result = spawnSync(
    'git',
    [
      'ls-files',
      '--others',
      '--ignored',
      '--exclude-standard',
      '--directory',
      '-z',
      '--',
      input.dir,
    ],
    { cwd: REPO_ROOT },
  );

  // fail loud where git could not list, so a copy never silently keeps ignored files
  if (result.status !== 0)
    throw new MalfunctionError('git could not list the ignored paths', {
      dir: input.dir,
      stderr: result.stderr?.toString(),
    });

  return result.stdout
    .toString()
    .split('\0')
    .filter((entry) => entry.length > 0)
    .map((entry) => path.join(REPO_ROOT, entry).replace(/\/$/, ''));
};

// what the real `roles boot` emits for one role in the form a seat boots it: a plain copy of the
// role dir, symlinks dereferenced, at `.agent/repo=bhrain/role=<slug>/`, booted from the copy's
// root. a booted path rides in the payload, so the src form under-counts what a seat pays; and a
// copy is not a link, so an overshoot halts here rather than warns
const getOneBootEmittedAsSeat = (input: { slug: string }): BootEmitted => {
  const seatRoot = genTempDir({ slug: `role-boot-seat-${input.slug}` });
  const roleDirRel = path.join('.agent', 'repo=bhrain', `role=${input.slug}`);
  const roleDirSrc = path.join(__dirname, input.slug);

  // copy what ships, never what a local run left behind: a git-ignored path (a skill's `.temp/`
  // output) is absent from every clean checkout, so a copy that kept it would pin a payload ci
  // never sees
  const pathsIgnored = getAllPathsIgnoredUnder({ dir: roleDirSrc });
  fs.cpSync(roleDirSrc, path.join(seatRoot, roleDirRel), {
    recursive: true,
    dereference: true,
    filter: (source) =>
      !pathsIgnored.some(
        (ignored) => source === ignored || source.startsWith(`${ignored}/`),
      ),
  });
  const result = runRhachet({
    args: ['roles', 'boot', '--what', path.join(roleDirRel, 'boot.yml')],
    cwd: seatRoot,
  });
  return {
    ...result,
    says: [],
    refs: [],
    budgetRendered: asBudgetOfBootStats({ stdout: result.stdout }),
  };
};

// transformer: the payload a boot rendered in its stats (`budget = 20,233 / 20,500 tokens`)
const asPayloadOfBootStats = (input: { stdout: string }): number | null => {
  const match = input.stdout.match(/budget = ([\d,]+) \/ [\d,]+ tokens/);
  return match ? Number(match[1]!.replace(/,/g, '')) : null;
};

// the lines of one booted file, keyed by its path relative to src/domain.roles
const getOneLinesEntryOfFile = (input: {
  file: string;
}): { file: string; lines: string[] } => ({
  file: input.file,
  lines: asLinesOfText({
    text: getOneTextOfFile({ file: path.join(__dirname, input.file) }),
  }),
});

// the booted refs with no file on disk
const getAllRefsAbsent = (input: { refs: string[] }): string[] =>
  input.refs.filter((ref) => !isFileFound({ file: path.join(__dirname, ref) }));

// the booted mins whose `.md` is not beside them
const getAllMinsWithNoPeer = (input: { files: string[] }): string[] =>
  input.files
    .filter((file) => file.endsWith('.md.min'))
    .filter(
      (min) =>
        !isFileFound({ file: path.join(__dirname, asMdPathOfMin({ min })) }),
    );

// the one line each budgeted role's readme carries: the pointer from a booted cue to its argument
const LINE_OF_MIN_CONVENTION =
  'each `X.md.min` here condenses the `X.md` beside it. read the `.md` for the argument.';

// the booted mins' headers whose section holds no line
const getAllHeadersOrphaned = (input: { files: string[] }): string[] =>
  input.files
    .filter((file) => file.endsWith('.md.min'))
    .flatMap((file) =>
      asHeadersOrphanedOfText({
        file,
        text: getOneTextOfFile({ file: path.join(__dirname, file) }),
      }),
    );

describe('roleBootClamps', () => {
  given('[case0] the bhrain role registry', () => {
    when('[t0] each role boot is read for a budget', () => {
      then(
        'the roles that declare a budget are exactly the clamped set',
        () => {
          expect(getAllSlugsOfRolesBudgeted()).toEqual(
            [...ROLES_BUDGETED].sort(),
          );
        },
      );
    });

    when('[t1] each role dir under src/domain.roles is read', () => {
      then(
        'the dirs the registry lacks are exactly the unregistered set',
        () => {
          // the one role a seat cannot boot, named so it never hides
          const slugsRegistered = getRoleRegistry().roles.map(
            (one) => one.slug,
          );
          expect(
            getAllSlugsOfRoleDirs().filter(
              (slug) => !slugsRegistered.includes(slug),
            ),
          ).toEqual([...ROLES_UNREGISTERED].sort());
        },
      );

      then('every role dir declares a budget, no exceptions', () => {
        const slugsUnbudgeted = getAllSlugsOfRoleDirs().filter(
          (slug) => getOneBootSpecOfRole({ slug }).budgetTokens === null,
        );
        expect(slugsUnbudgeted).toEqual([]);
      });

      then('no role dir declares a budget over the cap of any role', () => {
        getAllSlugsOfRoleDirs().forEach((slug) =>
          assertRoleUnderCap({
            slug,
            budget: getOneBootSpecOfRole({ slug }).budgetTokens,
            payload: null,
          }),
        );
      });
    });

    when('[t2] the cap is asked of a role over it', () => {
      // the probe: the cap must bite on a budget over it and on a payload over it, each alone
      then('a budget over the cap is refused, and names the fix', () => {
        expect(() =>
          assertRoleUnderCap({
            slug: 'probe',
            budget: BUDGET_CAP_OF_ANY_ROLE + 250,
            payload: null,
          }),
        ).toThrow('role budget exceeds the cap of any role');
      });

      then('a payload over the cap is refused, and names the fix', () => {
        expect(() =>
          assertRoleUnderCap({
            slug: 'probe',
            budget: BUDGET_CAP_OF_ANY_ROLE,
            payload: BUDGET_CAP_OF_ANY_ROLE + 1,
          }),
        ).toThrow('role payload exceeds the cap of any role');
      });

      then('a budget and a payload at the cap pass', () => {
        expect(() =>
          assertRoleUnderCap({
            slug: 'probe',
            budget: BUDGET_CAP_OF_ANY_ROLE,
            payload: BUDGET_CAP_OF_ANY_ROLE,
          }),
        ).not.toThrow();
      });
    });
  });

  // the roster is one read for the whole repo; each role's [t5] looks up its own row in it
  const roster = useBeforeAll(async () =>
    runRhachet({ args: ['roles', 'cost', '--all'] }),
  );

  ROLES_CONDENSED.forEach((slug, index) => {
    given(`[case${index + 1}] the ${slug} role boot`, () => {
      const scene = useBeforeAll(async () => {
        const spec = getOneBootSpecOfRole({ slug });
        const emitted = getOneBootEmitted({ bootUri: spec.bootUri });
        return { spec, emitted };
      });

      when('[t0] its boot.yml is read', () => {
        then('it declares a token budget', () => {
          expect(scene.spec.budgetTokens).toBeGreaterThan(0);
        });

        then('its budget is the figure the owner set', () => {
          expect(scene.spec.budgetTokens).toEqual(BUDGET_SET_BY_OWNER[slug]);
        });

        then('its budget and `not` list match the snapshot', () => {
          expect({
            budgetTokens: scene.spec.budgetTokens,
            not: scene.spec.not,
          }).toMatchSnapshot();
        });
      });

      when('[t1] the briefs it boots at say are read whole', () => {
        then('every booted line matches the snapshot', () => {
          // every nonblank line, never a markup-cut: a cue written as prose must diff too
          const entries = scene.emitted.says.map((file) =>
            getOneLinesEntryOfFile({ file }),
          );
          expect(entries.length).toBeGreaterThan(0);
          expect(entries).toMatchSnapshot();
        });

        then('every cue a journey step names is booted, by name', () => {
          const absent = SAYS_REQUIRED[slug].filter(
            (file) => !scene.emitted.says.includes(file),
          );
          expect(absent).toEqual([]);
        });
      });

      when('[t2] each booted min is checked for its `.md`', () => {
        then('every booted min has its `.md` beside it', () => {
          expect(
            scene.emitted.says.some((file) => file.endsWith('.md.min')),
          ).toBe(true);
          expect(getAllMinsWithNoPeer({ files: scene.emitted.says })).toEqual(
            [],
          );
        });

        then('no booted min keeps a header whose section moved out', () => {
          expect(getAllHeadersOrphaned({ files: scene.emitted.says })).toEqual(
            [],
          );
        });

        then(
          'its boot carries the readme line that points each min to its `.md`',
          () => {
            // read from what `roles boot` emits, so the line reaches the reader, not merely the file
            expect(scene.emitted.stdout).toContain(LINE_OF_MIN_CONVENTION);
          },
        );
      });

      when('[t3] the real `rhachet roles boot` boots it', () => {
        then('it boots under its budget, at exit 0', () => {
          expect(scene.emitted.stderr).not.toContain('over budget');
          expect(scene.emitted.exitCode).toEqual(0);
        });

        then('the briefs it boots at ref match the snapshot', () => {
          // a parse that matches naught would snap `[]` and pass; each ref must be read and real
          expect(scene.emitted.refs.length).toBeGreaterThan(0);
          expect(getAllRefsAbsent({ refs: scene.emitted.refs })).toEqual([]);
          expect(scene.emitted.refs).toMatchSnapshot();
        });

        then('every brief it declares at say and at ref is booted', () => {
          // a typo, a dangled borrowed symlink, or a `not` glob over a say entry drops a brief
          // with no error and a lower payload; only a declared-vs-emitted check sees it
          expect(
            getAllDeclaredAbsentFromEmit({
              bootUri: scene.spec.bootUri,
              declared: scene.spec.say,
              emitted: scene.emitted.says,
            }),
          ).toEqual([]);
          expect(
            getAllDeclaredAbsentFromEmit({
              bootUri: scene.spec.bootUri,
              declared: scene.spec.ref,
              emitted: scene.emitted.refs,
            }),
          ).toEqual([]);
        });

        then(
          'the budget it enforces is the budget its boot.yml declares',
          () => {
            // the snapshot in [t0] reads the yaml; this binds that read to what the engine renders
            expect(scene.emitted.budgetRendered).toEqual(
              scene.spec.budgetTokens,
            );
          },
        );
      });

      when('[t4] it boots in the form a seat boots it', () => {
        const seat = useBeforeAll(async () =>
          getOneBootEmittedAsSeat({ slug }),
        );

        then('it boots under its budget, at exit 0', () => {
          expect(seat.stderr).not.toContain('over budget');
          expect(seat.exitCode).toEqual(0);
          expect(seat.budgetRendered).toEqual(scene.spec.budgetTokens);
          expect(
            asPayloadOfBootStats({ stdout: seat.stdout }),
          ).toBeLessThanOrEqual(scene.spec.budgetTokens!);
        });

        then('its seat payload is pinned, so growth is a snapshot diff', () => {
          // the payload a seat pays is the figure the budget caps; a null here means the parse missed
          const payload = asPayloadOfBootStats({ stdout: seat.stdout });
          expect(payload).not.toBeNull();
          expect({
            budget: scene.spec.budgetTokens,
            payload,
          }).toMatchSnapshot();
        });

        then(
          'its budget is the least multiple of 250 strictly above its seat payload',
          () => {
            // the rule each boot.yml comment states, held here so a loose budget fails too
            assertBudgetFitsSeatPayload({
              slug,
              payload: asPayloadOfBootStats({ stdout: seat.stdout })!,
              budget: scene.spec.budgetTokens!,
            });
          },
        );

        then(
          'its seat boot carries the readme line that points each min to its `.md`',
          () => {
            expect(seat.stdout).toContain(LINE_OF_MIN_CONVENTION);
          },
        );

        then('its seat payload is under the cap of any role', () => {
          assertRoleUnderCap({
            slug,
            budget: scene.spec.budgetTokens,
            payload: asPayloadOfBootStats({ stdout: seat.stdout }),
          });
        });
      });

      when('[t5] the real `rhachet roles cost --all` costs it', () => {
        then('its row reads owned, under its declared budget', () => {
          // the wish's first done-criterion is this render; an owned spec carries no `(linked)`
          const row = stripVTControlCharacters(roster.stdout)
            .split('\n')
            .find((line) =>
              line.endsWith(` ${path.relative(REPO_ROOT, scene.spec.bootUri)}`),
            )
            ?.replace(/^[\s├└│─]+/, '');
          expect(row).toBeDefined();
          const match = row!.match(/^([\d,]+) \/ ([\d,]+) tokens \(\d+%\)/);
          expect(match).not.toBeNull();
          expect(Number(match![2]!.replace(/,/g, ''))).toEqual(
            scene.spec.budgetTokens,
          );
          expect(Number(match![1]!.replace(/,/g, ''))).toBeLessThanOrEqual(
            scene.spec.budgetTokens!,
          );
          expect(
            row!.replace(/(?<![\w])\d[\d,]*(?![\w])/g, '<n>'),
          ).toMatchSnapshot();
        });
      });
    });
  });

  given('[case4] a boot spec over its budget', () => {
    const scene = useBeforeAll(async () => {
      // a fixture role dir: one brief, and a budget it cannot meet
      const dir = genTempDir({ slug: 'role-boot-over-budget' });
      setOneFixtureFile({
        file: path.join(dir, 'briefs', 'rule.require.probe.md'),
        lines: [
          '# rule.require.probe',
          '',
          'a fixture brief, long enough to cost more than its budget allows.',
          '',
          '| when… | then… |',
          '|---|---|',
          '| a boot runs over its budget | it halts, and prints its fix |',
          '',
        ],
      });
      const bootUri = path.join(dir, 'boot.yml');
      setOneFixtureFile({
        file: bootUri,
        lines: [
          'budget:',
          '  tokens: 10',
          'always:',
          '  briefs:',
          '    say:',
          '      - briefs/rule.require.probe.md',
          '',
        ],
      });
      return { dir, bootUri };
    });

    when('[t0] the real `rhachet roles boot` boots it', () => {
      const result = useBeforeAll(async () =>
        runRhachet({ args: ['roles', 'boot', '--what', scene.bootUri] }),
      );

      then('it halts as a constraint, at exit 2', () => {
        expect(result.exitCode).toEqual(2);
      });

      then('the halt names the budget and prints the fix strategies', () => {
        const output = `${result.stdout}\n${result.stderr}`;
        expect(output).toContain('over budget');
        expect(output).toContain('catalogize');
        expect(output).toContain('condense');
        expect(output).toContain('reference');
        expect(output).toContain('eliminate');
      });

      then(
        'the machine record after the tree names the hint, the counts, and the argv',
        () => {
          // .note = the snap below pins the tree a human reads; this pins the record rhachet
          //         prints after it, by value, so no fact in it goes unpinned
          const stderr = stripVTControlCharacters(result.stderr);
          expect(stderr).toContain(
            '✋ ConstraintError: boot payload exceeds its declared budget',
          );
          expect(stderr).toContain(
            '"hint": "trim a resource — catalogize a set, condense or ref a say entry, list one under `not` — or raise budget.tokens deliberately"',
          );
          expect(stderr).toContain('"budget": 10');
          expect(stderr).toMatch(/"payload": \d+/);
          expect(stderr).toMatch(/"over": \d+/);
          expect(stderr).toContain(`[args] roles,boot,--what,${scene.bootUri}`);

          // the record follows the tree: the tree's last fix, then the record's header, then argv
          const indexOfTreeEnd = stderr.indexOf('eliminate');
          const indexOfRecord = stderr.lastIndexOf(
            '✋ ConstraintError: boot payload exceeds its declared budget',
          );
          const indexOfArgs = stderr.indexOf('[args] roles,boot,--what,');
          expect(indexOfTreeEnd).toBeGreaterThan(-1);
          expect(indexOfRecord).toBeGreaterThan(indexOfTreeEnd);
          expect(indexOfArgs).toBeGreaterThan(indexOfRecord);

          // the bag's key set, in order: a key added to or dropped from the record turns red
          const bag = stderr.match(/\{\s*"hint"[\s\S]*?\n\}/)?.[0];
          expect(bag).toBeDefined();
          expect(Object.keys(JSON.parse(bag!))).toEqual([
            'hint',
            'budget',
            'payload',
            'over',
          ]);
        },
      );

      then('the halt tree matches the snapshot', () => {
        // .note = color codes vary by terminal and ci, and the temp dir varies by run, in both
        //         its absolute and its `.temp/genTempDir.symlink/` form. the dir path rides in the
        //         payload, so the token counts vary with it; the exit code and the four fixes are
        //         asserted above, so the counts are masked here
        // .note = the snap pins the tree a human reads. rhachet then restates the same halt as a
        //         machine record (the error again, a json bag, an argv row); that tail repeats
        //         each fact the tree already holds, so it is cut before the snap
        const asStable = (text: string): string =>
          stripVTControlCharacters(text)
            .split(/\n\s*\n✋ ConstraintError:/)[0]!
            .split(scene.dir)
            .join('<fixture>')
            .replace(/\.temp\/genTempDir\.symlink\/[^/\s]+/g, '<fixture>')
            .replace(/(payload\s+=\s+)\d+/g, '$1<n>')
            .replace(/(over by\s+=\s+)\d+( tokens\s+\()\d+%/g, '$1<n>$2<p>%')
            .trimEnd();
        // the halt writes naught to stdout; the tree is stderr, pinned in the shape [case6] pins
        expect(result.stdout).toEqual('');
        expect(asStable(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case5] a boot spec whose payload equals its budget exactly', () => {
    // the at-limit edge: a role that reaches its budget to the token must boot, never halt
    const scene = useBeforeAll(async () => {
      const dir = genTempDir({ slug: 'role-boot-at-budget' });
      setOneFixtureFile({
        file: path.join(dir, 'briefs', 'rule.require.probe.md'),
        lines: [
          '# rule.require.probe',
          '',
          'a fixture brief, read to its exact cost.',
          '',
        ],
      });
      const bootUri = path.join(dir, 'boot.yml');
      const asBootLines = (input: { tokens: number }): string[] => [
        'budget:',
        `  tokens: ${input.tokens}`,
        'always:',
        '  briefs:',
        '    say:',
        '      - briefs/rule.require.probe.md',
        '',
      ];

      // measure the payload with a budget it must exceed, then set the budget to that payload
      setOneFixtureFile({ file: bootUri, lines: asBootLines({ tokens: 1 }) });
      const measured = runRhachet({
        args: ['roles', 'boot', '--what', bootUri],
      });
      const payload = asPayloadOfHalt({
        output: `${measured.stdout}\n${measured.stderr}`,
      });
      setOneFixtureFile({
        file: bootUri,
        lines: asBootLines({ tokens: payload }),
      });
      return { bootUri, payload };
    });

    when('[t0] the real `rhachet roles boot` boots it', () => {
      const result = useBeforeAll(async () =>
        runRhachet({ args: ['roles', 'boot', '--what', scene.bootUri] }),
      );

      then('it boots at exit 0, with no headroom to spare', () => {
        expect(scene.payload).toBeGreaterThan(1);
        expect(result.exitCode).toEqual(0);
        expect(asBudgetOfBootStats({ stdout: result.stdout })).toEqual(
          scene.payload,
        );
      });

      then('the stats block shape matches the snapshot', () => {
        // .note = the temp dir rides in the payload, so every count varies by run and each one
        //         is masked as `<n>`. this pins the block's shape, root to leaf; the at-limit fact
        //         (budget equals payload) is asserted by number in the `then` above
        const lines = stripVTControlCharacters(result.stdout).split('\n');
        const indexOfBudget = lines.findIndex((line) =>
          line.includes('budget = '),
        );
        const indexOfRoot =
          lines
            .slice(0, indexOfBudget)
            .map((line, index) => ({ line, index }))
            .filter((entry) => !/^\s*[├└│]/.test(entry.line))
            .pop()?.index ?? indexOfBudget;
        expect(
          lines
            .slice(indexOfRoot, indexOfBudget + 1)
            .map((line) =>
              // a count stands alone; a digit inside a name (`o200k_base`) is kept
              line
                .trimEnd()
                .replace(/(?<![\w])\d[\d,]*(?![\w])/g, '<n>'),
            )
            .join('\n'),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case6] a linked seat whose role is over its budget', () => {
    // a seat links each role from a package (`.agent/repo=<pkg>/role=<slug>` → its dist). rhachet
    // treats a linked spec as foreign and warns rather than halts, so the halt is this repo's ci
    // and the seat sees a warn. this pins what the seat sees
    const scene = useBeforeAll(async () => {
      const root = genTempDir({ slug: 'role-boot-linked-seat' });
      const pkgRoleDir = path.join(root, 'pkg', 'role=probe');
      setOneFixtureFile({
        file: path.join(pkgRoleDir, 'briefs', 'rule.require.probe.md'),
        lines: [
          '# rule.require.probe',
          '',
          'a fixture brief, long enough to cost more than its budget allows.',
          '',
        ],
      });
      setOneFixtureFile({
        file: path.join(pkgRoleDir, 'boot.yml'),
        lines: [
          'budget:',
          '  tokens: 10',
          'always:',
          '  briefs:',
          '    say:',
          '      - briefs/rule.require.probe.md',
          '',
        ],
      });
      // a seat holds a real dir per role, each file in it a link into the package (`roles link`)
      const seatRoleDir = path.join(root, '.agent', 'repo=probe', 'role=probe');
      ['boot.yml', path.join('briefs', 'rule.require.probe.md')].forEach(
        (file) => {
          const at = path.join(seatRoleDir, file);
          fs.mkdirSync(path.dirname(at), { recursive: true });
          fs.symlinkSync(
            path.relative(path.dirname(at), path.join(pkgRoleDir, file)),
            at,
          );
        },
      );
      return { root };
    });

    when('[t0] the seat boots the linked role', () => {
      const result = useBeforeAll(async () =>
        runRhachet({
          args: [
            'roles',
            'boot',
            '--what',
            path.join('.agent', 'repo=probe', 'role=probe', 'boot.yml'),
          ],
          cwd: scene.root,
        }),
      );

      then('it boots at exit 0, and warns that the role is over budget', () => {
        expect(result.exitCode).toEqual(0);
        expect(
          stripVTControlCharacters(`${result.stdout}\n${result.stderr}`),
        ).toContain('over budget');
      });

      then('the warn the seat sees matches the snapshot', () => {
        // .note = the temp root varies by run and rides in the payload, so the counts are masked;
        //         the exit code and the warn are asserted above
        const asStable = (text: string): string =>
          stripVTControlCharacters(text)
            .split(scene.root)
            .join('<seat>')
            .replace(/\.temp\/genTempDir\.symlink\/[^/\s]+/g, '<seat>')
            .replace(/(payload\s+=\s+)[\d,]+/g, '$1<n>')
            .replace(/(over by\s+=\s+)[\d,]+( tokens\s+\()\d+%/g, '$1<n>$2<p>%')
            .replace(/(budget = )[\d,]+( \/ )/g, '$1<n>$2')
            .replace(/("(?:payload|over)": )\d+/g, '$1<n>')
            .trimEnd();
        expect(asStable(result.stderr)).toMatchSnapshot();
      });
    });
  });

  // every other budgeted role boots its briefs whole, so only its budget is held: red when the
  // role boots over it, green when under, and the budget is the step its seat payload owes. an
  // unregistered role is held the same way, booted from its own dir
  [...ROLES_BUDGET_ONLY, ...ROLES_UNREGISTERED].forEach((slug, index) => {
    given(`[case${index + 7}] the ${slug} role boot`, () => {
      const scene = useBeforeAll(async () => {
        const spec = getOneBootSpecOfRole({ slug });
        const emitted = getOneBootEmitted({ bootUri: spec.bootUri });
        return { spec, emitted };
      });

      when('[t0] the real `rhachet roles boot` boots it', () => {
        then('it boots under its declared budget, at exit 0', () => {
          expect(scene.spec.budgetTokens).toBeGreaterThan(0);
          expect(scene.emitted.stderr).not.toContain('over budget');
          expect(scene.emitted.exitCode).toEqual(0);
          expect(scene.emitted.budgetRendered).toEqual(scene.spec.budgetTokens);
        });
      });

      when('[t1] it boots in the form a seat boots it', () => {
        const seat = useBeforeAll(async () =>
          getOneBootEmittedAsSeat({ slug }),
        );

        then('it boots under its budget, at exit 0', () => {
          expect(seat.stderr).not.toContain('over budget');
          expect(seat.exitCode).toEqual(0);
          expect(seat.budgetRendered).toEqual(scene.spec.budgetTokens);
          expect(
            asPayloadOfBootStats({ stdout: seat.stdout }),
          ).toBeLessThanOrEqual(scene.spec.budgetTokens!);
        });

        then('its seat payload is pinned, so growth is a snapshot diff', () => {
          const payload = asPayloadOfBootStats({ stdout: seat.stdout });
          expect(payload).not.toBeNull();
          expect({
            budget: scene.spec.budgetTokens,
            payload,
          }).toMatchSnapshot();
        });

        then(
          'its budget is the least multiple of 250 strictly above its seat payload',
          () => {
            assertBudgetFitsSeatPayload({
              slug,
              payload: asPayloadOfBootStats({ stdout: seat.stdout })!,
              budget: scene.spec.budgetTokens!,
            });
          },
        );

        then('its seat payload is under the cap of any role', () => {
          assertRoleUnderCap({
            slug,
            budget: scene.spec.budgetTokens,
            payload: asPayloadOfBootStats({ stdout: seat.stdout }),
          });
        });

        then('its budget is the figure the owner set, where one is set', () => {
          // a role the owner set no figure for is held by the step and the cap alone
          const budgetOfOwner = BUDGET_SET_BY_OWNER[slug];
          if (budgetOfOwner === undefined) return;
          expect(scene.spec.budgetTokens).toEqual(budgetOfOwner);
        });
      });
    });
  });
});
