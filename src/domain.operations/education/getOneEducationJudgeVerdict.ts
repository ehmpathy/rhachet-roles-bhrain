import { existsSync } from 'fs';
import * as path from 'path';

import { asPedigreeDirRendered } from './asPedigreeDirRendered';
import { asPedigreeEntryName } from './asPedigreeEntryName';
import { asPursuitRouteParts } from './asPursuitRouteParts';
import { getAllPlotFaults } from './getAllPlotFaults';
import { getAllPlotRows } from './getAllPlotRows';
import { getOneBootBudgetVerdict } from './getOneBootBudgetVerdict';
import { getOneCourseExitReadiness } from './getOneCourseExitReadiness';
import { type EducationRole, getOneEducationRole } from './getOneEducationRole';
import { getOnePedigreeStamp } from './getOnePedigreeStamp';
import { getOnePursuitLedger } from './getOnePursuitLedger';
import { isCourseExited } from './isCourseExited';

/**
 * .what = whether a pedigree entry stands in a dir, repo-relative
 * .why = a linked role's stamp shows in its rendered view only after a clean render
 */
const isPedigreeEntryPresent = (input: {
  repoRoot: string;
  dir: string;
  entryName: string;
}): boolean =>
  existsSync(path.join(input.repoRoot, input.dir, input.entryName));

/**
 * .what = the criteria a judge on an education route can rule on
 * .note = `criterion`, never `check`: `check` is a forbidden synonym of `route.guard.judge`;
 *         a criterion is the fact one judge reads, a child concept of it
 */
export type EducationJudgeCriterion =
  | 'plot-valid'
  | 'courses-exited'
  | 'pedigree-stamped'
  | 'boot-within-budget'
  | 'exited';

/**
 * .what = a judge's verdict, in the shape the guard's judge parser reads
 */
type EducationJudgeVerdict = { passed: boolean; reason: string };

/**
 * .what = one judge's input: the repo and the route it rules on
 */
type EducationJudgeInput = { repoRoot: string; route: string };

/**
 * .what = the `6.exit` judge: every prior stone passed, and exit itself passed the course
 */
const judgeExited = async (
  input: EducationJudgeInput,
): Promise<EducationJudgeVerdict> => {
  const readiness = await getOneCourseExitReadiness({ route: input.route });
  if (!readiness.ready) return { passed: false, reason: readiness.reason };
  if (!(await isCourseExited({ route: input.route })))
    return {
      passed: false,
      reason:
        'a course ends only by exit; run: rhx education.pursuit.course exit',
    };
  return { passed: true, reason: 'the exit is recorded' };
};

/**
 * .what = the `1.courses.plot` judge: the plot names sound, distinct, ordered courses
 */
const judgePlotValid = async (
  input: EducationJudgeInput,
): Promise<EducationJudgeVerdict> => {
  const faults = getAllPlotFaults({
    rows: getAllPlotRows({ pursuitRoute: input.route }),
  });
  if (faults.length > 0)
    return {
      passed: false,
      reason: `the plot has faults: ${faults.join('; ')}; repair ${input.route}/1.courses.plot.yield.md`,
    };
  return { passed: true, reason: 'the plot names sound courses, in order' };
};

/**
 * .what = the `2.courses.pursue` judge: every plotted course exited, and none left open
 */
const judgeCoursesExited = async (
  input: EducationJudgeInput,
): Promise<EducationJudgeVerdict> => {
  const ledger = await getOnePursuitLedger({ pursuitRoute: input.route });
  if (ledger.plotted.length === 0)
    return {
      passed: false,
      reason: 'the plot names no course; write 1.courses.plot.yield.md',
    };
  if (ledger.plotFaults.length > 0)
    return {
      passed: false,
      reason: `the plot has faults: ${ledger.plotFaults.join('; ')}; repair ${input.route}/1.courses.plot.yield.md`,
    };
  if (ledger.owed.length > 0)
    return {
      passed: false,
      reason: `courses not yet exited: ${ledger.owed.join(', ')}; run: rhx education.pursuit.course init --course ${ledger.owed[0]}`,
    };
  const strayOpen = ledger.open[0];
  if (strayOpen)
    return {
      passed: false,
      reason: `course ${strayOpen.slug} is open, though the plot no longer names it; re-enter it and drive it to exit: rhx education.pursuit.course init --course ${strayOpen.slug}`,
    };
  return {
    passed: true,
    reason: `all ${ledger.plotted.length} plotted courses have exited`,
  };
};

/**
 * .what = the role a pursuit route educates, with the route's date and slug; null off a pursuit
 */
const getOnePursuitOfRoute = (
  input: EducationJudgeInput,
): {
  role: EducationRole;
  parts: NonNullable<ReturnType<typeof asPursuitRouteParts>>;
} | null => {
  const parts = asPursuitRouteParts({ route: input.route });
  if (!parts) return null;
  const role = getOneEducationRole({
    repoRoot: input.repoRoot,
    slug: parts.role,
  });
  return { role, parts };
};

/**
 * .what = the `4.graduate` budget judge: the role still boots within its declared budget
 */
const judgeBootWithinBudget = async (
  input: EducationJudgeInput,
): Promise<EducationJudgeVerdict> => {
  const pursuit = getOnePursuitOfRoute(input);
  if (!pursuit)
    return { passed: false, reason: `${input.route} is no pursuit route` };
  return getOneBootBudgetVerdict({
    repoRoot: input.repoRoot,
    role: pursuit.role,
  });
};

/**
 * .what = the `4.graduate` stamp judge: the entry, the index that lists it, and the boot spec hold
 */
const judgePedigreeStamped = async (
  input: EducationJudgeInput,
): Promise<EducationJudgeVerdict> => {
  const pursuit = getOnePursuitOfRoute(input);
  if (!pursuit)
    return { passed: false, reason: `${input.route} is no pursuit route` };
  const { role, parts } = pursuit;
  const entryName = asPedigreeEntryName({ date: parts.date, slug: parts.slug });
  const stamp = getOnePedigreeStamp({
    repoRoot: input.repoRoot,
    role,
    date: parts.date,
    slug: parts.slug,
  });
  if (!stamp.entry)
    return {
      passed: false,
      reason: 'the pedigree entry is absent; run: rhx education.pedigree set',
    };
  if (!stamp.index)
    return {
      passed: false,
      reason: `the pedigree index does not list the entry (${stamp.indexPath}); re-stamp: rhx education.pedigree set`,
    };
  if (!stamp.boot)
    return {
      passed: false,
      reason: `the boot spec does not name the pedigree (${role.bootPath}); re-stamp: rhx education.pedigree set`,
    };

  // a linked role boots its mod only once a render lands clean
  const dirRendered = asPedigreeDirRendered({ role });
  const rendered =
    !dirRendered ||
    isPedigreeEntryPresent({
      repoRoot: input.repoRoot,
      dir: dirRendered,
      entryName,
    });
  if (!rendered)
    return {
      passed: false,
      reason:
        'the pedigree entry is stamped in the mod, but no clean render has reached the role; run: rhx init --hooks, and clear any refusal it names',
    };
  return { passed: true, reason: 'the pedigree entry is stamped' };
};

/**
 * .what = each criterion, the kind of route it rules on, and its judge
 * .why = one table: a criterion added to the union fails to compile until it is judged here, and
 *        each face derives the criteria it accepts from it, never from a copied list
 */
const JUDGES_OF_CRITERION: Record<
  EducationJudgeCriterion,
  {
    routeKind: 'pursuit' | 'course';
    judge: (input: EducationJudgeInput) => Promise<EducationJudgeVerdict>;
  }
> = {
  'plot-valid': { routeKind: 'pursuit', judge: judgePlotValid },
  'courses-exited': { routeKind: 'pursuit', judge: judgeCoursesExited },
  'pedigree-stamped': { routeKind: 'pursuit', judge: judgePedigreeStamped },
  'boot-within-budget': { routeKind: 'pursuit', judge: judgeBootWithinBudget },
  exited: { routeKind: 'course', judge: judgeExited },
};

/**
 * .what = the criteria a judge on one kind of route may rule on, in table order
 */
export const getAllEducationJudgeCriteria = (input: {
  routeKind: 'pursuit' | 'course';
}): EducationJudgeCriterion[] =>
  (Object.keys(JUDGES_OF_CRITERION) as EducationJudgeCriterion[]).filter(
    (criterion) => JUDGES_OF_CRITERION[criterion].routeKind === input.routeKind,
  );

/**
 * .what = the verdict of one judge criterion on an education route
 * .why = each stone passes only on a fact a driver cannot fake by hand: the plot sound
 *        (`1.courses.plot`), every plotted course exited (`2.courses.pursue`), the pedigree
 *        entry written and the boot still within budget (`4.graduate`), the exit recorded
 *        (`6.exit`)
 */
export const getOneEducationJudgeVerdict = async (input: {
  repoRoot: string;
  route: string;
  criterion: EducationJudgeCriterion;
}): Promise<EducationJudgeVerdict> =>
  JUDGES_OF_CRITERION[input.criterion].judge({
    repoRoot: input.repoRoot,
    route: input.route,
  });
