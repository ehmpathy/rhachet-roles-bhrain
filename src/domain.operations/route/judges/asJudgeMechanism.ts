/**
 * .what = the `--mechanism` (or legacy `--type`) value of one guard judge command
 * .why = a judge's mechanism decides which gate it is; a text-contains test for
 *        `--mechanism approved?` also matches `--mechanism approved?-later`. one parse of the flag
 *        as a token, so every gate that asks "which judge is this?" reads one answer
 *
 * .note = returns null where the command names no mechanism
 */
const PATTERN_OF_JUDGE_MECHANISM = /(?:^|\s)--(?:mechanism|type)\s+(\S+)/;

export const asJudgeMechanism = (input: { judge: string }): string | null =>
  input.judge.match(PATTERN_OF_JUDGE_MECHANISM)?.[1] ?? null;
