/**
 * .what = detect node -e eval mode from argv shape
 * .why = a skill invoked via `node -e "code" -- <args>` has no entrypoint path in argv
 *        (node strips -e + the code), so argv[1] is the first real arg, not a file. the
 *        robust signal is whether argv[1] looks like a file path — a bare token (e.g. a
 *        stray positional) reads as eval mode, so getInvocationArgs KEEPS it rather than
 *        silently drop it via the wrong slice offset
 *
 * argv shapes:
 *   normal: ['node', '/path/to/entry.js', '--flag', 'val']
 *   eval:   ['node', '--flag', 'val']   (node strips -e + the code)
 */
export const isNodeEvalMode = (argv: string[]): boolean => {
  const secondArg = argv[1];
  if (!secondArg) return false;
  // an entrypoint path (a .js/.ts/.mjs/.cjs file) = normal mode
  if (/\.(js|ts|mjs|cjs)$/.test(secondArg)) return false;
  // otherwise eval mode (node stripped -e + the code from argv)
  return true;
};
