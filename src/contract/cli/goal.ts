/**
 * .what = cli entrypoints for achiever goal skills
 * .why = enables shell invocation via package-level import
 */
import { execSync } from 'child_process';
import { BadRequestError } from 'helpful-errors';

import type { Ask } from '@src/domain.objects/Achiever/Ask';
import {
  computeGoalCompleteness,
  Goal,
  GoalHow,
  GoalStatus,
  type GoalStatusChoice,
  GoalWhat,
  GoalWhy,
} from '@src/domain.objects/Achiever/Goal';
import { delGoalBlockerState } from '@src/domain.operations/goal/delGoalBlockerState';
import { expandAbbreviatedHashes } from '@src/domain.operations/goal/expandAbbreviatedHashes';
import { getGoalGuardVerdict } from '@src/domain.operations/goal/getGoalGuardVerdict';
import { getGoals } from '@src/domain.operations/goal/getGoals';
import { getTriageState } from '@src/domain.operations/goal/getTriageState';
import { setAsk } from '@src/domain.operations/goal/setAsk';
import { setGoal, setGoalStatus } from '@src/domain.operations/goal/setGoal';
import { setGoalBlockerState } from '@src/domain.operations/goal/setGoalBlockerState';
import { getRouteBindByBranch } from '@src/domain.operations/route/bind/getRouteBindByBranch';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const yaml = require('js-yaml');

// ============================================================================
// transformers
// ============================================================================

/**
 * .what = extract date string from current timestamp
 * .why = separates date computation from orchestrator logic for readability
 */
const asCurrentDateString = (): string => {
  return new Date().toISOString().split('T')[0] as string;
};

/**
 * .what = convert branch name to slug format
 * .why = branch paths use / but file paths need . as separator
 */
const asBranchSlug = (branch: string): string => {
  return branch.replace(/\//g, '.');
};

/**
 * .what = remove undefined values from object
 * .why = enables partial updates without overwriting extant fields
 */
const omitUndefinedFields = <T extends Record<string, unknown>>(
  obj: T,
): Partial<T> =>
  Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined),
  ) as Partial<T>;

/**
 * .what = extract short hash prefix for display
 * .why = 7 chars is standard git short hash format
 */
const asHashShort = (hash: string): string => hash.slice(0, 7);

/**
 * .what = extract content preview for display
 * .why = 50 chars fits on one line for triage output
 */
const asContentPreview = (content: string): string => content.slice(0, 50);

/**
 * .what = get first absent field or default value
 * .why = guides user to fill first required field
 */
const getFirstAbsentField = (
  absent: string[],
  defaultField: string = 'why.purpose',
): string => absent[0] ?? defaultField;

/**
 * .what = truncate text with ellipsis for display
 * .why = keeps output scannable in treestruct format
 */
const asTruncatedText = (text: string, limit: number): string =>
  text.length > limit ? text.slice(0, limit) + '...' : text;

/**
 * .what = get first goal from goals array
 * .why = after filter by slug, result contains at most one goal
 */
const getFirstGoal = (goals: Goal[]): Goal | undefined => goals[0];

/**
 * .what = check if triage state is all clear
 * .why = all asks covered and all goals complete means no triage needed
 */
const isTriageClear = (state: {
  asksUncovered: unknown[];
  goalsIncomplete: unknown[];
}): boolean =>
  state.asksUncovered.length === 0 && state.goalsIncomplete.length === 0;

/**
 * .what = determine if operation is status-only update
 * .why = mode 1 updates status without field changes
 */
const isStatusUpdateMode = (
  slug: string | undefined,
  status: GoalStatusChoice | undefined,
  hasFieldFlags: boolean,
): boolean => Boolean(slug && status && !hasFieldFlags);

// ============================================================================
// output emitters
// ============================================================================

/**
 * .what = owl wisdom header
 * .why = sets the vibe for goal operations
 */
const OWL_WISDOM = '🦉 to forget an ask is to break a promise. remember.';

/**
 * .what = escalation threshold for blocker count
 * .why = wisher specified 5 repeated blocks before escalation
 */
const ESCALATION_THRESHOLD = 5;

/**
 * .what = escalated owl wisdom for repeated reminders
 * .why = after 5 reminders, message should be more insistent
 */
const OWL_WISDOM_ESCALATED =
  '🦉 friend, you have been reminded many times. the work must be done.';

/**
 * .what = owl wisdom for onBoot refresh
 * .why = after compaction, remind brain of goals without halt
 */
const OWL_WISDOM_BOOT = '🦉 the path continues. here is where you left off.';

/**
 * .what = get escalated owl message based on blocker count
 * .why = escalate message intensity after 5 repeated blocks
 */
export const escalateMessageByCount = (count: number): string => {
  if (count >= ESCALATION_THRESHOLD) {
    return OWL_WISDOM_ESCALATED;
  }
  return OWL_WISDOM;
};

/**
 * .what = emit owl header
 * .why = consistent vibes across all goal operations
 */
const emitOwlHeader = (): void => {
  console.log(OWL_WISDOM);
  console.log('');
};

/**
 * .what = emit sub.bucket for multiline content
 * .why = vision requires sub.buckets for field values
 * .note = always uses ├─ open and │ continuation so lines connect
 */
const emitSubBucket = (content: string, indent: string): void => {
  console.log(`${indent}├─`);
  console.log(`${indent}│  `);
  for (const line of content.split('\n')) {
    console.log(`${indent}│    ${line}`);
  }
  console.log(`${indent}│  `);
  console.log(`${indent}└─`);
};

/**
 * .what = emit goal in full treestruct format
 * .why = vision requires full nested display for single goal operations
 * .note = shows ✋ omitted inline for absent fields
 */
const emitGoalFull = (goal: Goal, indent: string = '   '): void => {
  const meta = computeGoalCompleteness(goal);
  const isAbsent = (field: string) => meta.absent.includes(field);

  console.log(`${indent}├─ goal`);
  console.log(`${indent}│  ├─ slug = ${goal.slug}`);

  // why section (always show, mark absent fields)
  console.log(`${indent}│  ├─ why`);
  if (goal.why?.ask) {
    console.log(`${indent}│  │  ├─ ask`);
    emitSubBucket(goal.why.ask, `${indent}│  │  │  `);
  } else if (isAbsent('why.ask')) {
    console.log(`${indent}│  │  ├─ ask = ✋ omitted`);
  }
  if (goal.why?.purpose) {
    console.log(`${indent}│  │  ├─ purpose`);
    emitSubBucket(goal.why.purpose, `${indent}│  │  │  `);
  } else if (isAbsent('why.purpose')) {
    console.log(`${indent}│  │  ├─ purpose = ✋ omitted`);
  }
  if (goal.why?.benefit) {
    console.log(`${indent}│  │  └─ benefit`);
    emitSubBucket(goal.why.benefit, `${indent}│  │     `);
  } else if (isAbsent('why.benefit')) {
    console.log(`${indent}│  │  └─ benefit = ✋ omitted`);
  }

  // what section (always show, mark absent fields)
  console.log(`${indent}│  ├─ what`);
  if (goal.what?.outcome) {
    console.log(`${indent}│  │  └─ outcome`);
    emitSubBucket(goal.what.outcome, `${indent}│  │     `);
  } else if (isAbsent('what.outcome')) {
    console.log(`${indent}│  │  └─ outcome = ✋ omitted`);
  }

  // how section (always show, mark absent fields)
  console.log(`${indent}│  ├─ how`);
  if (goal.how?.task) {
    console.log(`${indent}│  │  ├─ task`);
    emitSubBucket(goal.how.task, `${indent}│  │  │  `);
  } else if (isAbsent('how.task')) {
    console.log(`${indent}│  │  ├─ task = ✋ omitted`);
  }
  if (goal.how?.gate) {
    console.log(`${indent}│  │  └─ gate`);
    emitSubBucket(goal.how.gate, `${indent}│  │     `);
  } else if (isAbsent('how.gate')) {
    console.log(`${indent}│  │  └─ gate = ✋ omitted`);
  }

  // status section
  console.log(`${indent}│  ├─ status`);
  console.log(`${indent}│  │  ├─ choice = ${goal.status.choice}`);
  console.log(`${indent}│  │  └─ reason`);
  emitSubBucket(goal.status.reason, `${indent}│  │     `);

  // source
  console.log(`${indent}│  └─ source = ${goal.source}`);
};

/**
 * .what = emit goal in condensed format for lists
 * .why = vision uses single-line per field for goal lists
 * .note = shows ✋ omitted inline for absent fields instead of separate meta section
 */
const emitGoalCondensed = (
  goal: Goal,
  index: number,
  total: number,
  indent: string = '      ',
  coversCount: number = 0,
): void => {
  const isLast = index === total - 1;
  const branch = isLast ? '└─' : '├─';
  // for single goal, no extra indentation; for list, indent under the (N) index
  const cont = total === 1 ? '' : isLast ? '   ' : '│  ';
  const meta = computeGoalCompleteness(goal);
  const isAbsent = (field: string) => meta.absent.includes(field);

  // skip index for single goal view
  if (total === 1) {
    console.log(`${indent}├─ slug = ${goal.slug}`);
  } else {
    console.log(`${indent}${branch} (${index + 1})`);
    console.log(`${indent}${cont}├─ slug = ${goal.slug}`);
  }

  // why condensed (always show section, mark absent fields)
  console.log(`${indent}${cont}├─ why`);
  console.log(
    `${indent}${cont}│  ├─ ask = ${goal.why?.ask ?? (isAbsent('why.ask') ? '✋ omitted' : '')}`,
  );
  console.log(
    `${indent}${cont}│  ├─ purpose = ${goal.why?.purpose ?? (isAbsent('why.purpose') ? '✋ omitted' : '')}`,
  );
  console.log(
    `${indent}${cont}│  └─ benefit = ${goal.why?.benefit ?? (isAbsent('why.benefit') ? '✋ omitted' : '')}`,
  );

  // what condensed
  console.log(`${indent}${cont}├─ what`);
  console.log(
    `${indent}${cont}│  └─ outcome = ${goal.what?.outcome ?? (isAbsent('what.outcome') ? '✋ omitted' : '')}`,
  );

  // how condensed
  console.log(`${indent}${cont}├─ how`);
  console.log(
    `${indent}${cont}│  ├─ task = ${goal.how?.task ?? (isAbsent('how.task') ? '✋ omitted' : '')}`,
  );
  console.log(
    `${indent}${cont}│  └─ gate = ${goal.how?.gate ?? (isAbsent('how.gate') ? '✋ omitted' : '')}`,
  );

  // status condensed
  console.log(`${indent}${cont}├─ status`);
  console.log(`${indent}${cont}│  ├─ choice = ${goal.status.choice}`);
  console.log(`${indent}${cont}│  └─ reason = ${goal.status.reason}`);

  // covers (only if > 0)
  if (coversCount > 0) {
    console.log(
      `${indent}${cont}├─ covers = ${coversCount} ask${coversCount === 1 ? '' : 's'}`,
    );
  }

  // source
  console.log(`${indent}${cont}└─ source = ${goal.source}`);
};

/**
 * .what = emit single goal directly under command header (no "└─ goal" wrapper)
 * .why = for single goal view, the redundant header adds noise
 */
const emitGoalCondensedForSingle = (goal: Goal, hasCovers: boolean): void => {
  const meta = computeGoalCompleteness(goal);
  const isAbsent = (field: string) => meta.absent.includes(field);

  // all properties at root level, directly under the command
  console.log(`   ├─ slug = ${goal.slug}`);

  // why condensed
  console.log(`   ├─ why`);
  console.log(
    `   │  ├─ ask = ${goal.why?.ask ?? (isAbsent('why.ask') ? '✋ omitted' : '')}`,
  );
  console.log(
    `   │  ├─ purpose = ${goal.why?.purpose ?? (isAbsent('why.purpose') ? '✋ omitted' : '')}`,
  );
  console.log(
    `   │  └─ benefit = ${goal.why?.benefit ?? (isAbsent('why.benefit') ? '✋ omitted' : '')}`,
  );

  // what condensed
  console.log(`   ├─ what`);
  console.log(
    `   │  └─ outcome = ${goal.what?.outcome ?? (isAbsent('what.outcome') ? '✋ omitted' : '')}`,
  );

  // how condensed
  console.log(`   ├─ how`);
  console.log(
    `   │  ├─ task = ${goal.how?.task ?? (isAbsent('how.task') ? '✋ omitted' : '')}`,
  );
  console.log(
    `   │  └─ gate = ${goal.how?.gate ?? (isAbsent('how.gate') ? '✋ omitted' : '')}`,
  );

  // status condensed
  console.log(`   ├─ status`);
  console.log(`   │  ├─ choice = ${goal.status.choice}`);
  console.log(`   │  └─ reason = ${goal.status.reason}`);

  // source - use └─ if no covers follow, ├─ if covers will follow
  const sourceBranch = hasCovers ? '├─' : '└─';
  console.log(`   ${sourceBranch} source = ${goal.source}`);
};

/**
 * .what = emit list of goals in condensed format
 * .why = encapsulates loop logic for narrative flow in orchestrator
 */
const emitGoalsList = (
  goals: Goal[],
  coversBySlug?: Map<string, number>,
): void => {
  goals.forEach((goal, index) => {
    const coversCount = coversBySlug?.get(goal.slug) ?? 0;
    emitGoalCondensed(goal, index, goals.length, '      ', coversCount);
  });
};

/**
 * .what = emit list of uncovered asks in treestruct format with full content
 * .why = clone needs to see full ask to create meaningful goal that covers it
 */
const emitUncoveredAsksList = (asks: Ask[]): void => {
  asks.forEach((ask, index) => {
    const isLast = index === asks.length - 1;
    const branch = isLast ? '└─' : '├─';
    const cont = isLast ? '   ' : '│  ';
    const hashShort = asHashShort(ask.hash);
    console.log(`   │  ${branch} [${hashShort}]`);
    console.log(`   │  ${cont}├─`);
    console.log(`   │  ${cont}│`);
    for (const line of ask.content.split('\n')) {
      console.log(`   │  ${cont}│  ${line}`);
    }
    console.log(`   │  ${cont}│`);
    console.log(`   │  ${cont}└─`);
  });
};

/**
 * .what = emit list of incomplete goals in treestruct format
 * .why = encapsulates loop logic for narrative flow in orchestrator
 */
const emitIncompleteGoalsList = (
  goals: Goal[],
  options?: { emit?: typeof console.log; showStatus?: boolean },
): void => {
  const emit = options?.emit ?? console.log;
  const showStatus = options?.showStatus ?? true;
  goals.forEach((goal, index) => {
    const isLast = index === goals.length - 1;
    const branch = isLast ? '└─' : '├─';
    const cont = isLast ? '   ' : '│  ';
    const statusPart = showStatus ? ` [${goal.status.choice}]` : '';
    emit(`   │  ${branch} ${goal.slug}${statusPart}`);
    const meta = computeGoalCompleteness(goal);
    emit(`   │  ${cont}├─ absent: ${meta.absent.join(', ')}`);
    const firstAbsent = getFirstAbsentField(meta.absent);
    emit(
      `   │  ${cont}└─ to fix, run: \`rhx goal.memory.set --slug ${goal.slug} --${firstAbsent} "..."\``,
    );
  });
};

/**
 * .what = emit list of complete goals in treestruct format
 * .why = encapsulates loop logic for narrative flow in orchestrator
 */
const emitCompleteGoalsList = (goals: Goal[]): void => {
  goals.forEach((goal, index) => {
    const isLast = index === goals.length - 1;
    const branch = isLast ? '└─' : '├─';
    console.log(`   │  ${branch} ${goal.slug} [${goal.status.choice}]`);
  });
};

/**
 * .what = detect if in node -e mode
 * .why = node -e mode has different argv structure (no file path in argv[1])
 *
 * normal mode: node file.js --arg value → argv = [node, file.js, --arg, value]
 * -e mode: node -e "code" -- --arg value → argv = [node, --arg, value]
 *
 * detection: argv[1] starts with -- (flag) or is undefined = -e mode
 */
const isNodeEvalMode = (): boolean => {
  return process.argv[1] === undefined || process.argv[1].startsWith('--');
};

/**
 * .what = get default scope based on bound route
 * .why = route scope if bound to a route, repo scope otherwise
 */
const getDefaultScope = async (): Promise<'route' | 'repo'> => {
  const bind = await getRouteBindByBranch({ branch: null });
  return bind ? 'route' : 'repo';
};

/**
 * .what = get scope directory based on --scope flag
 * .why = route vs repo scope determines persistence location
 */
const getScopeDir = async (scope: 'route' | 'repo'): Promise<string> => {
  if (scope === 'repo') {
    const branch = execSync('git branch --show-current', {
      encoding: 'utf-8',
    }).trim();
    if (branch === 'main' || branch === 'master') {
      throw new BadRequestError('goals on main/master branch are forbidden', {
        branch,
      });
    }
    // flatten branch name: vlad/feat-achiever → vlad.feat-achiever
    const branchFlat = asBranchSlug(branch);
    return `.goals/${branchFlat}`;
  }

  // route scope - get bound route
  const bind = await getRouteBindByBranch({ branch: null });
  if (!bind) {
    throw new BadRequestError('--scope route requires being bound to a route', {
      scope,
    });
  }

  return `${bind.route}/.goals`;
};

/**
 * .what = field flags for partial goal creation
 * .why = maps CLI flag names to goal field paths
 */
const FIELD_FLAGS = [
  '--why.ask',
  '--why.purpose',
  '--why.benefit',
  '--what.outcome',
  '--how.task',
  '--how.gate',
  '--source',
  '--status.reason',
] as const;

type FieldFlag = (typeof FIELD_FLAGS)[number];

/**
 * .what = parsed field values from CLI flags
 * .why = holds field values before goal construction
 */
interface ParsedFields {
  'why.ask'?: string;
  'why.purpose'?: string;
  'why.benefit'?: string;
  'what.outcome'?: string;
  'how.task'?: string;
  'how.gate'?: string;
  source?: string;
  'status.reason'?: string;
}

/**
 * .what = parse @stdin and @stdin.N values from stdin
 * .why = enables multiline content via stdin for flag values
 *
 * @stdin = entire stdin content
 * @stdin.N = Nth null-separated value (0-indexed)
 */
const parseStdinValues = (
  stdinContent: string,
  flagValues: Map<string, string>,
): Map<string, string> => {
  const result = new Map(flagValues);

  // find flags that reference @stdin
  const stdinRefs: Array<{ flag: string; ref: string }> = [];
  for (const [flag, value] of result) {
    if (value === '@stdin' || value.startsWith('@stdin.')) {
      stdinRefs.push({ flag, ref: value });
    }
  }

  if (stdinRefs.length === 0) return result;

  // parse stdin based on reference type
  const stdinParts = stdinContent.split('\0');

  for (const { flag, ref } of stdinRefs) {
    if (ref === '@stdin') {
      // entire stdin content
      result.set(flag, stdinContent);
    }
    if (ref.startsWith('@stdin.')) {
      // Nth null-separated value
      const index = parseInt(ref.slice('@stdin.'.length), 10);
      if (!isNaN(index) && index >= 0 && index < stdinParts.length) {
        result.set(flag, stdinParts[index] as string);
      }
    }
  }

  return result;
};

/**
 * .what = parse args for goal.memory.set
 * .why = extract --scope, --covers, --slug, --status, and field flags from argv
 */
const parseArgsForSet = async (
  argv: string[],
  stdinContent: string,
): Promise<{
  scope: 'route' | 'repo';
  covers?: string[];
  slug?: string;
  status?: GoalStatusChoice;
  fields: ParsedFields;
  hasFieldFlags: boolean;
}> => {
  // in -e mode: argv = [node, --arg, value] → slice(1) to get args
  // in normal mode: argv = [node, file.js, --arg, value] → slice(2) to skip file
  const args = isNodeEvalMode() ? argv.slice(1) : argv.slice(2);

  let scope: 'route' | 'repo' = await getDefaultScope();
  let covers: string[] | undefined;
  let slug: string | undefined;
  let status: GoalStatusChoice | undefined;
  const flagValues = new Map<string, string>();
  let hasFieldFlags = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i] as string;
    const nextArg = args[i + 1];
    if (arg === '--scope' && nextArg) {
      if (nextArg !== 'route' && nextArg !== 'repo') {
        throw new BadRequestError(
          `invalid scope: ${nextArg}. must be 'route' or 'repo'`,
          { scope: nextArg },
        );
      }
      scope = nextArg;
      i++;
      continue;
    }
    if (arg === '--covers' && nextArg) {
      covers = nextArg.split(',');
      i++;
      continue;
    }
    if (arg === '--slug' && nextArg) {
      slug = nextArg;
      i++;
      continue;
    }
    if ((arg === '--status' || arg === '--status.choice') && nextArg) {
      status = nextArg as GoalStatusChoice;
      i++;
      continue;
    }
    // check for field flags
    if (FIELD_FLAGS.includes(arg as FieldFlag) && nextArg) {
      const fieldName = arg.slice(2); // remove '--' prefix
      flagValues.set(fieldName, nextArg);
      // --status.reason doesn't count as "field flag" for mode detection
      // (allows simple status update with explicit reason via mode 1)
      if (arg !== '--status.reason') {
        hasFieldFlags = true;
      }
      i++;
    }
  }

  // handle @stdin and @stdin.N values
  const resolvedValues = parseStdinValues(stdinContent, flagValues);

  // convert to ParsedFields
  const fields: ParsedFields = {};
  for (const [key, value] of resolvedValues) {
    (fields as Record<string, string>)[key] = value;
  }

  return { scope, covers, slug, status, fields, hasFieldFlags };
};

/**
 * .what = parse args for goal.memory.get
 * .why = extract --scope, --status, --slug from argv
 */
const parseArgsForGet = async (
  argv: string[],
): Promise<{
  scope: 'route' | 'repo';
  status?: GoalStatusChoice;
  slug?: string;
  withAsks: boolean;
}> => {
  // in -e mode: argv = [node, --arg, value] → slice(1) to get args
  // in normal mode: argv = [node, file.js, --arg, value] → slice(2) to skip file
  const args = isNodeEvalMode() ? argv.slice(1) : argv.slice(2);

  let scope: 'route' | 'repo' = await getDefaultScope();
  let status: GoalStatusChoice | undefined;
  let slug: string | undefined;
  let withAsks = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--scope' && args[i + 1]) {
      const scopeValue = args[i + 1];
      if (scopeValue !== 'route' && scopeValue !== 'repo') {
        throw new BadRequestError(
          `invalid scope: ${scopeValue}. must be 'route' or 'repo'`,
          { scope: scopeValue },
        );
      }
      scope = scopeValue;
      i++;
    }
    if ((arg === '--status' || arg === '--status.choice') && args[i + 1]) {
      status = args[i + 1] as GoalStatusChoice;
      i++;
    }
    if (arg === '--slug' && args[i + 1]) {
      slug = args[i + 1];
      i++;
    }
    if (arg === '--with' && args[i + 1] === 'asks') {
      withAsks = true;
      i++;
    }
  }

  return { scope, status, slug, withAsks };
};

/**
 * .what = parse args for goal.triage.infer
 * .why = extract --scope from argv
 */
const parseArgsForTriage = async (
  argv: string[],
): Promise<{
  scope: 'route' | 'repo';
  mode: 'triage' | 'hook.onStop' | 'hook.onTalk';
}> => {
  // in -e mode: argv = [node, --arg, value] → slice(1) to get args
  // in normal mode: argv = [node, file.js, --arg, value] → slice(2) to skip file
  const args = isNodeEvalMode() ? argv.slice(1) : argv.slice(2);

  let scope: 'route' | 'repo' = await getDefaultScope();
  let mode: 'triage' | 'hook.onStop' | 'hook.onTalk' = 'triage';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--scope' && args[i + 1]) {
      const scopeValue = args[i + 1];
      if (scopeValue !== 'route' && scopeValue !== 'repo') {
        throw new BadRequestError(
          `invalid scope: ${scopeValue}. must be 'route' or 'repo'`,
          { scope: scopeValue },
        );
      }
      scope = scopeValue;
      i++;
    }
    if (arg === '--when' && args[i + 1]) {
      mode = args[i + 1] as 'triage' | 'hook.onStop' | 'hook.onTalk';
      i++;
    }
  }

  return { scope, mode };
};

/**
 * .what = read stdin synchronously
 * .why = goal yaml content comes via stdin for new goals
 */
const readStdin = (): string => {
  // no stdin if connected to a TTY (interactive session, no pipe)
  if (process.stdin.isTTY) return '';

  try {
    return execSync('cat', {
      encoding: 'utf-8',
      stdio: ['inherit', 'pipe', 'pipe'],
      timeout: 5000,
    });
  } catch (error) {
    // timeout expected when no stdin content piped - allowlist this
    const execError = error as NodeJS.ErrnoException & { killed?: boolean };
    if (execError.killed) return '';
    // rethrow real errors
    throw error;
  }
};

/**
 * .what = parse prompt from Claude Code stdin JSON string
 * .why = separates pure parsing from I/O for testability
 */
export const parseStdinPrompt = (raw: string): string | null => {
  if (!raw.trim()) return null;

  try {
    const json = JSON.parse(raw);
    const prompt = json.prompt;
    if (typeof prompt !== 'string' || !prompt.trim()) return null;
    return prompt;
  } catch (error) {
    // allowlist SyntaxError (malformed JSON)
    if (error instanceof SyntaxError) return null;
    // rethrow real errors
    throw error;
  }
};

/**
 * .what = extract prompt from Claude Code stdin JSON
 * .why = UserPromptSubmit hook receives JSON with prompt field
 */
const extractPromptFromStdin = (): string | null => {
  const raw = readStdin();
  return parseStdinPrompt(raw);
};

/**
 * .what = emit onTalk reminder to stderr
 * .why = vision specifies this exact format
 */
const emitOnTalkReminder = (content: string): void => {
  console.error(OWL_WISDOM);
  console.error('');
  console.error('🔮 goal.triage.infer --from peer --when hook.onTalk');
  console.error('   ├─ from = peer:human');
  console.error('   ├─ ask');
  console.error('   │  ├─');
  console.error('   │  │  ');
  for (const line of content.split('\n')) {
    console.error(`   │  │    ${line}`);
  }
  console.error('   │  │  ');
  console.error('   │  └─');
  console.error('   │');
  console.error('   └─ consider: does this impact your goals?');
  console.error('      ├─ if yes, triage before you proceed');
  console.error('      └─ run `rhx goal.triage.infer`');
};

/**
 * .what = build goal from CLI flags
 * .why = enables partial goal creation via flags without YAML
 */
const buildGoalFromFlags = (
  slug: string,
  fields: ParsedFields,
  status?: GoalStatusChoice,
): Goal => {
  const now = asCurrentDateString();

  // build why if any field present
  const hasWhy =
    fields['why.ask'] || fields['why.purpose'] || fields['why.benefit'];
  const why = hasWhy
    ? new GoalWhy({
        ask: fields['why.ask'] ?? '',
        purpose: fields['why.purpose'] ?? '',
        benefit: fields['why.benefit'] ?? '',
      })
    : undefined;

  // build what if any field present
  const hasWhat = fields['what.outcome'];
  const what = hasWhat
    ? new GoalWhat({
        outcome: fields['what.outcome'] ?? '',
      })
    : undefined;

  // build how if any field present
  const hasHow = fields['how.task'] || fields['how.gate'];
  const how = hasHow
    ? new GoalHow({
        task: fields['how.task'] ?? '',
        gate: fields['how.gate'] ?? '',
      })
    : undefined;

  // compute completeness meta
  const meta = computeGoalCompleteness({ why, what, how });

  // status defaults based on completeness: incomplete goals get 'incomplete', complete goals get 'enqueued'
  const defaultStatus = meta.complete ? 'enqueued' : 'incomplete';
  const goalStatus = new GoalStatus({
    choice: status ?? defaultStatus,
    reason: fields['status.reason'] ?? 'goal created',
  });

  return new Goal({
    slug,
    why,
    what,
    how,
    status: goalStatus,
    source: (fields.source as Goal['source']) ?? 'peer:human',
    createdAt: now,
    updatedAt: now,
  });
};

/**
 * .what = cli entrypoint for goal.memory.set skill
 * .why = enables shell invocation via package-level import
 */
export const goalMemorySet = async (): Promise<void> => {
  const stdinContent = readStdin();
  const {
    scope,
    covers: coversRaw,
    slug,
    status,
    fields,
    hasFieldFlags,
  } = await parseArgsForSet(process.argv, stdinContent);
  const scopeDir = await getScopeDir(scope);

  // expand abbreviated hashes to full hashes for coverage lookup
  let covers: string[] | undefined;
  if (coversRaw && coversRaw.length > 0) {
    const { fullHashes } = await expandAbbreviatedHashes({
      abbreviatedHashes: coversRaw,
      scopeDir,
    });
    covers = fullHashes;
  }

  // mode 1: status update (--slug and --status, with optional --status.reason)
  // note: --status.reason @stdin requires explicit flag (no implicit stdin consumption)
  if (isStatusUpdateMode(slug, status, hasFieldFlags)) {
    const reason = fields['status.reason']?.trim() || 'status updated';

    const result = await setGoalStatus({
      slug: slug!,
      status: { choice: status!, reason },
      covers,
      scopeDir,
    });

    // clear blocker state on terminal status (progress was made)
    if (status === 'fulfilled' || status === 'blocked') {
      await delGoalBlockerState({ scopeDir });
    }

    // fetch updated goal for full display
    const updatedGoals = await getGoals({ scopeDir, filter: { slug } });
    const updatedGoal = getFirstGoal(updatedGoals.goals);

    // emit treestruct output with full goal display
    emitOwlHeader();
    console.log(`🔮 goal.memory.set --slug ${slug} --status ${status}`);
    if (updatedGoal) {
      emitGoalFull(updatedGoal);
      console.log(`   │`);
    }
    console.log(`   ├─ path = ${result.path}`);
    if (result.covered.length > 0) {
      console.log(`   ├─ covered`);
      for (let i = 0; i < result.covered.length; i++) {
        const isLast = i === result.covered.length - 1;
        console.log(`   │  ${isLast ? '└─' : '├─'} ${result.covered[i]}`);
      }
    }
    console.log(`   └─ persisted`);
    return;
  }

  // mode 2: partial goal via CLI flags (--slug required, field flags present)
  if (slug && hasFieldFlags) {
    // check if goal already exists to merge fields
    const extantGoals = await getGoals({ scopeDir });
    const extantGoal = extantGoals.goals.find((g) => g.slug === slug);

    if (extantGoal) {
      // update extant goal: merge new fields with extant fields
      const result = await setGoalStatus({
        slug,
        status: status
          ? {
              choice: status,
              reason: fields['status.reason'] || 'status updated',
            }
          : undefined,
        fields: {
          why: omitUndefinedFields({
            ask: fields['why.ask'],
            purpose: fields['why.purpose'],
            benefit: fields['why.benefit'],
          }),
          what: omitUndefinedFields({
            outcome: fields['what.outcome'],
          }),
          how: omitUndefinedFields({
            task: fields['how.task'],
            gate: fields['how.gate'],
          }),
        },
        covers,
        scopeDir,
      });

      // clear blocker state on terminal status (progress was made)
      if (status === 'fulfilled' || status === 'blocked') {
        await delGoalBlockerState({ scopeDir });
      }

      // fetch updated goal for full display
      const updatedGoals = await getGoals({ scopeDir, filter: { slug } });
      const updatedGoal = getFirstGoal(updatedGoals.goals);

      // emit treestruct output with full goal display
      emitOwlHeader();
      console.log(`🔮 goal.memory.set --scope ${scope}`);
      if (updatedGoal) {
        emitGoalFull(updatedGoal);
        console.log(`   │`);
      }
      console.log(`   ├─ path = ${result.path}`);
      if (result.covered.length > 0) {
        console.log(`   ├─ covered`);
        for (let i = 0; i < result.covered.length; i++) {
          const isLast = i === result.covered.length - 1;
          console.log(`   │  ${isLast ? '└─' : '├─'} ${result.covered[i]}`);
        }
      }
      console.log(`   └─ persisted`);
      return;
    }

    // create new partial goal
    const goal = buildGoalFromFlags(slug, fields, status);

    const result = await setGoal({
      goal,
      covers,
      scopeDir,
    });

    // emit treestruct output with full goal display
    emitOwlHeader();
    console.log(`🔮 goal.memory.set --scope ${scope}`);
    emitGoalFull(goal);
    console.log(`   │`);
    console.log(`   ├─ path = ${result.path}`);
    if (covers && covers.length > 0) {
      console.log(`   ├─ covered`);
      for (let i = 0; i < covers.length; i++) {
        const isLast = i === covers.length - 1;
        console.log(`   │  ${isLast ? '└─' : '├─'} ${covers[i]}`);
      }
    }
    console.log(`   └─ persisted`);
    return;
  }

  // mode 2b: minimal partial goal (--slug only, no field flags, no status)
  if (slug && !hasFieldFlags && !status) {
    // check if goal already exists (upsert semantics)
    const extantGoals = await getGoals({ scopeDir });
    const extantGoal = extantGoals.goals.find((g) => g.slug === slug);

    if (extantGoal) {
      // goal exists, update in place (no-op for minimal goal with no changes)
      const result = await setGoalStatus({
        slug,
        status: undefined, // no status change
        fields: {}, // no field changes
        covers,
        scopeDir,
      });

      // fetch updated goal for full display
      const updatedGoals = await getGoals({ scopeDir, filter: { slug } });
      const updatedGoal = getFirstGoal(updatedGoals.goals);

      // emit treestruct output with full goal display
      emitOwlHeader();
      console.log(`🔮 goal.memory.set --scope ${scope}`);
      if (updatedGoal) {
        emitGoalFull(updatedGoal);
        console.log(`   │`);
      }
      console.log(`   ├─ path = ${result.path}`);
      if (result.covered.length > 0) {
        console.log(`   ├─ covered`);
        for (let i = 0; i < result.covered.length; i++) {
          const isLast = i === result.covered.length - 1;
          console.log(`   │  ${isLast ? '└─' : '├─'} ${result.covered[i]}`);
        }
      }
      console.log(`   └─ persisted`);
      return;
    }

    // goal does not exist, create new
    const goal = buildGoalFromFlags(slug, {}, undefined);

    const result = await setGoal({
      goal,
      covers,
      scopeDir,
    });

    // emit treestruct output with full goal display
    emitOwlHeader();
    console.log(`🔮 goal.memory.set --scope ${scope}`);
    emitGoalFull(goal);
    console.log(`   │`);
    console.log(`   ├─ path = ${result.path}`);
    if (covers && covers.length > 0) {
      console.log(`   ├─ covered`);
      for (let i = 0; i < covers.length; i++) {
        const isLast = i === covers.length - 1;
        console.log(`   │  ${isLast ? '└─' : '├─'} ${covers[i]}`);
      }
    }
    console.log(`   └─ persisted`);
    return;
  }

  // mode 3: full goal via YAML stdin
  if (!stdinContent.trim()) {
    console.error(
      'error: goal YAML required via stdin, or use --slug with field flags',
    );
    console.error('');
    console.error('usage (full goal via YAML):');
    console.error('  cat goal.yaml | rhx goal.memory.set --scope repo');
    console.error('');
    console.error('usage (partial goal via flags):');
    console.error(
      "  rhx goal.memory.set --scope repo --slug 'fix-test' --why.ask 'fix the flaky test'",
    );
    process.exit(2);
  }

  const parsed = yaml.load(stdinContent) as Record<string, unknown>;

  // validate: slug is required
  if (!parsed.slug) {
    console.error('error: slug is required');
    process.exit(2);
  }

  // parse YAML fields
  const parsedWhy = parsed.why as Record<string, string> | undefined;
  const parsedWhat = parsed.what as Record<string, string> | undefined;
  const parsedHow = parsed.how as Record<string, string> | undefined;
  const parsedStatus = parsed.status as Record<string, string> | undefined;

  const now = asCurrentDateString();

  // build why if present in YAML
  const why = parsedWhy
    ? new GoalWhy({
        ask: parsedWhy.ask ?? '',
        purpose: parsedWhy.purpose ?? '',
        benefit: parsedWhy.benefit ?? '',
      })
    : undefined;

  // build what if present in YAML
  const what = parsedWhat
    ? new GoalWhat({
        outcome: parsedWhat.outcome ?? '',
      })
    : undefined;

  // build how if present in YAML
  const how = parsedHow
    ? new GoalHow({
        task: parsedHow.task ?? '',
        gate: parsedHow.gate ?? '',
      })
    : undefined;

  // compute completeness meta
  const meta = computeGoalCompleteness({ why, what, how });

  // status defaults based on completeness (complete goals get 'enqueued')
  const goalStatus = parsedStatus
    ? new GoalStatus({
        choice: parsedStatus.choice as GoalStatusChoice,
        reason: parsedStatus.reason ?? 'goal created',
      })
    : new GoalStatus({
        choice: meta.complete ? 'enqueued' : 'incomplete',
        reason: 'goal created',
      });

  // validate: full YAML via stdin requires complete schema
  if (!meta.complete) {
    console.error('error: incomplete schema');
    console.error(`absent fields: ${meta.absent.join(', ')}`);
    console.error('');
    console.error('full goals via YAML stdin require all fields.');
    console.error('for partial goals, use CLI flags instead:');
    console.error(
      "  rhx goal.memory.set --scope repo --slug 'my-goal' --why.ask 'fix it'",
    );
    process.exit(2);
  }

  const goal = new Goal({
    slug: parsed.slug as string,
    why,
    what,
    how,
    status: goalStatus,
    source: (parsed.source as Goal['source']) ?? 'peer:human',
    createdAt: (parsed.createdAt as string) || now,
    updatedAt: (parsed.updatedAt as string) || now,
  });

  // check if goal already exists (upsert semantics)
  const extantGoals = await getGoals({ scopeDir });
  const extantGoal = extantGoals.goals.find((g) => g.slug === goal.slug);

  let result: { path: string; covered: string[] };
  let updatedGoal: Goal | undefined;

  if (extantGoal) {
    // goal exists, update in place with new fields
    result = await setGoalStatus({
      slug: goal.slug,
      status: parsedStatus
        ? {
            choice: parsedStatus.choice as GoalStatusChoice,
            reason: parsedStatus.reason ?? 'goal updated',
          }
        : undefined,
      fields: {
        why: why
          ? { ask: why.ask, purpose: why.purpose, benefit: why.benefit }
          : undefined,
        what: what ? { outcome: what.outcome } : undefined,
        how: how ? { task: how.task, gate: how.gate } : undefined,
      },
      covers,
      scopeDir,
    });

    // fetch updated goal for display
    const fetchedGoals = await getGoals({
      scopeDir,
      filter: { slug: goal.slug },
    });
    updatedGoal = fetchedGoals.goals[0];
  } else {
    // goal does not exist, create new
    result = await setGoal({
      goal,
      covers,
      scopeDir,
    });
    updatedGoal = goal;
  }

  // emit treestruct output with full goal display
  emitOwlHeader();
  console.log(`🔮 goal.memory.set --scope ${scope}`);
  if (updatedGoal) {
    emitGoalFull(updatedGoal);
    console.log(`   │`);
  }
  if (covers && covers.length > 0) {
    console.log(`   ├─ covered`);
    for (let i = 0; i < covers.length; i++) {
      const isLast = i === covers.length - 1;
      console.log(`   │  ${isLast ? '└─' : '├─'} ${covers[i]}`);
    }
  }
  console.log(`   ├─ path = ${result.path}`);
  console.log(`   └─ persisted`);
};

/**
 * .what = cli entrypoint for goal.memory.get skill
 * .why = enables shell invocation via package-level import
 */
export const goalMemoryGet = async (): Promise<void> => {
  const { scope, status, slug, withAsks } = await parseArgsForGet(process.argv);
  const scopeDir = await getScopeDir(scope);

  const result = await getGoals({
    scopeDir,
    filter: { status, slug },
  });

  // emit treestruct output
  emitOwlHeader();

  // --with asks only expands content for single goal via --slug
  const expandAsks = withAsks && slug;

  const argsDisplay = expandAsks
    ? `goal.memory.get --scope ${scope} --slug ${slug} --with asks`
    : slug
      ? `goal.memory.get --scope ${scope} --slug ${slug}`
      : `goal.memory.get --scope ${scope}`;
  console.log(`🔮 ${argsDisplay}`);

  if (result.goals.length === 0) {
    console.log('   └─ goals = (none)');
    return;
  }

  // load coverage state for all display paths
  const triageState = await getTriageState({ scopeDir });

  // compute coverage counts per goal slug
  const coversBySlug = new Map<string, number>();
  for (const coverage of triageState.coverage) {
    const current = coversBySlug.get(coverage.goalSlug) ?? 0;
    coversBySlug.set(coverage.goalSlug, current + 1);
  }

  // single goal with --with asks: expand full ask content
  if (expandAsks) {
    const asksByHash = new Map(triageState.asks.map((a) => [a.hash, a]));
    const goal = result.goals[0]!;

    // find coverage entries for this goal
    const goalCoverage = triageState.coverage.filter(
      (c) => c.goalSlug === goal.slug,
    );

    // emit goal directly under command (no redundant "└─ goal" header)
    emitGoalCondensedForSingle(goal, goalCoverage.length > 0);

    // emit covers with full ask content
    if (goalCoverage.length > 0) {
      console.log(`   │`);
      console.log(`   └─ covers (${goalCoverage.length} asks)`);
      goalCoverage.forEach((coverage, covIndex) => {
        const isLastCov = covIndex === goalCoverage.length - 1;
        const covBranch = isLastCov ? '└─' : '├─';
        const covCont = isLastCov ? '   ' : '│  ';
        const hashShort = asHashShort(coverage.hash);
        const ask = asksByHash.get(coverage.hash);
        console.log(`      ${covBranch} [${hashShort}]`);
        if (ask) {
          console.log(`      ${covCont}├─`);
          console.log(`      ${covCont}│`);
          for (const line of ask.content.split('\n')) {
            console.log(`      ${covCont}│  ${line}`);
          }
          console.log(`      ${covCont}│`);
          console.log(`      ${covCont}└─`);
        }
      });
    }
  } else if (slug && result.goals.length === 1) {
    // single goal view without --with asks: show truncated ask previews
    const asksByHash = new Map(triageState.asks.map((a) => [a.hash, a]));
    const goal = result.goals[0]!;

    // find coverage entries for this goal
    const goalCoverage = triageState.coverage.filter(
      (c) => c.goalSlug === goal.slug,
    );

    // emit goal directly under command (no redundant "└─ goal" header)
    emitGoalCondensedForSingle(goal, goalCoverage.length > 0);

    // emit covers section as part of the tree
    if (goalCoverage.length > 0) {
      console.log(`   │`);
      console.log(`   └─ covers (${goalCoverage.length} asks)`);
      goalCoverage.forEach((coverage, covIndex) => {
        const isLastCov = covIndex === goalCoverage.length - 1;
        const covBranch = isLastCov ? '└─' : '├─';
        const hashShort = asHashShort(coverage.hash);
        const ask = asksByHash.get(coverage.hash);
        // show first 30 chars of ask content, single line
        const preview = ask
          ? ask.content.replace(/\n/g, ' ').slice(0, 30) +
            (ask.content.length > 30 ? '...' : '')
          : '';
        console.log(`      ${covBranch} [${hashShort}] ${preview}`);
      });

      console.log('');
      console.log('✨ did you know?');
      console.log('   └─ --with asks to see full asks covered');
    }
  } else {
    // list view: show coverage counts per goal
    console.log(`   └─ goals (${result.goals.length})`);
    emitGoalsList(result.goals, coversBySlug);

    // hint for single goal details
    if (result.goals.length > 0) {
      console.log('');
      console.log('✨ did you know?');
      console.log(
        '   └─ run rhx goal.memory.get --slug $goal to see full goal details',
      );
    }
  }
};

/**
 * .what = cli entrypoint for goal.triage.infer skill
 * .why = enables shell invocation via package-level import
 */
export const goalTriageInfer = async (): Promise<void> => {
  // parse and validate args
  const { scope, mode } = await parseArgsForTriage(process.argv);

  const scopeDir = await getScopeDir(scope);

  // hook.onTalk mode: accumulate ask, emit reminder, exit 0
  if (mode === 'hook.onTalk') {
    const prompt = extractPromptFromStdin();
    if (!prompt) process.exit(0); // empty or malformed stdin → silent exit

    await setAsk({ content: prompt, scopeDir });
    emitOnTalkReminder(prompt);
    process.exit(0);
  }

  const state = await getTriageState({ scopeDir });

  // hook.onStop mode: halt if uncovered asks OR incomplete goals, silent if all clear
  if (mode === 'hook.onStop') {
    const hasUncovered = state.asksUncovered.length > 0;
    const hasIncomplete = state.goalsIncomplete.length > 0;

    if (hasUncovered || hasIncomplete) {
      console.error('🦉 to forget an ask is to break a promise. remember.');
      console.error('');
      console.error('🔮 goal.triage.infer --when hook.onStop');

      if (hasUncovered) {
        console.error(`   ├─ uncovered asks = ${state.asksUncovered.length}`);
      }
      if (hasIncomplete) {
        console.error(
          `   ├─ incomplete goals = ${state.goalsIncomplete.length}`,
        );
        emitIncompleteGoalsList(state.goalsIncomplete, {
          emit: console.error,
          showStatus: false,
        });
      }

      console.error('   │');
      console.error('   └─ halted, triage required');

      if (hasUncovered) {
        console.error('      ├─ each ask must be covered by a goal');
      }
      if (hasIncomplete) {
        console.error('      ├─ incomplete goals must be articulated');
      }

      console.error('      │');
      console.error('      └─ to continue, run');
      console.error('         └─ rhx goal.triage.infer');
      process.exit(2); // constraint error: user must fix
    }
    // all asks covered and all goals complete, silent exit
    return;
  }

  // triage mode: show full state with treestruct vibes
  emitOwlHeader();
  console.log(`🔮 goal.triage.infer --scope ${scope}`);

  // stats section (counts only)
  console.log(`   │`);
  console.log(`   ├─ stats`);
  console.log(`   │  ├─ asks = ${state.asks.length}`);
  console.log(`   │  ├─ uncovered = ${state.asksUncovered.length}`);
  console.log(`   │  ├─ goals = ${state.goals.length}`);
  console.log(`   │  │  ├─ complete = ${state.goalsComplete.length}`);
  console.log(`   │  │  └─ incomplete = ${state.goalsIncomplete.length}`);
  console.log(`   │  └─ coverage = ${state.coverage.length}`);

  // uncovered asks
  if (state.asksUncovered.length > 0) {
    console.log(`   │`);
    console.log(`   ├─ uncovered asks`);
    emitUncoveredAsksList(state.asksUncovered);
  }

  // incomplete goals
  if (state.goalsIncomplete.length > 0) {
    console.log(`   │`);
    console.log(`   ├─ incomplete goals`);
    emitIncompleteGoalsList(state.goalsIncomplete);
  }

  // complete goals
  if (state.goalsComplete.length > 0) {
    console.log(`   │`);
    console.log(`   ├─ complete goals`);
    emitCompleteGoalsList(state.goalsComplete);
  }

  // status
  const allClear = isTriageClear(state);
  console.log(`   │`);
  if (allClear) {
    console.log(`   └─ all asks covered, all goals complete`);
  } else {
    console.log(`   └─ triage required`);
    const hasUncovered = state.asksUncovered.length > 0;
    const hasIncomplete = state.goalsIncomplete.length > 0;

    if (hasUncovered) {
      const branch = hasIncomplete ? '├─' : '└─';
      const cont = hasIncomplete ? '│ ' : '  ';
      console.log(`      ${branch} create a goal for each uncovered ask`);
      console.log(`      ${cont} ├─ new goal for asks not yet represented`);
      console.log(
        `      ${cont} │  └─ rhx goal.memory.set --slug $new --covers [hash]`,
      );
      console.log(`      ${cont} └─ append to open goal for related asks`);
      console.log(
        `      ${cont}    └─ rhx goal.memory.set --slug $open --covers [hash]`,
      );
    }
    if (hasIncomplete) {
      console.log(
        `      └─ complete incomplete goals via \`rhx goal.memory.set\``,
      );
    }
  }
};

/**
 * .what = owl wisdom for goal guard blocks
 * .why = gentler vibe for guard blocks
 */
const OWL_WISDOM_GUARD = '🦉 patience, friend.';

/**
 * .what = cli entrypoint for goal.guard PreToolUse hook
 * .why = blocks direct access to .goals/ to enforce skill usage
 *
 * reads tool invocation JSON from stdin (from claude code harness)
 * exits 0 if allowed (silent)
 * exits 2 if blocked (stderr output)
 */
export const goalGuard = async (): Promise<void> => {
  // read stdin JSON (from claude code PreToolUse hook)
  const stdinChunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    stdinChunks.push(chunk);
  }
  const stdinContent = Buffer.concat(stdinChunks).toString('utf-8').trim();

  // if no input, allow (edge case)
  if (!stdinContent) {
    return;
  }

  // parse tool invocation
  let toolName: string;
  let toolInput: { file_path?: string; command?: string };
  try {
    const parsed = JSON.parse(stdinContent);
    toolName = parsed.tool_name ?? '';
    toolInput = parsed.tool_input ?? {};
  } catch (error) {
    // allowlist SyntaxError (malformed JSON from harness)
    if (error instanceof SyntaxError) return;
    // rethrow real errors
    throw error;
  }

  // evaluate verdict
  const verdict = getGoalGuardVerdict({ toolName, toolInput });

  // if allowed, silent exit
  if (verdict.verdict === 'allowed') {
    return;
  }

  // blocked: emit treestruct to stderr
  console.error(OWL_WISDOM_GUARD);
  console.error('');
  console.error('🔮 goal.guard');
  console.error('   ├─ ✋ blocked: direct access to .goals/ is forbidden');
  console.error('   │');
  console.error('   └─ use skills instead');
  console.error('      ├─ goal.memory.set — persist or update a goal');
  console.error('      ├─ goal.memory.get — retrieve goal state');
  console.error('      ├─ goal.triage.infer — detect uncovered asks');
  console.error('      └─ goal.triage.next — show unfinished goals');

  process.exit(2);
};

/**
 * .what = parse args for goal.triage.next
 * .why = extract --when, --scope from argv
 */
const parseArgsForTriageNext = async (
  argv: string[],
): Promise<{
  when: 'hook.onStop' | 'hook.onBoot';
  scope: 'route' | 'repo';
}> => {
  const args = isNodeEvalMode() ? argv.slice(1) : argv.slice(2);

  let when: 'hook.onStop' | 'hook.onBoot' | undefined;
  let scope: 'route' | 'repo' = await getDefaultScope();

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--when' && args[i + 1]) {
      const whenValue = args[i + 1];
      if (whenValue !== 'hook.onStop' && whenValue !== 'hook.onBoot') {
        throw new BadRequestError(
          `invalid --when: ${whenValue}. must be 'hook.onStop' or 'hook.onBoot'`,
          { when: whenValue },
        );
      }
      when = whenValue;
      i++;
    }
    if (arg === '--scope' && args[i + 1]) {
      const scopeValue = args[i + 1];
      if (scopeValue !== 'route' && scopeValue !== 'repo') {
        throw new BadRequestError(
          `invalid scope: ${scopeValue}. must be 'route' or 'repo'`,
          { scope: scopeValue },
        );
      }
      scope = scopeValue;
      i++;
    }
  }

  if (!when) {
    throw new BadRequestError('--when hook.onStop|hook.onBoot is required', {});
  }

  return { when, scope };
};

/**
 * .what = cli entrypoint for goal.triage.next skill
 * .why = onStop hook that shows unfinished goals to mandate continuation
 *
 * shows inflight goals if any exist (priority)
 * shows enqueued goals if no inflight
 * silent exit if no unfinished goals
 */
export const goalTriageNext = async (): Promise<void> => {
  // parse args
  const { scope, when } = await parseArgsForTriageNext(process.argv);

  // get scope directory
  let scopeDir: string;
  try {
    scopeDir = await getScopeDir(scope);
  } catch (error) {
    // allowlist BadRequestError (scope unavailable), rethrow real errors
    if (!(error instanceof BadRequestError)) throw error;
    // scope dir unavailable (e.g., not bound to route), no goals
    return;
  }

  // get inflight and enqueued goals
  const inflightGoals = await getGoals({
    scopeDir,
    filter: { status: 'inflight' },
  });
  const enqueuedGoals = await getGoals({
    scopeDir,
    filter: { status: 'enqueued' },
  });

  // if no unfinished goals, silent exit
  if (inflightGoals.goals.length === 0 && enqueuedGoals.goals.length === 0) {
    return;
  }

  // track blocker state for escalation
  const priorityGoal =
    inflightGoals.goals.length > 0
      ? (inflightGoals.goals[0] as Goal)
      : (enqueuedGoals.goals[0] as Goal);
  const { state: blockerState } = await setGoalBlockerState({
    scopeDir,
    goalSlug: priorityGoal.slug,
  });

  // emit treestruct to stderr (for visibility on exit 2)
  console.error(escalateMessageByCount(blockerState.count));
  console.error('');
  console.error(`🔮 goal.triage.next --when ${when}`);

  // show inflight if any (priority)
  if (inflightGoals.goals.length > 0) {
    console.error(`   └─ inflight (${inflightGoals.goals.length})`);
    for (let i = 0; i < inflightGoals.goals.length; i++) {
      const goal = inflightGoals.goals[i] as Goal;
      const isLast = i === inflightGoals.goals.length - 1;
      const branch = isLast ? '└─' : '├─';
      const cont = isLast ? '   ' : '│  ';
      console.error(`      ${branch} (${i + 1})`);
      console.error(`      ${cont}├─ slug = ${goal.slug}`);
      const askText = goal.why?.ask ?? '(no ask)';
      const askShort = asTruncatedText(askText, 60);
      console.error(`      ${cont}├─ why.ask = ${askShort}`);
      console.error(`      ${cont}├─ status = inflight → ✋ finish this first`);
      console.error(
        `      ${cont}└─ tip: run \`rhx goal.memory.get --slug ${goal.slug}\` to see the goal`,
      );
    }
    process.exit(2);
  }

  // show enqueued if no inflight
  if (enqueuedGoals.goals.length > 0) {
    console.error(`   └─ enqueued (${enqueuedGoals.goals.length})`);
    for (let i = 0; i < enqueuedGoals.goals.length; i++) {
      const goal = enqueuedGoals.goals[i] as Goal;
      const isLast = i === enqueuedGoals.goals.length - 1;
      const branch = isLast ? '└─' : '├─';
      const cont = isLast ? '   ' : '│  ';
      console.error(`      ${branch} (${i + 1})`);
      console.error(`      ${cont}├─ slug = ${goal.slug}`);
      const askText = goal.why?.ask ?? '(no ask)';
      const askShort = asTruncatedText(askText, 60);
      console.error(`      ${cont}├─ why.ask = ${askShort}`);
      console.error(`      ${cont}├─ status = enqueued → ✋ finish this first`);
      console.error(
        `      ${cont}└─ tip: run \`rhx goal.memory.get --slug ${goal.slug}\` to see the goal`,
      );
    }
    process.exit(2);
  }
};
