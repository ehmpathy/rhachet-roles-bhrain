/**
 * .what = masks the per-run paths in a review refusal so its snapshot stays stable
 * .why = the refusal bytes are what a driver meets (rule.forbid.friction-hazards), so
 *        the whole stderr is pinned; only the tempDir and the log dir vary per run
 */
export const asRedactedOutput = (raw: string): string =>
  raw
    .replace(/\.log\/bhrain\/review\/[^\s]+/g, '.log/bhrain/review/<TIMESTAMP>')
    .replace(/\/[^\s]*genTempDir\.symlink\/[^\s]+/g, '<TEMP_PATH>');
