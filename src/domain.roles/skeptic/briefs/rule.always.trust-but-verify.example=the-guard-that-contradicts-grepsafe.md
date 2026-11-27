# rule.always.trust-but-verify.example=the-guard-that-contradicts-grepsafe

> row: two guards clash, or a guard clashes with the tool it guards. 2026-11-18, nheuron. the human's order on guards in conflict, applied to the one clash this role found on the day. sources: inbox 2026-11-18 (recorded as a bulletin on guards in conflict, for @all, 7d), and the reads of the build of this role.

## .the shape, in any life

one door has a sign that says "pull" and another that says "push". when two signs disagree, what does one try of the door itself say?

the case below: a guard said a tool exits 2 on a path, the tool's own help said it reads the path, and a run settled which text was wrong.

## .the clash

| the guard | what it claims |
|---|---|
| `goal.tree set` and `reopen` (the done-check guard in `goal.tree.mjs`) | `rhx grepsafe` exits 2 on a path under `.agent/repo=.this`, so a done-check that names such a path can never pass |
| `rhx grepsafe` itself | "to name a path opts into every skip that would hide it … follows a named symlink" (its own `--help`) |

## .the runs

| the run | the result |
|---|---|
| `grepsafe --pattern 'role=pioneer' --path .agent/repo=.this/role=pioneer/briefs` | exit 0 (zero matches: a read of the path, through the link) |
| `grepsafe --pattern 'isGoalTreeCall' --path .agent/repo=.this/role=director/skills/goal.tree.mjs` | exit 0, two matched lines |
| `grepsafe --pattern 'x' --path /tmp` | exit 2: a path outside the repo root is refused |

the guard's claim fails the run. the tool holds. the guard text is erroneous; the clamp suites that pin the refusal text pin the error.

## .the cost

a `--done` check that reads a role path with `grepsafe` is refused, so a seat routes to `director.skills.grep`, a verb that duplicates one that reads the path fine.

## .the cure owed

the owner of `goal.tree.mjs` and its two clamp suites restates the guard on the exit code of the call, or retires it.

## .the law it proves

`rule.always.trust-but-verify` (the row for two guards that clash): the run decides which of the two claims holds, never the seat that wrote one of them.

up: `rule.always.trust-but-verify`
