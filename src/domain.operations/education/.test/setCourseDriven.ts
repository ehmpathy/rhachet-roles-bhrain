import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import { setPassageReport } from '@src/domain.operations/route/passage/setPassageReport';

import { asBootSpecWithBriefs } from '../asBootSpecWithBriefs';
import { asCourseRouteParts } from '../asCourseRouteParts';
import { asPursuitRouteParts } from '../asPursuitRouteParts';
import { getOneBootSpecModeOfRole } from '../getOneBootSpecModeOfRole';
import { type EducationRole, getOneEducationRole } from '../getOneEducationRole';

/**
 * .what = the yields a driver writes on each course stone, in the shapes the stones show
 * .why = `pedigree set` reads fixed tables from these yields (scores, greats, claims, paths),
 *        so a fixture that drives a course must write them in those shapes
 * .note = the entool yield names a brief in the role's own briefs dir; `setCourseDriven` fills
 *         it in, since the course proof refuses a path the role does not hold
 */
export const YIELDS_OF_COURSE: Record<string, string> = {
  '1.1.outcome.declare':
    '| task | does | pass bar | held back |\n|---|---|---|---|\n| t1 | replay | one row | no |\n',
  '1.2.outcome.baseline':
    '| task | result | note |\n|---|---|---|\n| t1 | failed | dupes |\n\nscore = 1/4\n',
  '2.1.greats.aim':
    '| great | work | why | addresses |\n|---|---|---|---|\n| helland | idempotence | named it | t1 |\n',
  '2.2.greats.read': [
    '| great | work | read at |',
    '|---|---|---|',
    '| helland | idempotence is not a medical condition | acm queue |',
    '| kleppmann | ddia | ch. 11 |',
    '',
    '| kernel | claim | great | page |',
    '|---|---|---|---|',
    '| k1 upsert dedupes | yes | helland | p.3 |',
    '',
  ].join('\n'),
  '3.practice.vitro': [
    '| claim | verdict | evidence |',
    '|---|---|---|',
    '| k1 natural-key upsert dedupes a replay | held | 3 replays, 1 row |',
    '| k7 backoff alone makes a write safe | refuted | 2 dupes |',
    '',
  ].join('\n'),
  '4.1.entool.blueprint':
    '| path | kind | claims | serves |\n|---|---|---|---|\n| rule.x.md | brief | k1 | t1 |\n',
  '4.2.entool.execute':
    '| path | kind | boot |\n|---|---|---|\n| $BRIEFS_DIR/rule.x.md | brief | say |\n',
  '5.1.outcome.assess':
    '| task | result | note |\n|---|---|---|\n| t1 | passed | cited rule.x |\n\nscore = 4/4\ntransfer = passed\n',
  '5.2.outcome.reflect': 'kept the replay harness; next, retries.\n',
};

/**
 * .what = the role a course route educates, looked up from the repo at cwd
 */
const getOneRoleOfCourse = (input: { route: string }): EducationRole => {
  const pursuit = asCourseRouteParts({ route: input.route })!.pursuit;
  const parts = asPursuitRouteParts({ route: pursuit })!;
  return getOneEducationRole({ repoRoot: process.cwd(), slug: parts.role });
};

/**
 * .what = write the brief the entool yield names, and name it in the role's boot spec
 * .why = a driver's 4.2 writes the artifact and names it; the proof reads both
 */
const setBriefEntooled = (input: { role: EducationRole; at: string }) => {
  mkdirSync(path.dirname(input.at), { recursive: true });
  writeFileSync(input.at, '# rule.x\n\nupsert on the natural key.\n');
  if (!existsSync(input.role.bootPath)) return;
  const spec = asBootSpecWithBriefs({
    spec: readFileSync(input.role.bootPath, 'utf-8'),
    say: [path.relative(path.dirname(input.role.bootPath), input.at)],
    ref: [],
    at: input.role.bootPath,
    isRoleSpec: input.role.kind !== 'linked',
    modeOfRole: getOneBootSpecModeOfRole({
      repoRoot: process.cwd(),
      role: input.role,
    }),
  });
  writeFileSync(input.role.bootPath, spec);
};

/**
 * .what = drive a course to its exit stone: write each yield, pass each stone
 * .note = cwd must be the repo root, as each education face requires
 */
export const setCourseDriven = async (input: {
  route: string;
}): Promise<void> => {
  const role = getOneRoleOfCourse({ route: input.route });
  setBriefEntooled({ role, at: path.join(role.briefsDir, 'rule.x.md') });
  for (const [stone, yieldText] of Object.entries(YIELDS_OF_COURSE)) {
    writeFileSync(
      path.join(input.route, `${stone}.yield.md`),
      yieldText.replace('$BRIEFS_DIR', role.briefsDir),
    );
    await setPassageReport({
      route: input.route,
      report: new PassageReport({ stone, status: 'passed' }),
    });
  }
};
