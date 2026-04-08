/**
 * .what = cli entrypoints for achiever goal skills
 * .why = enables shell invocation via package-level import
 */
import { execSync } from 'child_process';
import { BadRequestError } from 'helpful-errors';

import {
  computeGoalCompleteness,
  Goal,
  GoalHow,
  GoalStatus,
  type GoalStatusChoice,
  GoalWhat,
  GoalWhy,
} from '@src/domain.objects/Achiever/Goal';
import { getGoals } from '@src/domain.operations/goal/getGoals';
import { getTriageState } from '@src/domain.operations/goal/getTriageState';
import { setGoal, setGoalStatus } from '@src/domain.operations/goal/setGoal';
import { getRouteBindByBranch } from '@src/domain.operations/route/bind/getRouteBindByBranch';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const yaml = require('js-yaml');

/**
 * .what = owl wisdom header
 * .why = sets the vibe for goal operations
 */
const OWL_WISDOM = '🦉 to forget an ask is to break a promise. remember.';

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
  const absent = goal.meta?.absent ?? [];
  const isAbsent = (field: string) => absent.includes(field);

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
  const absent = goal.meta?.absent ?? [];
  const isAbsent = (field: string) => absent.includes(field);

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
    if (arg === '--status' && nextArg) {
      status = nextArg as GoalStatusChoice;
      i++;
      continue;
    }
    // check for field flags
    if (FIELD_FLAGS.includes(arg as FieldFlag) && nextArg) {
      const fieldName = arg.slice(2); // remove '--' prefix
      flagValues.set(fieldName, nextArg);
      hasFieldFlags = true;
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
}> => {
  // in -e mode: argv = [node, --arg, value] → slice(1) to get args
  // in normal mode: argv = [node, file.js, --arg, value] → slice(2) to skip file
  const args = isNodeEvalMode() ? argv.slice(1) : argv.slice(2);

  let scope: 'route' | 'repo' = await getDefaultScope();
  let status: GoalStatusChoice | undefined;
  let slug: string | undefined;

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
    if (arg === '--status' && args[i + 1]) {
      status = args[i + 1] as GoalStatusChoice;
      i++;
    }
    if (arg === '--slug' && args[i + 1]) {
      slug = args[i + 1];
      i++;
    }
  }

  return { scope, status, slug };
};

/**
 * .what = parse args for goal.infer.triage
 * .why = extract --scope from argv
 */
const parseArgsForTriage = async (
  argv: string[],
): Promise<{
  scope: 'route' | 'repo';
  mode: 'triage' | 'hook.onStop';
}> => {
  // in -e mode: argv = [node, --arg, value] → slice(1) to get args
  // in normal mode: argv = [node, file.js, --arg, value] → slice(2) to skip file
  const args = isNodeEvalMode() ? argv.slice(1) : argv.slice(2);

  let scope: 'route' | 'repo' = await getDefaultScope();
  let mode: 'triage' | 'hook.onStop' = 'triage';

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
    if (arg === '--mode' && args[i + 1]) {
      mode = args[i + 1] as 'triage' | 'hook.onStop';
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
    meta,
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
  const { scope, covers, slug, status, fields, hasFieldFlags } =
    await parseArgsForSet(process.argv, stdinContent);
  const scopeDir = await getScopeDir(scope);

  // mode 1: status update (--slug and --status, no field flags)
  if (slug && status && !hasFieldFlags) {
    const reason = stdinContent.trim() || 'status updated';

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
    meta,
    createdAt: (parsed.createdAt as string) || now,
    updatedAt: (parsed.updatedAt as string) || now,
  });

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
  const { scope, status, slug } = await parseArgsForGet(process.argv);
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
 * .what = cli entrypoint for goal.infer.triage skill
 * .why = enables shell invocation via package-level import
 */
export const goalInferTriage = async (): Promise<void> => {
  // parse and validate args
  const { scope, mode } = await parseArgsForTriage(process.argv);

  const scopeDir = await getScopeDir(scope);

  const state = await getTriageState({ scopeDir });

  // hook.onStop mode: halt if uncovered asks OR incomplete goals, silent if all clear
  if (mode === 'hook.onStop') {
    const hasUncovered = state.asksUncovered.length > 0;
    const hasIncomplete = state.goalsIncomplete.length > 0;

    if (hasUncovered || hasIncomplete) {
      console.error('🦉 to forget an ask is to break a promise. remember.');
      console.error('');
      console.error('🔮 goal.infer.triage --mode hook.onStop');

      if (hasUncovered) {
        console.error(`   ├─ uncovered asks = ${state.asksUncovered.length}`);
      }
      if (hasIncomplete) {
        console.error(
          `   ├─ incomplete goals = ${state.goalsIncomplete.length}`,
        );
        for (let i = 0; i < state.goalsIncomplete.length; i++) {
          const goal = state.goalsIncomplete[i]!;
          const isLast = i === state.goalsIncomplete.length - 1;
          const branch = isLast ? '└─' : '├─';
          const cont = isLast ? '   ' : '│  ';
          console.error(`   │  ${branch} ${goal.slug}`);
          if (goal.meta) {
            console.error(
              `   │  ${cont}└─ absent: ${goal.meta.absent.join(', ')}`,
            );
          }
        }
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
      console.error('         └─ rhx goal.infer.triage');
      process.exit(2); // constraint error: user must fix
    }
    // all asks covered and all goals complete, silent exit
    return;
  }

  // triage mode: show full state with treestruct vibes
  emitOwlHeader();
  console.log(`🔮 goal.infer.triage --scope ${scope}`);

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
      if (goal.meta) {
        console.log(`   │  ${cont}└─ absent: ${goal.meta.absent.join(', ')}`);
      }
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
      console.log(`      ├─ complete incomplete goals`);
    }
    console.log(`      └─ then re-run goal.infer.triage`);
  }
};
