import { asScopeFlagHuman } from './asScopeFlagHuman';

/**
 * .what = generates the header stdout (brain info and scope filters)
 * .why = displays review configuration and scope at the top before metrics
 */
export const genReviewHeaderStdout = (input: {
  brain: string;
  focus: 'push' | 'pull';
  scope: {
    diffs: string | null;
    pathsWith: string[] | null;
    pathsWout: string[] | null;
    join: 'union' | 'intersect';
  };
}): string => {
  // build scope tree with only specified filters. labels take the flag-name form
  // (hyphen); the refusal blocks show the resolved pair (dot) — see asReviewScopePathLines.
  // the includes arrive folded (`--paths` and `--paths-with` merge upstream), so the
  // label names the RESOLVED include list, never the flag typed: `paths:` alone, and
  // `paths-with:` only beside a `paths-wout:` it must be told apart from.
  // the VALUES render through asScopeFlagHuman, the one home for a scope flag read by a
  // human, so a change to that render (a separator, a quote rule) lands on the header and
  // the refusal blocks alike. only the line set differs: the header omits an absent flag,
  // the refusal block names it (none) (rule.forbid.duplicate-format-tree-operations)
  const pathsWith = input.scope.pathsWith ?? [];
  const pathsWout = input.scope.pathsWout ?? [];
  const hasPathsWith = pathsWith.length > 0;
  const hasPathsWout = pathsWout.length > 0;
  // "paths:" alone where no wout was named; "paths-with:" only beside a "paths-wout:"
  const labelOfPathsWith = hasPathsWout ? 'paths-with' : 'paths';
  const scopeLines: string[] = [
    ...(input.scope.diffs
      ? [`diffs: ${asScopeFlagHuman({ of: input.scope.diffs })}`]
      : []),
    ...(hasPathsWith
      ? [`${labelOfPathsWith}: ${asScopeFlagHuman({ of: pathsWith })}`]
      : []),
    ...(hasPathsWout
      ? [`paths-wout: ${asScopeFlagHuman({ of: pathsWout })}`]
      : []),
    ...(input.scope.diffs && hasPathsWith ? [`join: ${input.scope.join}`] : []),
  ];

  // no filter was named, so the scope branch has no children. say so on one line, since
  // a `└─ scope` header over an empty subtree promises a child that never renders
  if (scopeLines.length === 0)
    return `🦉 let's review
   ├─ brain: ${input.brain}
   ├─ focus: ${input.focus}
   └─ scope: (none)`;

  // format scope lines with proper tree characters (no vertical bar since scope is last)
  const scopeTree = scopeLines
    .map((line, i) => {
      const prefix = i === scopeLines.length - 1 ? '└─' : '├─';
      return `      ${prefix} ${line}`;
    })
    .join('\n');

  return `🦉 let's review
   ├─ brain: ${input.brain}
   ├─ focus: ${input.focus}
   └─ scope
${scopeTree}`;
};
