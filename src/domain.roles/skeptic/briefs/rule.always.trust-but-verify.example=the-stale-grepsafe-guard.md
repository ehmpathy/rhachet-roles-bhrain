# rule.always.trust-but-verify.example=the-stale-grepsafe-guard

> row: a brief or guard says how a tool acts. 2026-11-18, nheuron. a guard text states that `rhx grepsafe` exits 2 on a path under `.agent/repo=.this`. one run says otherwise.

## .the shape, in any life

a "wet paint" sign stays on the wall for months after the paint dried, and all the staff walk the long way round. when did anyone last touch the wall?

the case below: a guard text said a tool exits 2 on a path, and one run showed it exits 0.

## .the claim

`goal.tree set` and `reopen` refuse a `--done` check that runs `grepsafe` or `globsafe` over a path under `.agent/repo=.this`. the refusal text (in `goal.tree.mjs`, lines 2455, 2485, 2694) and the header of two clamp suites (`goal.tree.done-blind-grepsafe.integration.test.ts`, `goal.tree.check-role-link.integration.test.ts`) say:

> grepsafe exits 2 ("search path must be within the git repository") on it, so such a check can never pass

the paved cure the text names: `rhx director.skills.grep`.

## .the verify

reads of that turn, from the director worktree:

| the read | the result |
|---|---|
| `rhx grepsafe --pattern 'role=pioneer' --path .agent/repo=.this/role=pioneer/briefs` | exit 0, `matches: 0`: the path was read, through the link, into the main checkout |
| `rhx grepsafe --pattern 'isGoalTreeCall' --path .agent/repo=.this/role=director/skills/goal.tree.mjs --output pipeable` | exit 0, `2392:const isGoalTreeCall` and one more line |
| `rhx grepsafe --pattern 'x' --path /tmp` | exit 2: `search path must be within the git repository`, repo root and path named |
| `rhx grepsafe --help`, notes | "to name a path opts into every skip that would hide it … follows a named symlink" |

the verdict: a named role-link path is read and exits 0. a path outside the repo root, lexically, exits 2. the guard text describes an older grepsafe.

## .what the stale text cost

- a `--done` check that reads the role dir with `grepsafe` is refused, so a director routes to a second verb that duplicates the first
- the refusal says "can never pass", a claim a single run refutes
- the clamp suites pin the old claim: a suite that asserts the refusal text stays green while the tool it describes has moved

## .the lesson, by law

| the law | the miss | the cure |
|---|---|---|
| `trust-but-verify` | the guard text was trusted as a fact about grepsafe | run the call, read the exit code |
| `trust-no-one-especially-not-yourself` | the text was a seat's own belief, written into a tool | a belief a seat writes into a guard is the first one to re-read |

the cure for the text is owed to the owner of `goal.tree.mjs` and the two suites: restate the guard on the exit code of the call, or retire it.

up: `rule.always.trust-but-verify`
