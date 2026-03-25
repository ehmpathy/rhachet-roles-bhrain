# self-review: has-critical-paths-frictionless

## the question

are the critical paths frictionless in practice?

## the critical path

this is a bug fix with one critical path:

**behaver uses $route in guard artifact pattern → bhrain finds the artifact**

### before the fix

friction:
- behaver writes `artifacts: ["$route/artifact.md"]`
- bhrain looks for literal `$route/artifact.md` directory
- artifact not found error
- behaver confused — "but the file is there!"

### after the fix

frictionless:
- behaver writes `artifacts: ["$route/artifact.md"]`
- bhrain expands `$route` to actual route path (e.g., `.behavior/xyz/`)
- artifact found at `.behavior/xyz/artifact.md`
- guard proceeds — "just works"

## verification

the acceptance test demonstrates the path end-to-end:
1. create route with guard that uses `$route` in artifact pattern
2. create artifact at expanded path
3. run `route.stone.set --as passed`
4. verify guard finds artifact and proceeds

test passes. path is frictionless.

## why it holds

- no unexpected errors
- no extra steps for the user
- `$route` works identically in artifacts, reviews, and judges
- consistent mental model — "one variable, one semantics"

## conclusion

the critical path is frictionless. $route expansion works as expected.
