/**
 * .what = noop for append-only passage.jsonl
 * .why = block state is superseded by subsequent passed/approved entries
 * .note = retained for compatibility, no-op in new model
 */
export const delStoneGuardBlockerReport = async (_input: {
  stone: string;
  route: string;
}): Promise<void> => {
  // noop: passage.jsonl is append-only
  // a "passed" entry supersedes any prior "blocked" entry
};
