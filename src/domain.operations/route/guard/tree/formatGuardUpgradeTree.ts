import type { GuardUpgradeResult } from '@src/domain.operations/route/guard/upgrade/GuardUpgradeResult';
import type { GuardUpgradeWarning } from '@src/domain.operations/route/guard/upgrade/GuardUpgradeWarning';
import type { GuardUpgradeDecision } from '@src/domain.operations/route/guard/upgrade/getGuardUpgradeDecision';

import { formatTreeBucket } from './formatTreeBucket';

/**
 * .what = the human-shown decision phrase for a guard's outcome
 * .why = one place maps the decision union to owl-tree copy, so plan/apply agree
 */
const asDecisionText = (input: {
  decision: GuardUpgradeDecision;
  mode: 'plan' | 'apply';
}): string => {
  const { decision, mode } = input;
  switch (decision.decision) {
    case 'skipped':
      return 'skipped, no provenance';
    case 'kept':
      return 'kept, no change';
    case 'upgrade':
      return mode === 'apply' ? 'upgraded, by provenance' : 'upgrade available';
    case 'absent-source':
      return 'absent source';
    case 'invalid-source':
      return 'invalid source';
    case 'unknown-var':
      return `unknown var: ${decision.vars.join(', ')}`;
  }
};

/**
 * .what = the human-shown prose for a structured advisory
 * .why = the domain layer decides WHICH flag as a typed value; this is the ONE place the
 *   copy lives (single-source-of-truth-for-render), so tests assert state, not sentences
 */
const asWarningText = (warn: GuardUpgradeWarning): string => {
  switch (warn.type) {
    case 'already-passed':
      return `stone ${warn.stone} already passed under the prior guard — this upgrade re-syncs its rules but does not re-validate the passage`;
    case 'approved-not-passed':
      return `stone ${warn.stone} is approved but not yet passed — this upgrade changes the rules its pass will be judged against`;
    case 'budget-clobber':
      return `this upgrade reverts a budget grant on ${warn.slug}: ${warn.before} → ${warn.after}`;
  }
};

/**
 * .what = renders one guard's node (label + its child lines) into owl-tree lines
 * .why = maps the guard's children (decision, from, warns, diff) then draws the
 *   ├─/└─ connectors so the last child closes cleanly
 */
const renderGuardNode = (input: {
  result: GuardUpgradeResult;
  mode: 'plan' | 'apply';
}): string[] => {
  const { result, mode } = input;
  const decisionName = result.decision.decision;

  // simple single-line children (decision, optional from, advisories)
  const simpleChildren: string[] = [
    `decision = ${asDecisionText({ decision: result.decision, mode })}`,
    ...(result.from && (decisionName === 'kept' || decisionName === 'upgrade')
      ? [`from = ${result.from}`]
      : []),
    ...result.warnings.map((warn) => `⚠ ${asWarningText(warn)}`),
  ];

  // plan-mode diff body for an available upgrade (changed lines only)
  const diffBody =
    mode === 'plan' && decisionName === 'upgrade' && result.diff.length > 0
      ? result.diff
          .filter((line) => line.kind !== 'context')
          .map((line) =>
            line.kind === 'add' ? `+ ${line.text}` : `- ${line.text}`,
          )
      : [];
  const hasDiff = diffBody.length > 0;

  const childLines: string[] = [];

  // simple children: each is the last child only when no diff bucket follows
  simpleChildren.forEach((child, index) => {
    const isLast = !hasDiff && index === simpleChildren.length - 1;
    childLines.push(`   │  ${isLast ? '└─' : '├─'} ${child}`);
  });

  // the diff renders as a shared formatTreeBucket (the established multi-line
  // convention across this cli, e.g. route.stone.set stdout/stderr) — always the
  // guard's LAST child when present, so the bucket is asked for its isLast form
  // (`└─ diff` with a bar-free continuation column beneath) and hung verbatim off
  // the guard's own `   │  ` continuation — no string-surgery, the bucket owns its
  // own last-child shape (rule.forbid.duplicate-format-tree-operations, blueprint C4)
  if (hasDiff) {
    const bucketLines = formatTreeBucket({
      label: 'diff',
      content: diffBody.join('\n'),
      isLast: true,
    }).split('\n');
    for (const line of bucketLines) childLines.push(`   │  ${line}`);
  }

  // label + children + spacer between guards
  return [`   ├─ ${result.guardName}`, ...childLines, '   │'];
};

/**
 * .what = the decisions that make a full apply fail loud at the B3 gate
 * .why = a plan that holds any of these cannot be cleanly applied whole, so the
 *   footer must warn rather than dangle a "to apply" hint that would error
 */
const APPLY_BLOCKED_DECISIONS: GuardUpgradeDecision['decision'][] = [
  'absent-source',
  'invalid-source',
  'unknown-var',
];

/**
 * .what = the aggregate rollup line (e.g. "2 available, 1 kept, 1 skipped")
 * .why = a many-guard route is scannable without a manual count (i015 nitpick);
 *   the upgrade count is mode-aware — "available" in plan (none written yet),
 *   "upgraded" in apply (written) — so it never contradicts the per-guard decision
 *   text or the apply hint below it (rule.forbid.surprises)
 */
const asRollupText = (input: {
  results: GuardUpgradeResult[];
  mode: 'plan' | 'apply';
}): string => {
  const counts = input.results.reduce<
    Record<GuardUpgradeDecision['decision'], number>
  >(
    (acc, result) => ({
      ...acc,
      [result.decision.decision]: acc[result.decision.decision] + 1,
    }),
    {
      upgrade: 0,
      kept: 0,
      skipped: 0,
      'absent-source': 0,
      'invalid-source': 0,
      'unknown-var': 0,
    },
  );

  const upgradeLabel = input.mode === 'apply' ? 'upgraded' : 'available';
  const parts = [
    counts.upgrade ? `${counts.upgrade} ${upgradeLabel}` : null,
    counts.kept ? `${counts.kept} kept` : null,
    counts.skipped ? `${counts.skipped} skipped` : null,
    counts['absent-source'] ? `${counts['absent-source']} absent` : null,
    counts['invalid-source'] ? `${counts['invalid-source']} invalid` : null,
    counts['unknown-var'] ? `${counts['unknown-var']} unknown-var` : null,
  ].filter((part): part is string => part !== null);

  return parts.length > 0 ? parts.join(', ') : 'no guards';
};

/**
 * .what = renders the full owl treestruct for a route.guard.upgrade run (plan or apply)
 * .why = ONE formatter for both modes — the single source of truth for stdout, so a
 *   snapshot review sees exactly what a driver sees (rule.require.single-source-of-truth)
 */
export const formatGuardUpgradeTree = (input: {
  results: GuardUpgradeResult[];
  route: string;
  mode: 'plan' | 'apply';
}): string => {
  const header =
    input.mode === 'plan'
      ? '🦉 the way reveals itself, one stone at a time'
      : '🦉 so it is';

  const head = [
    '',
    header,
    '',
    `🗿 route.guard.upgrade --mode ${input.mode}`,
    `   ├─ route = ${input.route}`,
    '   │',
  ];

  const body = input.results.flatMap((result) =>
    renderGuardNode({ result, mode: input.mode }),
  );

  // footer: the rollup line, then — in plan mode when an upgrade waits — a second
  // line that is EITHER a clean "to apply" affordance (nothing blocks it) OR a
  // caveat when a blocked guard would make the whole apply fail at the B3 gate.
  // a blanket "to apply" hint on a route that holds a blocked guard is a
  // rule.forbid.surprises trap: the driver runs it and gets a ConstraintError.
  const hasUpgrade = input.results.some(
    (result) => result.decision.decision === 'upgrade',
  );
  const blockedCount = input.results.filter((result) =>
    APPLY_BLOCKED_DECISIONS.includes(result.decision.decision),
  ).length;
  const rollup = asRollupText({ results: input.results, mode: input.mode });

  const blockedNoun = blockedCount === 1 ? 'guard' : 'guards';
  const applyAffordance =
    input.mode === 'plan' && hasUpgrade
      ? blockedCount === 0
        ? 'to apply: rhx route.guard.upgrade --mode apply'
        : `⚠ ${blockedCount} ${blockedNoun} blocked — a full apply is refused; scope a clean stone with --stone`
      : null;

  const footer =
    applyAffordance !== null
      ? [`   ├─ summary = ${rollup}`, `   └─ ${applyAffordance}`]
      : [`   └─ summary = ${rollup}`];

  // final newline so the formatter owns the FULL rendered block (its terminal
  // line-break included); the emitter writes it verbatim via process.stdout.write,
  // so the unit snapshot shows exactly what a driver sees (single-source-of-truth)
  return [...head, ...body, ...footer].join('\n') + '\n';
};
