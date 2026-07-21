# rule.require.runtime-guard-vars-in-shared-const

## .what

every runtime `$VAR` a guard command may carry MUST be listed in the single shared const
`src/domain.operations/route/guard/RUNTIME_GUARD_VAR_NAMES.ts`. never substitute a runtime
var in a runner without a matching entry in that const.

## .why

three consumers read guard `$VAR` tokens, and they MUST agree on the same set:

| consumer | file | role |
|----------|------|------|
| judge runner | `runStoneGuardJudges.ts` (`substituteVars`) | fills judge-run vars |
| review runner | `runStoneGuardReviews.ts` (`substituteVars`) | fills review-run vars (incl. `$conversation`) |
| upgrade scanner | `getUnknownGuardVars.ts` (`route.guard.upgrade`) | treats any `$VAR` OUTSIDE the const as `unknown-var` |

when a new runtime var is substituted by a runner but NOT in the const, the upgrade
scanner cannot tell it apart from a genuine stray (`$FOO`) — so `route.guard.upgrade`
false-flags every real guard that uses it as `unknown-var` and REFUSES to apply. this
already bit once: `$conversation` was substituted in the review runner but absent from the
const, so an upgrade of a real bhuild guard failed with `unknown var: $conversation`.

## .how the code enforces it (belt AND suspenders)

you do not have to remember this rule — the code makes drift a COMPILE error:

- both runners build their name→value map as `Record<RuntimeGuardVarName, string>`, keyed
  off the const. add a name to the const without a value (or a value without a name) and
  the map fails `tsc`. a var NOT in the const has no key, so it cannot be substituted.
- `getUnknownGuardVars` imports the same const as its allowlist.
- `RUNTIME_GUARD_VAR_NAMES.test.ts` locks the exact list, so a silent add/remove flips red.

so the const is the ONE source of truth: to introduce a runtime var, put it in the const
FIRST, then the compiler walks you to every map that must supply a value.

## .when to apply

- a new `$VAR` is introduced into a guard template that a runner substitutes at run time
- a new substitution appears in `substituteVars` in either runner
- a diff touches guard var substitution

## .the checklist for a new runtime var

1. add the name to `RUNTIME_GUARD_VAR_NAMES`
2. `tsc` now fails at each runner's `valueByName` map — supply a value in each (a runner
   with no context for the var passes it through literally, e.g. the judge leaves
   `$conversation` as `'$conversation'`)
3. update `RUNTIME_GUARD_VAR_NAMES.test.ts` to lock the new list
4. add a `getUnknownGuardVars` case that proves the var is NOT flagged as unknown

## .enforcement

a runtime var substituted by a runner but absent from `RUNTIME_GUARD_VAR_NAMES` = **BLOCKER**
(it breaks `route.guard.upgrade` for every guard that carries the var).
