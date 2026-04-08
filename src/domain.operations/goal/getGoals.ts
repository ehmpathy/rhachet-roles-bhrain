import * as fs from 'fs/promises';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const yaml = require('js-yaml');

import {
  computeGoalCompleteness,
  Goal,
  GoalHow,
  type GoalSource,
  GoalStatus,
  type GoalStatusChoice,
  GoalWhat,
  GoalWhen,
  GoalWhy,
} from '@src/domain.objects/Achiever/Goal';

/**
 * .what = retrieves all goals from the goals directory
 * .why = enables goal enumeration and status filter
 */
export const getGoals = async (input: {
  scopeDir: string;
  filter?: {
    status?: GoalStatusChoice;
    slug?: string;
  };
}): Promise<{ goals: Goal[] }> => {
  // check if directory exists
  try {
    await fs.access(input.scopeDir);
  } catch {
    // directory does not exist, return empty
    return { goals: [] };
  }

  // read all files in scope dir
  const files = await fs.readdir(input.scopeDir);

  // find all goal yaml files
  const goalFiles = files.filter((f) => f.endsWith('.goal.yaml'));

  // if slug filter, narrow to match
  const filteredGoalFiles = input.filter?.slug
    ? goalFiles.filter((f) => f.includes(`.${input.filter?.slug}.goal.yaml`))
    : goalFiles;

  // parse each goal file
  const goals: Goal[] = [];
  for (const goalFile of filteredGoalFiles) {
    const goalPath = path.join(input.scopeDir, goalFile);
    const content = await fs.readFile(goalPath, 'utf-8');
    const parsed = yaml.load(content) as Record<string, unknown>;

    // extract offset from filename for status flag lookup
    const offsetStr = goalFile.split('.')[0] ?? '0000000';
    const slug = parsed.slug as string;

    // find status flag file to get current status.choice
    const statusFile = files.find(
      (f) =>
        f.startsWith(`${offsetStr}.${slug}.status=`) && f.endsWith('.flag'),
    );

    // extract status.choice from filename
    let statusChoice: GoalStatusChoice = 'enqueued';
    if (statusFile) {
      const match = statusFile.match(/\.status=([^.]+)\.flag$/);
      if (match?.[1]) {
        statusChoice = match[1] as GoalStatusChoice;
      }
    }

    // construct Goal domain object (handle partial goals)
    const parsedWhy = parsed.why as Partial<GoalWhy> | undefined;
    const parsedWhat = parsed.what as Partial<GoalWhat> | undefined;
    const parsedHow = parsed.how as Partial<GoalHow> | undefined;
    const parsedWhen = parsed.when as GoalWhen | undefined;

    // build partial fields if present
    const why = parsedWhy ? new GoalWhy(parsedWhy as GoalWhy) : undefined;
    const what = parsedWhat ? new GoalWhat(parsedWhat as GoalWhat) : undefined;
    const how = parsedHow ? new GoalHow(parsedHow as GoalHow) : undefined;

    // compute completeness on read (for CLI display)
    const meta = computeGoalCompleteness({
      why: parsedWhy,
      what: parsedWhat,
      how: parsedHow,
    });

    const goal = new Goal({
      slug: parsed.slug as string,
      why,
      what,
      how,
      status: new GoalStatus({
        choice: statusChoice,
        reason: (parsed.status as { reason?: string })?.reason ?? '',
      }),
      when: parsedWhen ? (new GoalWhen(parsedWhen) as Goal['when']) : undefined,
      source: parsed.source as GoalSource,
      meta,
      createdAt: parsed.createdAt as string,
      updatedAt: parsed.updatedAt as string,
    });

    goals.push(goal);
  }

  // filter by status if specified
  const filteredGoals = input.filter?.status
    ? goals.filter((g) => g.status.choice === input.filter?.status)
    : goals;

  return { goals: filteredGoals };
};
