import { JUDGE_LEVEL } from './JUDGE_LEVEL';

/**
 * .what = renders a guard-ladder rung's level number as a human label
 * .why = the judge is the top rung at the sentinel level JUDGE_LEVEL (= Number.MAX_SAFE_INTEGER);
 *        a human must never see that raw number. every place that prints a rung to a human — the
 *        overrule confirmation's rung + ready lines, the force confirmation's overruled line —
 *        must render `JUDGE_LEVEL` as `judge` and a real peer level as `level N`. one transformer
 *        holds that map so the sentinel guard cannot drift between the render sites
 *        (rule.require.single-source-of-truth-for-render, rule.forbid.duplicate-format-tree-operations).
 *
 * @example asRungLabel(3) -> 'level 3'
 * @example asRungLabel(JUDGE_LEVEL) -> 'judge'
 */
export const asRungLabel = (level: number): string =>
  level === JUDGE_LEVEL ? 'judge' : `level ${level}`;
