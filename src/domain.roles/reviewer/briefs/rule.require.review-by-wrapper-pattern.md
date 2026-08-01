# rule.require.review-by-wrapper-pattern

## .what

a role that wants its own `review.by` MUST ship a thin **wrapper skill** that delegates to the
bhrain reviewer's base engine — it must NOT reimplement review orchestration, and callers must NOT
be told to invoke the base engine directly as the everyday form.

there is exactly one correct shape. the wrapper is one `exec` line that loads the base
engine's cli through node directly — the SAME node entry the base skill uses:

```sh
#!/usr/bin/env bash
set -euo pipefail
exec node -e "import('rhachet-roles-bhrain/cli/review.by').then(m => m.reviewBy())" -- "$@"
```

the wrapper writes NO `--role` of its own. when a human runs
`rhx review.by --role <this-role>`, rhachet already dispatched THIS wrapper by that role,
and forwards `--role <this-role>` into the wrapper's `"$@"`. the wrapper hands `"$@"`
straight to the base cli, which reads `--role <this-role>` as the role whose rubrics to
run. one role in, one role out — never a doubled `--role`.

**do NOT delegate via a second `rhx` dispatch** (e.g. `exec rhx review.by --repo bhrain
--role reviewer -- "$@"`). each `rhx` dispatch prints its own `🪨 run solid skill` banner,
so a wrapper that re-dispatches through `rhx` emits a doubled header — one banner for the
wrapper's own dispatch, a second for the base. the node-direct form runs the base cli
within the wrapper's single dispatch, so exactly one banner shows.

with two supporting pieces the role owns:

1. a `briefs/reviews/rubrics.yml` declaring the role's rubrics (slug + rules globs)
2. this wrapper at `skills/review.by.sh`, **marked executable** (`chmod +x`)

## .why

`review.by` dispatches **by role**. `rhx review.by --role <role>` asks rhachet for a `review.by`
skill **owned by that role**. so:

- if the role ships no `review.by` skill, `rhx review.by --role <role>` fails with
  `no skill "review.by" found with --role <role>` — the ergonomic command a human expects simply
  does not exist.
- the base engine (`repo=bhrain role=reviewer`) owns all the hard parts — rubric enumeration,
  the review subprocess, the owl treestruct, the exit codes. a role that reimplements any of that
  duplicates logic that will drift from the base and rot.

the wrapper is the whole extension surface: bake in the role, delegate to the base, forward the
rest. the role owns one `exec` line plus its `rubrics.yml`. no more.

## .the two anti-patterns this forbids

### 1. reimplemented orchestration (the fat wrapper)

a `review.by` that greps its own `rubrics.yml`, runs rubric skills in parallel itself, and prints
its own tree — instead of delegation — is forbidden. it re-derives the base engine's whole job and
drifts from it. delegate; do not re-orchestrate.

### 2. "just call the base directly" (the leaked-plumbing instruction)

telling a human to run
`rhx review.by --repo bhrain --role reviewer -- --paths '…'`
as the everyday form is forbidden. that is the base engine's internal contract showing through —
plumbing, not the ergonomic surface. the human should run `rhx review.by --role <role> --paths '…'`
and the role's wrapper supplies the `--repo bhrain --role reviewer --` dispatch itself.

(the base-direct form is legitimate only as an implementation detail *inside* the wrapper, or in an
acceptance test that deliberately exercises the base.)

## .how a role author adds review.by

1. write `briefs/reviews/rubrics.yml` — one entry per rubric: `slug` + `rules` globs
2. write `skills/review.by.sh` — the one-line node `exec` above (it is role-agnostic: the target
   role rides in via `"$@"`, so the same line serves every role verbatim)
3. `chmod +x skills/review.by.sh` — a non-executable skill fails the repo build
4. rebuild so the skill registers in `rhachet.repo.yml`
5. verify: `rhx review.by --role <role> --paths '…'` runs the role's rubrics via the base,
   under exactly one `🪨 run solid skill` banner

## .the test

ask two questions of any new `review.by`:

- "does it DELEGATE to the base via one node `exec` into `rhachet-roles-bhrain/cli/review.by`,
  or does it re-orchestrate?" → must delegate
- "is the everyday command i hand a human `rhx review.by --role <role>`, or the base-direct form?"
  → must be the role form

if either answer is wrong, the pattern is incorrect.

## .how route peer reviews invoke it

a route guard runs a role's review as a peer review by one command per rubric:

```
rhx review.by --role <role> --for <rubric>
```

one rubric per invocation. this holds **even when** the role owns an internal `rhx enroll`
command, a bespoke driver, or arbitrary bash: the surface a guard talks to is always
`rhx review.by --role <role> --for <rubric>`, never the role's private internals. the internals
may do as they please; the peer-review contract stays this one shape, so the guard tallies
straight off the parseable stdout summary.

## .see also

- `howto.add-review-by-to-a-role.[guide].md` — the step-by-step guide this rule enforces
- `howto.review-by.[guide].md` — the base-engine + per-role-wrapper architecture in full
- `contract.reviewer-output.md` — the stdout contract the base emits

## .enforcement

- a role's `review.by` that reimplements review orchestration instead of delegation to the base =
  **blocker**
- a `review.by` wrapper that is not marked executable = **blocker** (fails the repo build)
- documentation or guidance that prescribes the base-direct form
  (`--repo bhrain --role reviewer --`) as the everyday human command = **blocker**
- a wrapper that delegates via a second `rhx` dispatch (instead of the node-direct `exec`),
  which emits a doubled `🪨 run solid skill` banner = **nitpick** (works, but confuses)
