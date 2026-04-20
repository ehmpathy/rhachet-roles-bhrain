/**
 * .what = cli entrypoints for achiever goal skills
 * .why = enables shell invocation via package-level import
 */
import { execSync } from 'child_process';
import { BadRequestError } from 'helpful-errors';

import {
  computeGoalCompleteness,
  GOAL_STATUS_CHOICES,
  Goal,
  GoalHow,
  GoalStatus,
  type GoalStatusChoice,
  GoalWhat,
  GoalWhy,
} from '@src/domain.objects/Achiever/Goal';
import { delGoalBlockerState } from '@src/domain.operations/goal/delGoalBlockerState';
import { getGoalBlockerState } from '@src/domain.operations/goal/getGoalBlockerState';
import { getGoalGuardVerdict } from '@src/domain.operations/goal/getGoalGuardVerdict';
import { getGoals } from '@src/domain.operations/goal/getGoals';
import { getTriageState } from '@src/domain.operations/goal/getTriageState';
import { setGoal, setGoalStatus } from '@src/domain.operations/goal/setGoal';
import { setGoalBlockerState } from '@src/domain.operations/goal/setGoalBlockerState';
import { getRouteBindByBranch } from '@src/domain.operations/route/bind/getRouteBindByBranch';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const yaml = require('js-yaml');

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
 * .what = emit comprehensive help output for goal.memory.set
 * .why = helps brains understand how to use goals with best practices
 */
export const emitHelpOutput = (): void => {
  console.log('🦉 goal.memory.set — persist a goal');
  console.log('');
  console.log('🔮 usage');
  console.log('   ├─ example: create goal');
  console.log('   │  ├─');
  console.log('   │  │');
  console.log('   │  │  rhx goal.memory.set \\');
  console.log('   │  │    --slug fix-typo \\');
  console.log('   │  │    --why.ask "fix the typo in readme" \\');
  console.log('   │  │    --why.purpose "docs should be correct" \\');
  console.log('   │  │    --why.benefit "users trust the project" \\');
  console.log('   │  │    --what.outcome "readme has no typos" \\');
  console.log('   │  │    --how.task "find and fix the typo" \\');
  console.log('   │  │    --how.gate "spell check passes" \\');
  console.log('   │  │    --source peer:human');
  console.log('   │  │');
  console.log('   │  └─');
  console.log('   │');
  console.log('   ├─ example: create goal (multiline)');
  console.log('   │  ├─');
  console.log('   │  │');
  console.log('   │  │  rhx goal.memory.set \\');
  console.log('   │  │    --slug refactor-auth-module \\');
  console.log(
    '   │  │    --why.ask "refactor the auth module to use JWT tokens',
  );
  console.log(
    '   │  │      instead of session cookies for better stateless scale" \\',
  );
  console.log(
    '   │  │    --why.purpose "current session-based auth requires sticky',
  );
  console.log(
    '   │  │      sessions which limits horizontal scale options" \\',
  );
  console.log(
    '   │  │    --why.benefit "infrastructure can scale horizontally without',
  );
  console.log(
    '   │  │      session affinity, reduces costs and improves reliability" \\',
  );
  console.log('   │  │    --what.outcome "auth module uses JWT tokens for all');
  console.log('   │  │      authentication flows, sessions are stateless" \\');
  console.log(
    '   │  │    --how.task "1. add JWT library, 2. update auth middleware,',
  );
  console.log(
    '   │  │      3. migrate extant sessions, 4. update client code" \\',
  );
  console.log('   │  │    --how.gate "all auth tests pass, load test shows');
  console.log('   │  │      no session affinity required" \\');
  console.log('   │  │    --status.choice enqueued \\');
  console.log('   │  │    --status.reason "will start after current task" \\');
  console.log('   │  │    --source peer:human');
  console.log('   │  │');
  console.log('   │  └─');
  console.log('   │');
  console.log('   ├─ example: fulfill goal');
  console.log('   │  ├─');
  console.log('   │  │');
  console.log('   │  │  rhx goal.memory.set \\');
  console.log('   │  │    --slug fix-login-bug \\');
  console.log('   │  │    --status.choice fulfilled \\');
  console.log('   │  │    --status.reason "fixed in commit abc123,');
  console.log('   │  │      root cause was race condition in token refresh"');
  console.log('   │  │');
  console.log('   │  └─');
  console.log('   │');
  console.log('   ├─ example: block goal');
  console.log('   │  ├─');
  console.log('   │  │');
  console.log('   │  │  rhx goal.memory.set \\');
  console.log('   │  │    --slug deploy-to-prod \\');
  console.log('   │  │    --status.choice blocked \\');
  console.log('   │  │    --status.reason "blocked on security review,');
  console.log('   │  │      awaited infosec team approval by 2026-04-20"');
  console.log('   │  │');
  console.log('   │  └─');
  console.log('   │');
  console.log('   ├─ required fields');
  console.log('   │  ├─ --slug           goal identifier');
  console.log('   │  ├─ --why.ask        the original ask from human');
  console.log('   │  ├─ --why.purpose    why this matters');
  console.log('   │  ├─ --why.benefit    what success enables');
  console.log('   │  ├─ --what.outcome   expected result');
  console.log('   │  ├─ --how.task       work to be done');
  console.log('   │  └─ --how.gate       success criteria');
  console.log('   │');
  console.log('   └─ optional fields');
  console.log(
    '      ├─ --status.choice  incomplete | blocked | enqueued | inflight | fulfilled',
  );
  console.log('      ├─ --status.reason  reason for current status');
  console.log('      ├─ --covers         comma-separated ask hashes');
  console.log('      ├─ --source         peer:human | peer:system');
  console.log(
    '      └─ --scope          route | repo (automatic — rarely needed)',
  );
};

/**
 * .what = emit help output for goal.memory.get
 * .why = helps brains understand how to retrieve goals
 */
export const emitHelpOutputGet = (): void => {
  console.log('🦉 goal.memory.get — retrieve goals');
  console.log('');
  console.log('🔮 usage');
  console.log('   ├─ example: list all goals');
  console.log('   │  └─ rhx goal.memory.get');
  console.log('   │');
  console.log('   ├─ example: filter by status');
  console.log('   │  └─ rhx goal.memory.get --status.choice inflight');
  console.log('   │');
  console.log('   ├─ example: get specific goal');
  console.log('   │  └─ rhx goal.memory.get --slug fix-login-bug');
  console.log('   │');
  console.log('   └─ flags');
  console.log('      ├─ --slug           filter by goal slug');
  console.log(
    '      ├─ --status.choice  filter by status (incomplete | blocked | enqueued | inflight | fulfilled)',
  );
  console.log(
    '      └─ --scope          route | repo (automatic — rarely needed)',
  );
};

/**
 * .what = emit help output for goal.triage.infer
 * .why = helps brains understand how to check triage state
 */
export const emitHelpOutputTriage = (): void => {
  console.log('🦉 goal.triage.infer — check triage state');
  console.log('');
  console.log('🔮 usage');
  console.log('   ├─ example: show triage state');
  console.log('   │  └─ rhx goal.triage.infer');
  console.log('   │');
  console.log('   ├─ what it shows');
  console.log('   │  ├─ uncovered asks (need goals)');
  console.log('   │  ├─ incomplete goals (need fields)');
  console.log('   │  └─ coverage summary');
  console.log('   │');
  console.log('   └─ flags');
  console.log('      ├─ --when   triage | hook.onStop (default: triage)');
  console.log('      └─ --scope  route | repo (automatic — rarely needed)');
};

/**
 * .what = emit help output for goal.triage.next
 * .why = helps brains understand how to get next goal
 */
export const emitHelpOutputTriageNext = (): void => {
  console.log('🦉 goal.triage.next — get next goal to work on');
  console.log('');
  console.log('🔮 usage');
  console.log('   ├─ hook modes');
  console.log('   │  ├─ rhx goal.triage.next --when hook.onBoot');
  console.log('   │  │  └─ refreshes goal state into context after compaction');
  console.log('   │  │');
  console.log('   │  └─ rhx goal.triage.next --when hook.onStop');
  console.log('   │     └─ halts with reminder if unfinished goals remain');
  console.log('   │');
  console.log('   ├─ what it shows');
  console.log('   │  ├─ inflight goals (priority)');
  console.log('   │  └─ enqueued goals (queued)');
  console.log('   │');
  console.log('   └─ flags');
  console.log('      ├─ --when   hook.onBoot | hook.onStop (required)');
  console.log('      └─ --scope  route | repo (automatic — rarely needed)');
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
): void => {
  const isLast = index === total - 1;
  const branch = isLast ? '└─' : '├─';
  const cont = isLast ? '   ' : '│  ';
  const meta = computeGoalCompleteness(goal);
  const isAbsent = (field: string) => meta.absent.includes(field);

  console.log(`${indent}${branch} (${index + 1})`);
  console.log(`${indent}${cont}├─ slug = ${goal.slug}`);

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

  // source
  console.log(`${indent}${cont}└─ source = ${goal.source}`);
};

/**
 * .what = detect if running in node -e mode
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
    const branchFlat = branch.replace(/\//g, '.');
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
 * .what = all valid flags for goal.memory.set
 * .why = enables fail-fast on unknown flags
 */
export const KNOWN_FLAGS = [
  '--slug',
  '--scope',
  '--status.choice',
  '--covers',
  '--help',
  ...FIELD_FLAGS,
] as const;

/**
 * .what = all valid top-level keys for goal YAML input
 * .why = enables fail-fast on unknown YAML keys
 */
export const ALLOWED_YAML_KEYS = [
  'slug',
  'why',
  'what',
  'how',
  'status',
  'source',
  'covers',
  'createdAt',
  'updatedAt',
] as const;

/**
 * .what = all valid keys within the 'why' section of goal YAML
 * .why = enables fail-fast on unknown nested keys
 */
export const ALLOWED_WHY_KEYS = ['ask', 'purpose', 'benefit'] as const;

/**
 * .what = all valid keys within the 'what' section of goal YAML
 * .why = enables fail-fast on unknown nested keys
 */
export const ALLOWED_WHAT_KEYS = ['outcome'] as const;

/**
 * .what = all valid keys within the 'how' section of goal YAML
 * .why = enables fail-fast on unknown nested keys
 */
export const ALLOWED_HOW_KEYS = ['task', 'gate'] as const;

/**
 * .what = all valid keys within the 'status' section of goal YAML
 * .why = enables fail-fast on unknown nested keys
 */
export const ALLOWED_STATUS_KEYS = ['choice', 'reason'] as const;

/**
 * .what = all valid flags for goal.memory.get
 * .why = enables fail-fast on unknown flags
 */
export const KNOWN_FLAGS_GET = [
  '--scope',
  '--status.choice',
  '--slug',
  '--help',
] as const;

/**
 * .what = all valid flags for goal.triage.infer
 * .why = enables fail-fast on unknown flags
 */
export const KNOWN_FLAGS_TRIAGE = ['--scope', '--when', '--help'] as const;

/**
 * .what = all valid flags for goal.triage.next
 * .why = enables fail-fast on unknown flags
 */
export const KNOWN_FLAGS_TRIAGE_NEXT = ['--when', '--scope', '--help'] as const;

/**
 * .what = emit validation error in owl vibes format
 * .why = consistent error output across all validation failures
 */
const emitValidationError = (input: {
  context: string;
  error: string;
  details?: string[];
  allowed?: string[];
  hint?: string;
}): void => {
  console.error('🦉 patience, friend.');
  console.error('');
  console.error(`🔮 ${input.context}`);
  console.error(`   ├─ ✋ ${input.error}`);
  if (input.details && input.details.length > 0) {
    for (const detail of input.details) {
      console.error(`   │  └─ ${detail}`);
    }
  }
  console.error('   │');
  if (input.allowed && input.allowed.length > 0) {
    console.error('   └─ allowed');
    for (let i = 0; i < input.allowed.length; i++) {
      const isLast = i === input.allowed.length - 1;
      console.error(`      ${isLast ? '└─' : '├─'} ${input.allowed[i]}`);
    }
  }
  if (input.hint) {
    console.error(`   └─ hint: ${input.hint}`);
  }
};

/**
 * .what = rhachet meta-flags to skip in validation
 * .why = rhachet passes --skill to shell scripts, must be filtered out
 */
const RHACHET_META_FLAGS = ['--skill'] as const;

/**
 * .what = collect unknown flags from argv
 * .why = enables fail-fast with error that shows unknown flags
 */
const collectUnknownFlags = (
  args: string[],
  knownFlags: readonly string[],
): string[] => {
  const unknown: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i] as string;
    if (arg.startsWith('--')) {
      // skip rhachet meta-flags (e.g., --skill passed by rhx)
      if (
        RHACHET_META_FLAGS.includes(arg as (typeof RHACHET_META_FLAGS)[number])
      ) {
        const next = args[i + 1];
        if (next && !next.startsWith('--')) {
          i++; // skip the value
        }
        continue;
      }
      if (!knownFlags.includes(arg)) {
        unknown.push(arg);
      }
      // skip next arg if it's a value (not a flag)
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        i++;
      }
    }
  }
  return unknown;
};

/**
 * .what = validate status value is a valid choice
 * .why = fail-fast on invalid status with helpful error
 */
const validateStatusValue = (status: string): GoalStatusChoice => {
  if (!GOAL_STATUS_CHOICES.includes(status as GoalStatusChoice)) {
    throw new BadRequestError(`invalid status: ${status}`, {
      context: 'goal.memory.set --status.choice',
      status,
      allowed: GOAL_STATUS_CHOICES,
      hint: `use one of: ${GOAL_STATUS_CHOICES.join(', ')}`,
    });
  }
  return status as GoalStatusChoice;
};

/**
 * .what = collect unknown keys from YAML input
 * .why = enables fail-fast with error that shows each unknown key
 */
const collectUnknownYamlKeys = (
  parsed: Record<string, unknown>,
): { path: string; key: string }[] => {
  const unknown: { path: string; key: string }[] = [];

  // check top-level keys
  for (const key of Object.keys(parsed)) {
    if (
      !ALLOWED_YAML_KEYS.includes(key as (typeof ALLOWED_YAML_KEYS)[number])
    ) {
      unknown.push({ path: '', key });
    }
  }

  // check nested keys in 'why'
  if (parsed.why && typeof parsed.why === 'object') {
    for (const key of Object.keys(parsed.why as object)) {
      if (
        !ALLOWED_WHY_KEYS.includes(key as (typeof ALLOWED_WHY_KEYS)[number])
      ) {
        unknown.push({ path: 'why', key });
      }
    }
  }

  // check nested keys in 'what'
  if (parsed.what && typeof parsed.what === 'object') {
    for (const key of Object.keys(parsed.what as object)) {
      if (
        !ALLOWED_WHAT_KEYS.includes(key as (typeof ALLOWED_WHAT_KEYS)[number])
      ) {
        unknown.push({ path: 'what', key });
      }
    }
  }

  // check nested keys in 'how'
  if (parsed.how && typeof parsed.how === 'object') {
    for (const key of Object.keys(parsed.how as object)) {
      if (
        !ALLOWED_HOW_KEYS.includes(key as (typeof ALLOWED_HOW_KEYS)[number])
      ) {
        unknown.push({ path: 'how', key });
      }
    }
  }

  // check nested keys in 'status'
  if (parsed.status && typeof parsed.status === 'object') {
    for (const key of Object.keys(parsed.status as object)) {
      if (
        !ALLOWED_STATUS_KEYS.includes(
          key as (typeof ALLOWED_STATUS_KEYS)[number],
        )
      ) {
        unknown.push({ path: 'status', key });
      }
    }
  }

  return unknown;
};

/**
 * .what = validate YAML input has no unknown keys
 * .why = fail-fast with error that shows each unknown key
 */
const validateYamlKeys = (parsed: Record<string, unknown>): void => {
  const unknown = collectUnknownYamlKeys(parsed);
  if (unknown.length > 0) {
    const details = unknown.map(({ path, key }) =>
      path ? `${path}.${key}` : key,
    );
    throw new BadRequestError(`unknown keys: ${details.join(', ')}`, {
      context: 'goal.memory.set (yaml input)',
      unknownKeys: details,
      allowed: [
        ...ALLOWED_YAML_KEYS,
        'why.{ask, purpose, benefit}',
        'what.{outcome}',
        'how.{task, gate}',
        'status.{choice, reason}',
      ],
      hint: 'remove unknown keys from yaml input',
    });
  }
};

/**
 * .what = validate status.choice in YAML is a valid value
 * .why = fail-fast on invalid status with helpful error
 */
const validateYamlStatusChoice = (parsed: Record<string, unknown>): void => {
  const parsedStatus = parsed.status as Record<string, unknown> | undefined;
  if (parsedStatus?.choice) {
    const choice = parsedStatus.choice as string;
    if (!GOAL_STATUS_CHOICES.includes(choice as GoalStatusChoice)) {
      throw new BadRequestError(`invalid status.choice: ${choice}`, {
        context: 'goal.memory.set (yaml input)',
        choice,
        allowed: GOAL_STATUS_CHOICES,
        hint: `use one of: ${GOAL_STATUS_CHOICES.join(', ')}`,
      });
    }
  }
};

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
 * .what = assert --scope repo is not used while bound to a route
 * .why = scope is automatic when bound to a route; explicit repo scope is forbidden
 */
const assertScopeWhenBound = async (
  explicitScope: 'route' | 'repo' | undefined,
): Promise<void> => {
  if (explicitScope !== 'repo') {
    return; // no explicit --scope repo, check not needed
  }

  // check if bound to a route
  const bind = await getRouteBindByBranch({ branch: null });
  if (bind) {
    emitValidationError({
      context: 'goal.memory.set --scope repo',
      error: 'scope is automatic when bound to a route',
      hint: 'remove --scope flag; scope defaults to route when bound',
    });
    process.exit(2);
  }
};

/**
 * .what = parse args for goal.memory.set
 * .why = extract --scope, --covers, --slug, --status.choice, and field flags from argv
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
  hasHelp: boolean;
}> => {
  // in -e mode: argv = [node, --arg, value] → slice(1) to get args
  // in normal mode: argv = [node, file.js, --arg, value] → slice(2) to skip file
  const args = isNodeEvalMode() ? argv.slice(1) : argv.slice(2);

  // validate unknown flags before parse
  const unknownFlags = collectUnknownFlags(args, KNOWN_FLAGS);
  if (unknownFlags.length > 0) {
    emitValidationError({
      context: 'goal.memory.set',
      error: `unknown flags: ${unknownFlags.join(', ')}`,
      allowed: KNOWN_FLAGS as unknown as string[],
    });
    process.exit(2);
  }

  let scope: 'route' | 'repo' = await getDefaultScope();
  let explicitScope: 'route' | 'repo' | undefined;
  let covers: string[] | undefined;
  let slug: string | undefined;
  let status: GoalStatusChoice | undefined;
  const flagValues = new Map<string, string>();
  let hasFieldFlags = false;
  let hasHelp = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i] as string;
    const nextArg = args[i + 1];
    if (arg === '--help') {
      hasHelp = true;
      continue;
    }
    if (arg === '--scope' && nextArg) {
      if (nextArg !== 'route' && nextArg !== 'repo') {
        throw new BadRequestError(
          `invalid scope: ${nextArg}. must be 'route' or 'repo'`,
          { scope: nextArg },
        );
      }
      scope = nextArg;
      explicitScope = nextArg;
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
    if (arg === '--status.choice' && nextArg) {
      // validate status value
      status = validateStatusValue(nextArg);
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

  // validate --scope repo is not used while bound to a route
  await assertScopeWhenBound(explicitScope);

  return { scope, covers, slug, status, fields, hasFieldFlags, hasHelp };
};

/**
 * .what = parse args for goal.memory.get
 * .why = extract --scope, --status.choice, --slug, --help from argv
 */
const parseArgsForGet = async (
  argv: string[],
): Promise<{
  scope: 'route' | 'repo';
  status?: GoalStatusChoice;
  slug?: string;
  hasHelp: boolean;
}> => {
  // in -e mode: argv = [node, --arg, value] → slice(1) to get args
  // in normal mode: argv = [node, file.js, --arg, value] → slice(2) to skip file
  const args = isNodeEvalMode() ? argv.slice(1) : argv.slice(2);

  // validate unknown flags before parse
  const unknownFlags = collectUnknownFlags(args, KNOWN_FLAGS_GET);
  if (unknownFlags.length > 0) {
    emitValidationError({
      context: 'goal.memory.get',
      error: `unknown flags: ${unknownFlags.join(', ')}`,
      allowed: KNOWN_FLAGS_GET as unknown as string[],
    });
    process.exit(2);
  }

  let scope: 'route' | 'repo' = await getDefaultScope();
  let status: GoalStatusChoice | undefined;
  let slug: string | undefined;
  let hasHelp = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help') {
      hasHelp = true;
      continue;
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
    if (arg === '--status.choice' && args[i + 1]) {
      status = args[i + 1] as GoalStatusChoice;
      i++;
    }
    if (arg === '--slug' && args[i + 1]) {
      slug = args[i + 1];
      i++;
    }
  }

  return { scope, status, slug, hasHelp };
};

/**
 * .what = parse args for goal.triage.infer
 * .why = extract --scope, --when, --help from argv
 */
const parseArgsForTriage = async (
  argv: string[],
): Promise<{
  scope: 'route' | 'repo';
  mode: 'triage' | 'hook.onStop';
  hasHelp: boolean;
}> => {
  // in -e mode: argv = [node, --arg, value] → slice(1) to get args
  // in normal mode: argv = [node, file.js, --arg, value] → slice(2) to skip file
  const args = isNodeEvalMode() ? argv.slice(1) : argv.slice(2);

  // validate unknown flags before parse
  const unknownFlags = collectUnknownFlags(args, KNOWN_FLAGS_TRIAGE);
  if (unknownFlags.length > 0) {
    emitValidationError({
      context: 'goal.triage.infer',
      error: `unknown flags: ${unknownFlags.join(', ')}`,
      allowed: KNOWN_FLAGS_TRIAGE as unknown as string[],
    });
    process.exit(2);
  }

  let scope: 'route' | 'repo' = await getDefaultScope();
  let mode: 'triage' | 'hook.onStop' = 'triage';
  let hasHelp = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help') {
      hasHelp = true;
      continue;
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
    if (arg === '--when' && args[i + 1]) {
      mode = args[i + 1] as 'triage' | 'hook.onStop';
      i++;
    }
  }

  return { scope, mode, hasHelp };
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
      timeout: 100,
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
 * .what = build goal from CLI flags
 * .why = enables partial goal creation via flags without YAML
 */
const buildGoalFromFlags = (
  slug: string,
  fields: ParsedFields,
  status?: GoalStatusChoice,
): Goal => {
  const now = new Date().toISOString().split('T')[0] as string;

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
  const { scope, covers, slug, status, fields, hasFieldFlags, hasHelp } =
    await parseArgsForSet(process.argv, stdinContent);

  // handle --help
  if (hasHelp) {
    emitHelpOutput();
    return;
  }

  const scopeDir = await getScopeDir(scope);

  // mode 1: status update (--slug and --status.choice, with optional --status.reason)
  // note: --status.reason @stdin requires explicit flag (no implicit stdin consumption)
  if (slug && status && !hasFieldFlags) {
    const reason = fields['status.reason']?.trim() || 'status updated';

    const result = await setGoalStatus({
      slug,
      status: { choice: status, reason },
      covers,
      scopeDir,
    });

    // fetch updated goal for full display
    const updatedGoals = await getGoals({ scopeDir, filter: { slug } });
    const updatedGoal = updatedGoals.goals[0];

    // emit treestruct output with full goal display
    emitOwlHeader();
    console.log(`🔮 goal.memory.set --slug ${slug} --status.choice ${status}`);
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
      // filter out undefined values so they don't overwrite extant fields
      const filterUndefined = <T extends Record<string, unknown>>(
        obj: T,
      ): Partial<T> =>
        Object.fromEntries(
          Object.entries(obj).filter(([_, v]) => v !== undefined),
        ) as Partial<T>;

      const result = await setGoalStatus({
        slug,
        status: status
          ? {
              choice: status,
              reason: fields['status.reason'] || 'status updated',
            }
          : undefined,
        fields: {
          why: filterUndefined({
            ask: fields['why.ask'],
            purpose: fields['why.purpose'],
            benefit: fields['why.benefit'],
          }),
          what: filterUndefined({
            outcome: fields['what.outcome'],
          }),
          how: filterUndefined({
            task: fields['how.task'],
            gate: fields['how.gate'],
          }),
        },
        covers,
        scopeDir,
      });

      // fetch updated goal for full display
      const updatedGoals = await getGoals({ scopeDir, filter: { slug } });
      const updatedGoal = updatedGoals.goals[0];

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
      const updatedGoal = updatedGoals.goals[0];

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
    throw new BadRequestError(
      'goal YAML required via stdin, or use --slug with field flags',
      {
        context: 'goal.memory.set',
        hint: [
          'usage (full goal via YAML):',
          '  cat goal.yaml | rhx goal.memory.set',
          '',
          'usage (partial goal via flags):',
          "  rhx goal.memory.set --slug 'fix-test' --why.ask 'fix the flaky test'",
        ].join('\n'),
      },
    );
  }

  const parsed = yaml.load(stdinContent) as Record<string, unknown>;

  // validate YAML keys and status choice
  validateYamlKeys(parsed);
  validateYamlStatusChoice(parsed);

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

  const now = new Date().toISOString().split('T')[0] as string;

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
  const { scope, status, slug, hasHelp } = await parseArgsForGet(process.argv);

  // handle --help
  if (hasHelp) {
    emitHelpOutputGet();
    return;
  }

  const scopeDir = await getScopeDir(scope);

  const result = await getGoals({
    scopeDir,
    filter: { status, slug },
  });

  // emit treestruct output
  emitOwlHeader();
  console.log(`🔮 goal.memory.get --scope ${scope}`);

  if (result.goals.length === 0) {
    console.log('   └─ goals = (none)');
    return;
  }

  console.log(`   └─ goals (${result.goals.length})`);
  for (let i = 0; i < result.goals.length; i++) {
    const goal = result.goals[i] as Goal;
    emitGoalCondensed(goal, i, result.goals.length);
  }
};

/**
 * .what = cli entrypoint for goal.triage.infer skill
 * .why = enables shell invocation via package-level import
 */
export const goalTriageInfer = async (): Promise<void> => {
  // parse and validate args
  const { scope, mode, hasHelp } = await parseArgsForTriage(process.argv);

  // handle --help
  if (hasHelp) {
    emitHelpOutputTriage();
    return;
  }

  const scopeDir = await getScopeDir(scope);

  const state = await getTriageState({ scopeDir });

  // hook.onStop mode: halt if uncovered asks OR incomplete goals, silent if all clear
  if (mode === 'hook.onStop') {
    const hasUncovered = state.asksUncovered.length > 0;
    const hasIncomplete = state.goalsIncomplete.length > 0;

    if (hasUncovered || hasIncomplete) {
      // build formatted message for constraint error
      const lines: string[] = [];
      lines.push('🦉 to forget an ask is to break a promise. remember.');
      lines.push('');
      lines.push('🔮 goal.triage.infer --when hook.onStop');

      if (hasUncovered) {
        lines.push(`   ├─ uncovered asks = ${state.asksUncovered.length}`);
      }
      if (hasIncomplete) {
        lines.push(`   ├─ incomplete goals = ${state.goalsIncomplete.length}`);
        for (let i = 0; i < state.goalsIncomplete.length; i++) {
          const goal = state.goalsIncomplete[i]!;
          const isLast = i === state.goalsIncomplete.length - 1;
          const branch = isLast ? '└─' : '├─';
          const cont = isLast ? '   ' : '│  ';
          lines.push(`   │  ${branch} ${goal.slug}`);
          const meta = computeGoalCompleteness(goal);
          lines.push(`   │  ${cont}├─ absent: ${meta.absent.join(', ')}`);
          const firstAbsent = meta.absent[0] ?? 'why.purpose';
          lines.push(
            `   │  ${cont}└─ to fix, run: \`rhx goal.memory.set --slug ${goal.slug} --${firstAbsent} "..."\``,
          );
        }
      }

      lines.push('   │');
      lines.push('   └─ halted, triage required');

      if (hasUncovered) {
        lines.push('      ├─ each ask must be covered by a goal');
      }
      if (hasIncomplete) {
        lines.push('      ├─ incomplete goals must be articulated');
      }

      lines.push('      │');
      lines.push('      └─ to continue, run');
      lines.push('         └─ rhx goal.triage.infer');

      // emit formatted message to stderr, then exit with constraint code
      console.error(lines.join('\n'));
      process.exit(2);
    }
    // all asks covered and all goals complete, silent exit
    return;
  }

  // triage mode: show full state with treestruct vibes
  emitOwlHeader();
  console.log(`🔮 goal.triage.infer --scope ${scope}`);

  // summary
  console.log(`   ├─ asks = ${state.asks.length}`);
  console.log(`   ├─ uncovered = ${state.asksUncovered.length}`);
  console.log(`   ├─ goals = ${state.goals.length}`);
  console.log(`   │  ├─ complete = ${state.goalsComplete.length}`);
  console.log(`   │  └─ incomplete = ${state.goalsIncomplete.length}`);
  console.log(`   ├─ coverage = ${state.coverage.length}`);

  // uncovered asks
  if (state.asksUncovered.length > 0) {
    console.log(`   │`);
    console.log(`   ├─ uncovered asks`);
    for (let i = 0; i < state.asksUncovered.length; i++) {
      const ask = state.asksUncovered[i]!;
      const isLast = i === state.asksUncovered.length - 1;
      const branch = isLast ? '└─' : '├─';
      const hashShort = ask.hash.slice(0, 7);
      const contentShort = ask.content.slice(0, 50);
      const ellipsis = ask.content.length > 50 ? '...' : '';
      console.log(`   │  ${branch} [${hashShort}] ${contentShort}${ellipsis}`);
    }
  }

  // incomplete goals
  if (state.goalsIncomplete.length > 0) {
    console.log(`   │`);
    console.log(`   ├─ incomplete goals`);
    for (let i = 0; i < state.goalsIncomplete.length; i++) {
      const goal = state.goalsIncomplete[i]!;
      const isLast = i === state.goalsIncomplete.length - 1;
      const branch = isLast ? '└─' : '├─';
      const cont = isLast ? '   ' : '│  ';
      console.log(`   │  ${branch} ${goal.slug} [${goal.status.choice}]`);
      const meta = computeGoalCompleteness(goal);
      console.log(`   │  ${cont}├─ absent: ${meta.absent.join(', ')}`);
      const firstAbsent = meta.absent[0] ?? 'why.purpose';
      console.log(
        `   │  ${cont}└─ to fix, run: \`rhx goal.memory.set --slug ${goal.slug} --${firstAbsent} "..."\``,
      );
    }
  }

  // complete goals
  if (state.goalsComplete.length > 0) {
    console.log(`   │`);
    console.log(`   ├─ complete goals`);
    for (let i = 0; i < state.goalsComplete.length; i++) {
      const goal = state.goalsComplete[i]!;
      const isLast = i === state.goalsComplete.length - 1;
      const branch = isLast ? '└─' : '├─';
      console.log(`   │  ${branch} ${goal.slug} [${goal.status.choice}]`);
    }
  }

  // status
  const allClear =
    state.asksUncovered.length === 0 && state.goalsIncomplete.length === 0;
  console.log(`   │`);
  if (allClear) {
    console.log(`   └─ all asks covered, all goals complete`);
  } else {
    console.log(`   └─ triage required`);
    if (state.asksUncovered.length > 0) {
      console.log(`      ├─ cover uncovered asks with goals`);
    }
    if (state.goalsIncomplete.length > 0) {
      console.log(
        `      ├─ complete incomplete goals via \`rhx goal.memory.set\``,
      );
    }
    console.log(`      └─ then re-run \`rhx goal.triage.infer\``);
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
  } catch {
    // malformed JSON, allow (harness issue)
    return;
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

  // exit with constraint code (message already printed to stderr)
  process.exit(2);
};

/**
 * .what = valid values for --when flag in goal.triage.next
 * .why = enables type-safe validation of when parameter
 */
type TriageNextWhen = 'hook.onStop' | 'hook.onBoot';
const TRIAGE_NEXT_WHEN_VALUES: TriageNextWhen[] = [
  'hook.onStop',
  'hook.onBoot',
];

/**
 * .what = parse args for goal.triage.next
 * .why = extract --when, --scope from argv
 */
const parseArgsForTriageNext = async (
  argv: string[],
): Promise<{
  when?: TriageNextWhen;
  scope: 'route' | 'repo';
  hasHelp: boolean;
}> => {
  const args = isNodeEvalMode() ? argv.slice(1) : argv.slice(2);

  // validate unknown flags before parse
  const unknownFlags = collectUnknownFlags(args, KNOWN_FLAGS_TRIAGE_NEXT);
  if (unknownFlags.length > 0) {
    emitValidationError({
      context: 'goal.triage.next',
      error: `unknown flags: ${unknownFlags.join(', ')}`,
      allowed: KNOWN_FLAGS_TRIAGE_NEXT as unknown as string[],
    });
    process.exit(2);
  }

  let when: TriageNextWhen | undefined;
  let scope: 'route' | 'repo' = await getDefaultScope();
  let hasHelp = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help') {
      hasHelp = true;
      continue;
    }
    if (arg === '--when' && args[i + 1]) {
      const whenValue = args[i + 1] as TriageNextWhen;
      if (!TRIAGE_NEXT_WHEN_VALUES.includes(whenValue)) {
        throw new BadRequestError(
          `invalid --when: ${whenValue}. must be one of: ${TRIAGE_NEXT_WHEN_VALUES.join(', ')}`,
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

  // --when required unless --help
  if (!when && !hasHelp) {
    throw new BadRequestError(
      `--when is required. must be one of: ${TRIAGE_NEXT_WHEN_VALUES.join(', ')}`,
      {},
    );
  }

  return { when, scope, hasHelp };
};

/**
 * .what = emit goals summary for triage
 * .why = shared output for both onBoot (informational) and onStop (halt) modes
 */
const emitGoalsSummary = (input: {
  inflightGoals: Goal[];
  enqueuedGoals: Goal[];
  toStream: 'stdout' | 'stderr';
  isEscalated?: boolean;
}): void => {
  const emit =
    input.toStream === 'stdout'
      ? (msg: string) => console.log(msg)
      : (msg: string) => console.error(msg);
  const isEscalated = input.isEscalated ?? false;

  // show inflight if any (priority)
  if (input.inflightGoals.length > 0) {
    emit(`   └─ inflight (${input.inflightGoals.length})`);
    for (let i = 0; i < input.inflightGoals.length; i++) {
      const goal = input.inflightGoals[i] as Goal;
      const isLast = i === input.inflightGoals.length - 1;
      const branch = isLast ? '└─' : '├─';
      const cont = isLast ? '   ' : '│  ';
      emit(`      ${branch} (${i + 1})`);
      emit(`      ${cont}├─ slug = ${goal.slug}`);
      const askText = goal.why?.ask ?? '(no ask)';
      const askShort =
        askText.length > 60 ? askText.slice(0, 60) + '...' : askText;
      emit(`      ${cont}├─ why.ask = ${askShort}`);
      emit(`      ${cont}├─ status = inflight → ✋ finish this first`);
      if (isEscalated) {
        emit(`      ${cont}├─ tip: if halted, run:`);
        emit(
          `      ${cont}│  └─ rhx goal.memory.set --slug ${goal.slug} --status.choice blocked --status.reason "..."`,
        );
        emit(
          `      ${cont}└─ hint: run \`rhx goal.memory.get --slug ${goal.slug}\` to see the goal`,
        );
      } else {
        emit(
          `      ${cont}└─ tip: run \`rhx goal.memory.get --slug ${goal.slug}\` to see the goal`,
        );
      }
    }
    return;
  }

  // show enqueued if no inflight
  if (input.enqueuedGoals.length > 0) {
    emit(`   └─ enqueued (${input.enqueuedGoals.length})`);
    for (let i = 0; i < input.enqueuedGoals.length; i++) {
      const goal = input.enqueuedGoals[i] as Goal;
      const isLast = i === input.enqueuedGoals.length - 1;
      const branch = isLast ? '└─' : '├─';
      const cont = isLast ? '   ' : '│  ';
      emit(`      ${branch} (${i + 1})`);
      emit(`      ${cont}├─ slug = ${goal.slug}`);
      const askText = goal.why?.ask ?? '(no ask)';
      const askShort =
        askText.length > 60 ? askText.slice(0, 60) + '...' : askText;
      emit(`      ${cont}├─ why.ask = ${askShort}`);
      emit(`      ${cont}├─ status = enqueued → ✋ start this next`);
      if (isEscalated) {
        emit(`      ${cont}├─ tip: if halted, run:`);
        emit(
          `      ${cont}│  └─ rhx goal.memory.set --slug ${goal.slug} --status.choice blocked --status.reason "..."`,
        );
        emit(
          `      ${cont}└─ hint: run \`rhx goal.memory.get --slug ${goal.slug}\` to see the goal`,
        );
      } else {
        emit(
          `      ${cont}└─ tip: run \`rhx goal.memory.get --slug ${goal.slug}\` to see the goal`,
        );
      }
    }
  }
};

/**
 * .what = cli entrypoint for goal.triage.next skill
 * .why = hook that shows unfinished goals
 *
 * modes:
 * - onBoot: informational refresh after compaction (exit 0)
 * - onStop: halt until goals fulfilled (exit 2)
 *
 * shows inflight goals if any exist (priority)
 * shows enqueued goals if no inflight
 * silent exit if no unfinished goals
 */
export const goalTriageNext = async (): Promise<void> => {
  // parse args
  const { when, scope, hasHelp } = await parseArgsForTriageNext(process.argv);

  // handle --help
  if (hasHelp) {
    emitHelpOutputTriageNext();
    return;
  }

  // when is required at this point (validated in parseArgsForTriageNext)
  if (!when) {
    throw new BadRequestError('--when is required', {});
  }

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

  // if no unfinished goals, clear blocker state and silent exit
  if (inflightGoals.goals.length === 0 && enqueuedGoals.goals.length === 0) {
    await delGoalBlockerState({ scopeDir });
    return;
  }

  // onBoot mode: informational refresh, no halt
  if (when === 'hook.onBoot') {
    console.log(OWL_WISDOM_BOOT);
    console.log('');
    console.log(`🔮 goal.triage.next --when hook.onBoot`);
    emitGoalsSummary({
      inflightGoals: inflightGoals.goals,
      enqueuedGoals: enqueuedGoals.goals,
      toStream: 'stdout',
    });
    return; // exit 0, informational
  }

  // onStop mode: halt with escalation until goals fulfilled

  // get first inflight or enqueued goal slug for blocker state
  const firstGoalSlug =
    inflightGoals.goals[0]?.slug ?? enqueuedGoals.goals[0]?.slug ?? 'unknown';

  // get current blocker state
  const blockerState = await getGoalBlockerState({ scopeDir });

  // increment blocker count for this reminder
  await setGoalBlockerState({ scopeDir, goalSlug: firstGoalSlug });

  // use escalated message if count exceeds threshold
  const newCount = blockerState.count + 1;
  const escalatedMessage = escalateMessageByCount(newCount);
  const isEscalated = newCount >= ESCALATION_THRESHOLD;

  // emit treestruct to stderr (for visibility on constraint error)
  console.error(escalatedMessage);
  console.error('');
  console.error(`🔮 goal.triage.next --when hook.onStop`);

  // emit goals summary
  emitGoalsSummary({
    inflightGoals: inflightGoals.goals,
    enqueuedGoals: enqueuedGoals.goals,
    toStream: 'stderr',
    isEscalated,
  });

  // exit with constraint code (message already printed to stderr)
  process.exit(2);
};
