import * as fs from 'fs/promises';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const yaml = require('js-yaml');

import { Coverage } from '@src/domain.objects/Achiever/Coverage';
import {
  computeGoalCompleteness,
  type Goal,
  type GoalHow,
  type GoalMeta,
  type GoalStatus,
  type GoalStatusChoice,
  type GoalWhat,
  type GoalWhen,
  type GoalWhy,
} from '@src/domain.objects/Achiever/Goal';

/**
 * .what = persists a goal to the goals directory
 * .why = enables goal track across context compression
 * .note = supports partial goals for quick capture — meta tracks completeness
 */
export const setGoal = async (input: {
  goal: Goal;
  covers?: string[];
  scopeDir: string;
}): Promise<{ path: string; covered: string[]; meta: GoalMeta }> => {
  // ensure goals directory found or created
  await fs.mkdir(input.scopeDir, { recursive: true });

  // compute offset from parent dir mtime (seconds since dir creation)
  let offset = 0;
  try {
    const dirStat = await fs.stat(input.scopeDir);
    const now = Date.now();
    offset = Math.floor((now - dirStat.mtimeMs) / 1000);
  } catch {
    // if stat fails, use 0
  }

  // format offset as 7-digit leftpad
  const offsetStr = String(offset).padStart(7, '0');

  // construct file paths
  const goalPath = path.join(
    input.scopeDir,
    `${offsetStr}.${input.goal.slug}.goal.yaml`,
  );
  const statusPath = path.join(
    input.scopeDir,
    `${offsetStr}.${input.goal.slug}.status=${input.goal.status.choice}.flag`,
  );

  // compute completeness meta
  const meta = computeGoalCompleteness({
    why: input.goal.why,
    what: input.goal.what,
    how: input.goal.how,
  });

  // serialize goal to YAML — partial fields only if present
  // note: source comes right after slug per user request
  const goalForYaml: Record<string, unknown> = {
    slug: input.goal.slug,
    source: input.goal.source,
    status: {
      choice: input.goal.status.choice,
      reason: input.goal.status.reason,
    },
  };

  // add why fields if present (partial support)
  if (input.goal.why) {
    const why: Record<string, string> = {};
    if (input.goal.why.ask) why.ask = input.goal.why.ask;
    if (input.goal.why.purpose) why.purpose = input.goal.why.purpose;
    if (input.goal.why.benefit) why.benefit = input.goal.why.benefit;
    if (Object.keys(why).length > 0) goalForYaml.why = why;
  }

  // add what fields if present (partial support)
  if (input.goal.what) {
    const what: Record<string, string> = {};
    if (input.goal.what.outcome) what.outcome = input.goal.what.outcome;
    if (Object.keys(what).length > 0) goalForYaml.what = what;
  }

  // add how fields if present (partial support)
  if (input.goal.how) {
    const how: Record<string, string> = {};
    if (input.goal.how.task) how.task = input.goal.how.task;
    if (input.goal.how.gate) how.gate = input.goal.how.gate;
    if (Object.keys(how).length > 0) goalForYaml.how = how;
  }

  // add when if present
  if (input.goal.when) goalForYaml.when = input.goal.when;

  const yamlContent = yaml.dump(goalForYaml, {
    lineWidth: -1,
    quotingType: "'",
    forceQuotes: true,
  });

  // write goal yaml
  await fs.writeFile(goalPath, yamlContent);

  // write status flag (empty file, status is in filename)
  await fs.writeFile(statusPath, '');

  // append coverage entries if covers provided
  const covered: string[] = [];
  if (input.covers && input.covers.length > 0) {
    const coveredAt = new Date().toISOString().split('T')[0] ?? '';
    const coverageEntries = input.covers.map(
      (hash) =>
        new Coverage({
          hash,
          goalSlug: input.goal.slug,
          coveredAt,
        }),
    );

    const coveragePath = path.join(input.scopeDir, 'asks.coverage.jsonl');
    const lines =
      coverageEntries.map((c) => JSON.stringify(c)).join('\n') + '\n';
    await fs.appendFile(coveragePath, lines);

    covered.push(...input.covers);
  }

  return { path: goalPath, covered, meta };
};

/**
 * .what = updates an extant goal's status or adds fields to partial goal
 * .why = enables goal lifecycle transition and incremental completion
 */
export const setGoalStatus = async (input: {
  slug: string;
  status?: {
    choice: GoalStatusChoice;
    reason: string;
  };
  /** additional fields to merge into partial goal */
  fields?: {
    why?: Partial<GoalWhy>;
    what?: Partial<GoalWhat>;
    how?: Partial<GoalHow>;
  };
  covers?: string[];
  scopeDir: string;
}): Promise<{ path: string; covered: string[]; meta: GoalMeta }> => {
  // find extant goal file
  const files = await fs.readdir(input.scopeDir);
  const goalFile = files.find(
    (f) => f.includes(`.${input.slug}.goal.yaml`) && f.endsWith('.goal.yaml'),
  );

  if (!goalFile) {
    throw new Error(`goal not found: ${input.slug}`);
  }

  // read extant goal
  const goalPath = path.join(input.scopeDir, goalFile);
  const content = await fs.readFile(goalPath, 'utf-8');
  const parsed = yaml.load(content) as Record<string, unknown>;

  // extract extant fields (may be partial)
  const parsedWhy = parsed.why as Partial<GoalWhy> | undefined;
  const parsedWhat = parsed.what as Partial<GoalWhat> | undefined;
  const parsedHow = parsed.how as Partial<GoalHow> | undefined;
  const parsedWhen = parsed.when as GoalWhen | undefined;
  const parsedStatus = parsed.status as GoalStatus;

  // merge new fields with extant fields
  const mergedWhy = {
    ...parsedWhy,
    ...input.fields?.why,
  };
  const mergedWhat = {
    ...parsedWhat,
    ...input.fields?.what,
  };
  const mergedHow = {
    ...parsedHow,
    ...input.fields?.how,
  };

  // compute completeness after merge
  const meta = computeGoalCompleteness({
    why: mergedWhy,
    what: mergedWhat,
    how: mergedHow,
  });

  // determine status (use input if provided, else keep extant)
  // auto-transition: if goal becomes complete and status is still 'incomplete', upgrade to 'enqueued'
  let statusChoice = input.status?.choice ?? parsedStatus.choice;
  let statusReason = input.status?.reason ?? parsedStatus.reason;
  if (meta.complete && statusChoice === 'incomplete' && !input.status?.choice) {
    statusChoice = 'enqueued';
    statusReason = 'goal completed, ready for work';
  }

  // fail-fast: cannot change status away from 'incomplete' if goal is still incomplete
  if (
    !meta.complete &&
    input.status?.choice &&
    input.status.choice !== 'incomplete'
  ) {
    throw new Error(
      `cannot set status to '${input.status.choice}' on incomplete goal '${input.slug}'. complete the goal first: ${meta.absent.join(', ')}`,
    );
  }

  // extract offset from extant filename
  const offsetStr = goalFile.split('.')[0] ?? '0000000';

  // remove old status flag
  const oldStatusFiles = files.filter(
    (f) => f.includes(`.${input.slug}.status=`) && f.endsWith('.flag'),
  );
  for (const oldFlag of oldStatusFiles) {
    await fs.unlink(path.join(input.scopeDir, oldFlag));
  }

  // write updated goal and new status flag
  const newGoalPath = path.join(
    input.scopeDir,
    `${offsetStr}.${input.slug}.goal.yaml`,
  );
  const newStatusPath = path.join(
    input.scopeDir,
    `${offsetStr}.${input.slug}.status=${statusChoice}.flag`,
  );

  // build yaml with partial support (source comes right after slug)
  const goalForYaml: Record<string, unknown> = {
    slug: parsed.slug,
    source: parsed.source,
    status: {
      choice: statusChoice,
      reason: statusReason,
    },
    createdAt: parsed.createdAt,
    updatedAt: new Date().toISOString().split('T')[0] ?? '',
  };

  // add why fields if present
  if (Object.keys(mergedWhy).length > 0) {
    const why: Record<string, string> = {};
    if (mergedWhy.ask) why.ask = mergedWhy.ask;
    if (mergedWhy.purpose) why.purpose = mergedWhy.purpose;
    if (mergedWhy.benefit) why.benefit = mergedWhy.benefit;
    if (Object.keys(why).length > 0) goalForYaml.why = why;
  }

  // add what fields if present
  if (Object.keys(mergedWhat).length > 0) {
    const what: Record<string, string> = {};
    if (mergedWhat.outcome) what.outcome = mergedWhat.outcome;
    if (Object.keys(what).length > 0) goalForYaml.what = what;
  }

  // add how fields if present
  if (Object.keys(mergedHow).length > 0) {
    const how: Record<string, string> = {};
    if (mergedHow.task) how.task = mergedHow.task;
    if (mergedHow.gate) how.gate = mergedHow.gate;
    if (Object.keys(how).length > 0) goalForYaml.how = how;
  }

  // add when if present
  if (parsedWhen) goalForYaml.when = parsedWhen;

  const yamlContent = yaml.dump(goalForYaml, {
    lineWidth: -1,
    quotingType: "'",
    forceQuotes: true,
  });

  await fs.writeFile(newGoalPath, yamlContent);

  // write status flag (empty file, status is in filename)
  await fs.writeFile(newStatusPath, '');

  // append coverage entries if covers provided
  const covered: string[] = [];
  if (input.covers && input.covers.length > 0) {
    const coveredAt = new Date().toISOString().split('T')[0] ?? '';
    const coverageEntries = input.covers.map(
      (hash) =>
        new Coverage({
          hash,
          goalSlug: input.slug,
          coveredAt,
        }),
    );

    const coveragePath = path.join(input.scopeDir, 'asks.coverage.jsonl');
    const lines =
      coverageEntries.map((c) => JSON.stringify(c)).join('\n') + '\n';
    await fs.appendFile(coveragePath, lines);

    covered.push(...input.covers);
  }

  return { path: newGoalPath, covered, meta };
};
