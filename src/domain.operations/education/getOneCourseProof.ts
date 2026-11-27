import { existsSync, readFileSync } from 'fs';
import { ConstraintError } from 'helpful-errors';
import * as path from 'path';

import { asBootClaim } from './asBootClaim';
import { asBootClaimsBeforePath } from './asBootClaimsBeforePath';
import { asBootSpecNames } from './asBootSpecNames';
import { asBriefsKeyOfMode } from './asBootSpecWithBriefs';
import { asBuildsOnSlugs } from './asBuildsOnSlugs';
import { asMarkdownTableRows } from './asMarkdownTableRows';
import { getAllBriefClaimsOfRole } from './getAllBriefClaimsOfRole';
import type { CourseRoute } from './getAllCourseRoutes';
import { getAllPlotRows } from './getAllPlotRows';
import { getOneBootSpecModeOfRole } from './getOneBootSpecModeOfRole';
import type { EducationRole } from './getOneEducationRole';
import { isPathInside } from './isPathInside';

/**
 * .what = what one course proved, as its yields record it
 * .why = the pedigree entry cites each course by this shape
 */
export interface CourseProof {
  ordinal: number;
  slug: string;
  route: string;
  /** the course slugs this one builds on, per the plot; empty when none */
  buildsOn: string[];
  outcome: { baseline: string; after: string; transfer: string };
  greats: string[];
  claims: Array<{ claim: string; verdict: ClaimVerdict }>;
  yields: Array<{ path: string; kind: YieldKind; boot: 'say' | 'ref' | null }>;
}

/**
 * .what = the verdicts the vitro stone defines for a claim
 */
const CLAIM_VERDICTS = ['held', 'refuted', 'untested'] as const;
export type ClaimVerdict = (typeof CLAIM_VERDICTS)[number];

/**
 * .what = the kinds of artifact the entool stone writes
 */
const YIELD_KINDS = ['brief', 'skill'] as const;
export type YieldKind = (typeof YIELD_KINDS)[number];

/**
 * .what = the hint for a yield the reader refuses: edit it in place, then re-run
 * .why = exit reads the proof once every prior stone has passed, so `route.drive` would show
 *        `6.exit` again; the yield is fixed where it stands, bound or exited alike
 */
const asYieldRepairHint = (input: { stone: string; at: string }): string =>
  `edit ${input.at} in place, in the shape ${input.stone} shows, then re-run`;

/**
 * .what = a yield's text; refuses when the yield is absent
 * .why = the pedigree cites each course from its yields, so an absent yield is a gap the
 *        driver must fill, never a course stamped with blanks
 */
const getOneYieldText = (input: { route: string; stone: string }): string => {
  const at = path.join(input.route, `${input.stone}.yield.md`);
  if (!existsSync(at))
    throw new ConstraintError(`the yield of ${input.stone} is absent`, {
      at,
      hint: asYieldRepairHint({ stone: input.stone, at }),
    });
  return readFileSync(at, 'utf-8');
};

/**
 * .what = a cell as one of the values allowed; refuses any other
 * .why = a verdict, kind, or boot cell the pedigree counts must be one it knows, or a tally
 *        drops it without a trace
 */
const asCellOneOf = <T extends string>(input: {
  cell: string;
  allowed: readonly T[];
  column: string;
  at: string;
}): T => {
  const value = input.cell.trim().toLowerCase();
  const found = input.allowed.find((allowed) => allowed === value);
  if (found) return found;
  throw new ConstraintError(`a course yield holds an unknown ${input.column}`, {
    at: input.at,
    value: input.cell,
    allowed: input.allowed,
    hint: `use one of: ${input.allowed.join(', ')}`,
  });
};

/**
 * .what = a score line value as `n/m`, whole numbers, n no more than m; refuses any other
 * .why = the before and after scores are what the pedigree claims moved, so each must read as a
 *        count a program can compare
 */
const asScore = (input: { value: string; at: string }): string => {
  const match = /^(\d+)\s*\/\s*(\d+)$/.exec(input.value);
  if (!match || Number(match[1]) > Number(match[2]))
    throw new ConstraintError('a course yield holds a score that is no n/m', {
      at: input.at,
      value: input.value,
      hint: 'write the score as passed/total, e.g. `score = 2/3`',
    });
  return `${Number(match[1])}/${Number(match[2])}`;
};

/**
 * .what = the transfer verdicts the assess stone defines
 */
const TRANSFER_VERDICTS = ['passed', 'failed'] as const;

/**
 * .what = the first table whose header holds every named column; refuses when none does
 * .why = a yield may hold several tables; the columns name the one the stone asked for, so a
 *        stray table never feeds the pedigree
 */
const getOneTableByColumns = (input: {
  markdown: string;
  columns: string[];
  at: string;
}): { rows: Array<Record<string, string>> } => {
  const rows = asMarkdownTableRows({
    markdown: input.markdown,
    columns: input.columns,
  });
  if (!rows)
    throw new ConstraintError(
      'a course yield lacks the table the pedigree reads',
      {
        at: input.at,
        columnsExpected: input.columns,
        hint: `add a table with the header | ${input.columns.join(' | ')} |, as its stone shows`,
      },
    );
  return { rows };
};

/**
 * .what = the value of a `name = value` line; refuses when absent
 * .why = the score and transfer lines are the outcome the pedigree records; a course with no
 *        score has proved naught yet
 */
const getOneLineValue = (input: {
  markdown: string;
  name: string;
  at: string;
}): string => {
  const match = new RegExp(`^${input.name}\\s*=\\s*(.+)$`, 'm').exec(
    input.markdown,
  );
  if (!match)
    throw new ConstraintError(
      `a course yield lacks its \`${input.name} = …\` line`,
      {
        at: input.at,
        hint: `add a line \`${input.name} = …\`, as its stone shows`,
      },
    );
  return match[1]!.trim();
};

/**
 * .what = the slugs a course builds on, per the plot's `builds on` column
 * .why = the plot holds the order; a course absent from it builds on none
 */
const getAllBuildsOn = (input: {
  pursuitRoute: string;
  slug: string;
}): string[] => {
  const row = getAllPlotRows({ pursuitRoute: input.pursuitRoute }).find(
    (plotRow) => plotRow.course === input.slug,
  );
  return asBuildsOnSlugs({ cell: row?.['builds on'] ?? '' });
};

/**
 * .what = the path of a stone's yield within a course route
 */
const asYieldPath = (input: { route: string; stone: string }): string =>
  path.join(input.route, `${input.stone}.yield.md`);

/**
 * .what = the rows of the one table a stone's yield holds under the named columns
 * .why = each pedigree read is one stone, one table; this pairs the read with the refusal
 *        path, so a fault names the yield it came from
 */
const getAllYieldTableRows = (input: {
  route: string;
  stone: string;
  columns: string[];
}): Array<Record<string, string>> =>
  getOneTableByColumns({
    markdown: getOneYieldText({ route: input.route, stone: input.stone }),
    columns: input.columns,
    at: asYieldPath({ route: input.route, stone: input.stone }),
  }).rows;

/**
 * .what = the distinct greats a course read, in first-read order
 * .why = a great read twice (two works) is one great on the pedigree
 */
const asGreatsDistinct = (input: {
  rows: Array<Record<string, string>>;
}): string[] => [...new Set(input.rows.map((row) => row.great!))];

/**
 * .what = each claim of the vitro table, with its verdict; refuses a verdict the stone does not define
 */
const asClaimsOfRows = (input: {
  rows: Array<Record<string, string>>;
  at: string;
}): CourseProof['claims'] =>
  input.rows.map((row) => ({
    claim: row.claim!,
    verdict: asCellOneOf({
      cell: row.verdict!,
      allowed: CLAIM_VERDICTS,
      column: 'verdict',
      at: input.at,
    }),
  }));

/**
 * .what = each artifact of the entool table, with its kind and boot key; refuses a kind or a
 *         boot key the stone does not define
 */
const asYieldsOfRows = (input: {
  rows: Array<Record<string, string>>;
  at: string;
}): CourseProof['yields'] =>
  input.rows.map((row) => {
    const kind = asCellOneOf({
      cell: row.kind!,
      allowed: YIELD_KINDS,
      column: 'kind',
      at: input.at,
    });
    const boot =
      kind === 'brief'
        ? asCellOneOf({
            cell: row.boot ?? '',
            allowed: ['say', 'ref'] as const,
            column: 'boot',
            at: input.at,
          })
        : null;
    return { path: row.path!, kind, boot };
  });

/**
 * .what = fold each `.md.min` row into its `.md` brief: one brief per pair, keyed by the `.md`
 * .why = a `.md.min` condenses the `.md` beside it, and rhachet boots it in the `.md`'s place,
 *        so the pair is one brief. a boot spec names the `.md` only; a `.min` row would count
 *        twice on the pedigree and fail the boot check against a name no spec carries
 * .note = a `.md` row wins over its `.min` row; a `.min` row alone stands for its `.md`
 */
const asYieldsFoldedOfMinPeers = (input: {
  yields: CourseProof['yields'];
}): CourseProof['yields'] => {
  const asPeerOfMin = (y: CourseProof['yields'][number]) =>
    y.kind === 'brief' && y.path.endsWith('.md.min')
      ? { ...y, path: y.path.slice(0, -'.min'.length) }
      : y;
  const pathsOfMd = new Set(
    input.yields.filter((y) => !y.path.endsWith('.md.min')).map((y) => y.path),
  );
  return input.yields
    .filter(
      (y) =>
        !(
          y.kind === 'brief' &&
          y.path.endsWith('.md.min') &&
          pathsOfMd.has(asPeerOfMin(y).path)
        ),
    )
    .map(asPeerOfMin);
};

/**
 * .what = refuse an entool row whose artifact the role does not hold, or whose brief its boot
 *         spec does not name where the row says
 * .why = the pedigree states "N briefs, M skills"; that is the one fact in it a program can check,
 *        so a row that cites a path never written, or a brief the role never boots, is refused
 * .note = an own or native role with no boot spec boots its briefs by default, so a brief there
 *         needs only to exist
 */
const assertYieldsHeldByRole = (input: {
  yields: CourseProof['yields'];
  repoRoot: string;
  role: EducationRole;
  at: string;
}): void => {
  // every path sits in the role's briefs or skills dir, and exists there
  const dirsOfRole = [input.role.briefsDir, input.role.skillsDir];
  const absent = input.yields.filter(
    (y) =>
      !dirsOfRole.some((dir) => isPathInside({ dir, path: y.path })) ||
      !existsSync(path.join(input.repoRoot, y.path)),
  );
  if (absent.length > 0)
    throw new ConstraintError(
      'a course yield cites an artifact the role does not hold',
      {
        at: input.at,
        pathsAbsent: absent.map((y) => y.path),
        dirsOfRole,
        hint: 'write each artifact into the role dirs, or drop its row from the table',
      },
    );

  // every brief is booted where its row says, by the rules of the spec's mode; a role with no
  //   spec reads as a role spec with no section, which says every brief
  const bootAbs = path.join(input.repoRoot, input.role.bootPath);
  const names = existsSync(bootAbs)
    ? asBootSpecNames({
        spec: readFileSync(bootAbs, 'utf-8'),
        at: input.role.bootPath,
      })
    : asBootSpecNames({ spec: '', at: input.role.bootPath });
  const mode =
    names.mode ??
    getOneBootSpecModeOfRole({
      repoRoot: input.repoRoot,
      role: input.role,
    }) ??
    'simple';
  const isRoleSpec = input.role.kind !== 'linked';
  const roleDir = path.dirname(input.role.bootPath);
  const claimOf = (y: CourseProof['yields'][number]) =>
    asBootClaim({
      curation: y.kind === 'brief' ? names.briefs : names.skills,
      mode: names.mode,
      isRoleSpec,
      path: path.relative(roleDir, y.path),
    });
  const unbooted = input.yields.filter(
    (y) => y.kind === 'brief' && y.boot !== null && claimOf(y) !== y.boot,
  );
  if (unbooted.length > 0)
    throw new ConstraintError(
      'a course yield cites a brief the boot spec does not name',
      {
        at: input.at,
        bootPath: input.role.bootPath,
        briefsUnbooted: unbooted.map((y) => `${y.path} (${y.boot})`),
        hint: existsSync(bootAbs)
          ? `name each under ${asBriefsKeyOfMode({ mode })}.<say|ref> in ${input.role.bootPath}, as a path relative to ${roleDir}`
          : `the role has no boot spec, so every brief boots at say: mark each row \`say\`, or write ${input.role.bootPath} with a \`briefs.ref\` list alone (a \`say\` key there would narrow the boot)`,
      },
    );

  // a linked role's mod adds a skill only where its spec names it; rhachet refuses the rest
  const skillsUnnamed =
    input.role.kind === 'linked'
      ? input.yields.filter((y) => y.kind === 'skill' && claimOf(y) === null)
      : [];
  if (skillsUnnamed.length > 0)
    throw new ConstraintError(
      'a course yield cites a skill the mod boot spec does not name',
      {
        at: input.at,
        bootPath: input.role.bootPath,
        skillsUnnamed: skillsUnnamed.map((y) => y.path),
        hint: `name each under ${mode === 'subject' ? 'always.skills' : 'skills'}.<say|ref> in ${input.role.bootPath}, as a path relative to ${roleDir}; rhachet refuses a mod that adds a skill no say or ref names`,
      },
    );
};

/**
 * .what = the id a claim cell leads with: `k1 natural-key upsert…` → `k1`
 */
const asClaimId = (input: { claim: string }): string =>
  input.claim.trim().split(/\s+/)[0] ?? '';

/**
 * .what = each claim id a blueprint cell cites: `k1, k3` → `['k1', 'k3']`
 */
const asClaimIdsOfCell = (input: { cell: string }): string[] =>
  input.cell
    .split(/[,\s]+/)
    .map((id) => id.trim())
    .filter((id) => id !== '');

/**
 * .what = whether an entool path is the one a blueprint row plans; a blueprint names a path
 *         relative to the role dir it lands in, an entool row names it from the repo root
 */
const isPathOfPlan = (input: {
  yieldPath: string;
  planPath: string;
}): boolean =>
  input.yieldPath === input.planPath ||
  input.yieldPath.endsWith(`/${input.planPath}`);

/**
 * .what = refuse a blueprint row that rests on a refuted claim or on one the practice never
 *         tested, and an entool yield the blueprint did not plan
 * .why = a refuted claim stays out of the role: the blueprint is where each artifact names the
 *        claim it rests on, and the entool writes only what the blueprint planned, so a brief
 *        that leans on a refuted claim cannot reach the role by either door
 */
const assertBlueprintHeld = (input: {
  route: string;
  claims: CourseProof['claims'];
  yields: CourseProof['yields'];
}): void => {
  const at = asYieldPath({ route: input.route, stone: '4.1.entool.blueprint' });
  const plan = getAllYieldTableRows({
    route: input.route,
    stone: '4.1.entool.blueprint',
    columns: ['path', 'kind', 'claims'],
  });
  const verdictOf = new Map(
    input.claims.map((c) => [asClaimId({ claim: c.claim }), c.verdict]),
  );

  // each planned artifact rests only on claims the practice held or tested
  const faults = plan.flatMap((row) =>
    asClaimIdsOfCell({ cell: row.claims! }).flatMap((id) => {
      const verdict = verdictOf.get(id);
      if (verdict === 'refuted')
        return [`${row.path} rests on ${id} (refuted)`];
      if (verdict === undefined)
        return [`${row.path} rests on ${id} (not in the vitro table)`];
      return [];
    }),
  );
  if (faults.length > 0)
    throw new ConstraintError(
      'a blueprint row rests on a claim the practice did not hold',
      {
        at,
        faults,
        hint: 'drop the claim from the row, or drop the row; a refuted claim stays out of the role. a claim not yet tested belongs in the vitro table first',
      },
    );

  // each entool yield is one the blueprint planned
  const unplanned = input.yields.filter(
    (y) =>
      !plan.some((row) =>
        isPathOfPlan({ yieldPath: y.path, planPath: row.path! }),
      ),
  );
  if (unplanned.length > 0)
    throw new ConstraintError(
      'a course yield writes an artifact the blueprint did not plan',
      {
        at: asYieldPath({ route: input.route, stone: '4.2.entool.execute' }),
        pathsUnplanned: unplanned.map((y) => y.path),
        hint: `plan each in ${at}, with the held claims it rests on, or drop its row`,
      },
    );
};

/**
 * .what = refuse a boot spec that moves a brief the role held before the course
 * .why = a role with no spec boots every brief at `say`; a spec the course writes with a `say`
 *        key moves the rest to `ref` (simple mode) or out of the boot (subject mode), and a
 *        course yield names only the new briefs, so no other check sees the old ones go
 * .note = reads the record course init wrote; a course with no record (a linked role) skips
 * .note = a brief the course names as a yield may move on purpose (a demotion the blueprint
 *         planned); its row's `boot` cell is checked by assertYieldsHeldByRole instead
 */
const assertBootClaimsKept = (input: {
  repoRoot: string;
  role: EducationRole;
  route: string;
  yields: CourseProof['yields'];
}): void => {
  const beforeAt = asBootClaimsBeforePath({
    repoRoot: input.repoRoot,
    route: input.route,
  });
  if (!existsSync(beforeAt)) return;
  const before = JSON.parse(readFileSync(beforeAt, 'utf-8')) as Record<
    string,
    'say' | 'ref' | null
  >; // .note = our own record, written by genBootClaimsBefore
  const now =
    getAllBriefClaimsOfRole({ repoRoot: input.repoRoot, role: input.role }) ??
    {};
  const roleDir = path.dirname(input.role.bootPath);
  const yieldPaths = input.yields.map((y) => path.relative(roleDir, y.path));
  const moved = Object.entries(before).filter(
    ([p, claim]) => p in now && now[p] !== claim && !yieldPaths.includes(p),
  );
  if (moved.length === 0) return;
  throw new ConstraintError(
    'the boot spec moves briefs the role booted before the course',
    {
      bootPath: input.role.bootPath,
      briefsMoved: moved.map(
        ([p, claim]) => `${p} (${claim ?? 'none'} → ${now[p] ?? 'none'})`,
      ),
      hint: `boot each as it booted before: in a simple spec, drop the \`say\` key and name new briefs under \`briefs.ref\`; in a subject spec, name each moved brief where it was. then re-run`,
    },
  );
};

/**
 * .what = refuse an assess below the bar: a transfer task failed, or a task short of its pass bar
 * .why = the assess stone sends a course below the bar back to its weakest phase; a pedigree that
 *        records a failed transfer under a graduated pursuit claims a move that did not land
 */
const assertOutcomeAtBar = (input: {
  outcome: CourseProof['outcome'];
  at: string;
}): void => {
  const [passed, total] = input.outcome.after.split('/').map(Number);
  if (input.outcome.transfer === 'passed' && passed === total) return;
  throw new ConstraintError('the assess is below the bar', {
    at: input.at,
    score: input.outcome.after,
    transfer: input.outcome.transfer,
    hint: 'return to the weakest phase (2.2 for a gap in the canon, 3 for an untested claim, 4.1 for a brief the role did not reach for): rhx route.stone.set --stone <phase> --as rewound, then drive back through and assess again',
  });
};

/**
 * .what = refuse an outcome that cannot show a move: totals that differ, or a baseline at the bar
 * .why = the pedigree prints `baseline → after` as what the course changed. two totals give no
 *        comparison (`1/3 → 4/4`), and a baseline already at the bar holds no gap to close
 */
const assertOutcomeMoved = (input: {
  outcome: CourseProof['outcome'];
  baselineAt: string;
  assessAt: string;
}): void => {
  const [baselinePassed, baselineTotal] = input.outcome.baseline
    .split('/')
    .map(Number);
  const [, afterTotal] = input.outcome.after.split('/').map(Number);
  if (baselineTotal !== afterTotal)
    throw new ConstraintError(
      'the baseline and the assess score a different number of tasks',
      {
        baselineAt: input.baselineAt,
        assessAt: input.assessAt,
        baseline: input.outcome.baseline,
        after: input.outcome.after,
        hint: 'score the same task set at both stones; the assess reruns the baseline tasks, so its total matches',
      },
    );
  if (baselinePassed === baselineTotal)
    throw new ConstraintError('the baseline already sits at the bar', {
      baselineAt: input.baselineAt,
      baseline: input.outcome.baseline,
      hint: 'a course closes a gap the baseline shows; pick tasks the role fails today, then drive back through: rhx route.stone.set --stone 1.1.outcome.declare --as rewound',
    });
};

/**
 * .what = the course's outcome: baseline score, assess score, transfer task
 * .why = the before and after scores are what the pedigree claims the course changed
 * .note = refuses an outcome with no move (`assertOutcomeMoved`) or below the bar
 *         (`assertOutcomeAtBar`)
 */
const getOneCourseOutcome = (input: {
  route: string;
}): CourseProof['outcome'] => {
  const { route } = input;
  const baselineText = getOneYieldText({
    route,
    stone: '1.2.outcome.baseline',
  });
  const baselineAt = asYieldPath({ route, stone: '1.2.outcome.baseline' });
  const assessText = getOneYieldText({ route, stone: '5.1.outcome.assess' });
  const assessAt = asYieldPath({ route, stone: '5.1.outcome.assess' });
  const outcome = {
    baseline: asScore({
      value: getOneLineValue({
        markdown: baselineText,
        name: 'score',
        at: baselineAt,
      }),
      at: baselineAt,
    }),
    after: asScore({
      value: getOneLineValue({
        markdown: assessText,
        name: 'score',
        at: assessAt,
      }),
      at: assessAt,
    }),
    transfer: asCellOneOf({
      cell: getOneLineValue({
        markdown: assessText,
        name: 'transfer',
        at: assessAt,
      }),
      allowed: TRANSFER_VERDICTS,
      column: 'transfer',
      at: assessAt,
    }),
  };
  assertOutcomeMoved({ outcome, baselineAt, assessAt });
  assertOutcomeAtBar({ outcome, at: assessAt });
  return outcome;
};

/**
 * .what = read what one course proved, from its fixed-shape yields
 * .why = the pedigree stamps each course with its outcome, greats, claims, and yields; `exit`
 *        reads it too, while the course is bound, so a gap is fixed by a drive, not by hand
 * .note = refuses (ConstraintError) when a yield or its table is absent, a cell is no value the
 *         stone defines, or an entool row cites an artifact the role does not hold
 */
export const getOneCourseProof = (input: {
  course: CourseRoute;
  pursuitRoute: string;
  repoRoot: string;
  role: EducationRole;
}): CourseProof => {
  const { route } = input.course;
  const entoolAt = asYieldPath({ route, stone: '4.2.entool.execute' });
  const yields = asYieldsFoldedOfMinPeers({
    yields: asYieldsOfRows({
      rows: getAllYieldTableRows({
        route,
        stone: '4.2.entool.execute',
        columns: ['path', 'kind', 'boot'],
      }),
      at: entoolAt,
    }),
  });
  assertYieldsHeldByRole({
    yields,
    repoRoot: input.repoRoot,
    role: input.role,
    at: entoolAt,
  });
  assertBootClaimsKept({
    repoRoot: input.repoRoot,
    role: input.role,
    route,
    yields,
  });
  const claims = asClaimsOfRows({
    rows: getAllYieldTableRows({
      route,
      stone: '3.practice.vitro',
      columns: ['claim', 'verdict'],
    }),
    at: asYieldPath({ route, stone: '3.practice.vitro' }),
  });
  assertBlueprintHeld({ route, claims, yields });
  return {
    ordinal: input.course.ordinal,
    slug: input.course.slug,
    route,
    buildsOn: getAllBuildsOn({
      pursuitRoute: input.pursuitRoute,
      slug: input.course.slug,
    }),
    outcome: getOneCourseOutcome({ route }),
    greats: asGreatsDistinct({
      rows: getAllYieldTableRows({
        route,
        stone: '2.2.greats.read',
        columns: ['great', 'work'],
      }),
    }),
    claims,
    yields,
  };
};
