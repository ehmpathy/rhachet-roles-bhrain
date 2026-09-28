/**
 * .what = reads the errno string code (ENOENT, ESRCH, EPERM, …) off a caught node error
 * .why = node fs/process rejections are an external boundary: an untyped `unknown` that carries
 *        a `.code` errno at runtime. this reads it via one documented boundary cast so a caller
 *        can ALLOWLIST the expected code (ENOENT absent-file, ESRCH dead-pid) and rethrow the
 *        rest — never a blanket catch that hides a real I/O or permission fault
 *        (rule.forbid.failhide).
 *
 * .note = lifted to the route/ level (the common ancestor of the reminder/ and passage/ clusters)
 *         because both consume it — the reminder pid-boundary reads and the passage-file read both
 *         allowlist ENOENT and rethrow the rest (rule.prefer.most-common-denominator). it carries
 *         zero domain knowledge, so it sits at the shared route root, not inside one sub-cluster.
 */
export const asNodeErrnoCode = (error: unknown): string | undefined => {
  // external boundary: a node ErrnoException carries a string `.code` at runtime
  const err = error as { code?: unknown };
  return typeof err.code === 'string' ? err.code : undefined;
};
