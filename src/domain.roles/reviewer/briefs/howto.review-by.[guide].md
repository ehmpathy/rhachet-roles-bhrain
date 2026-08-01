# howto: review.by

## .what

`review.by` runs a role's **standard review set** — the rubrics declared in that role's
`rubrics.yml` — with one command instead of many. bhrain owns the orchestration; each role owns
only its `rubrics.yml`.

it is the layer above `review`: where `review` grades one rubric (a rules glob against a paths
glob), `review.by` reads a role's `rubrics.yml`, runs every rubric in it (or one, via `--for`),
and prints a single owl treestruct with the combined verdict.

a role reviews whatever that role is about — a subject is not always code. the mechanic reviews
code; the learner reviews domain-term usage in prose; an ergonomist reviews an experience; a
reviewer may review another role's output. `review.by` is subject-agnostic: it runs a role's
rubrics against whatever `--paths` (or `--diffs`) name, and each rubric's rules decide what to look
for. so "the target" below means "the files this role reviews" — code or prose or any subject a
glob can name.

## .why

- a role has many rubrics; a human should not have to name each one to run its full review set
- the review set is a property of the role, so it lives with the role (its `rubrics.yml`), not in
  the caller's memory
- one command, one treestruct, one exit code — the pit of success for "review this subject the way
  this role reviews it", whatever the role's subject is (code, prose, a peer's output, …)

## .how to run it

the everyday form is `rhx review.by --role <role>` — the role's own wrapper resolves it and
delegates to the base (see `rule.require.review-by-wrapper-pattern`):

```
rhx review.by --role <role> [options]
```

example — the subject follows the role, not a fixed file type:

```
rhx review.by --role mechanic --paths 'src/**/*.ts'          # a role that reviews code
rhx review.by --role learner  --paths 'src/**/*.md'          # a role that reviews prose
rhx review.by --role learner  --for term-application         # one rubric of a prose-reviewing role
```

under the hood, that wrapper calls the base engine (`repo=bhrain role=reviewer`), whose internal
contract is:

```
rhx review.by --repo bhrain --role reviewer -- --role <target-role> [options]
```

the target `--role <target-role>` appears explicitly here ONLY because this is the raw base-direct
form with no wrapper present to forward it. a real wrapper does NOT write it — it passes a bare
`"$@"` and lets the human's own `--role` ride in (see the wrapper shape below). so you never author
a doubled `--role reviewer -- --role <target-role>` yourself; you only see it in this raw plumbing.

this base-direct form is PLUMBING — use it only in an acceptance test that deliberately exercises
the base. never hand it to a human as the everyday command
(`rule.require.review-by-wrapper-pattern`).

options (parsed by the skill):

| flag       | .what                                                        |
| ---------- | ------------------------------------------------------------ |
| `--role`   | target role whose `rubrics.yml` to run (required)            |
| `--for`    | run a single rubric by slug (default: all)                   |
| `--paths`  | target file globs (forwarded to `review`)                    |
| `--diffs`  | diff scope: since-main, since-staged (forwarded)             |
| `--mode`   | review focus: push or pull (forwarded)                       |
| `--brain`  | brain override for evals (forwarded)                         |
| `--output` | output dir (default: `.reviews/by=$role/`)                   |
| `--help`   | show usage                                                   |

## .the base-engine + per-role-wrapper architecture

`review.by` dispatches **by role**. there are two layers:

- **the base engine** — `repo=bhrain role=reviewer`'s `review.by`. it reads a `rubrics.yml`,
  runs the rubrics, and prints the verdict. it is role-agnostic: you tell it which role via
  `--role`.
- **a per-role wrapper** — each role MAY ship its own thin `review.by` that delegates to the base.
  so `rhx review.by --role mechanic` resolves the mechanic's wrapper, which hands off to the base.

the wrapper is a one-liner that loads the base cli through node — the SAME line for every role
(role-agnostic), and the SAME node entry the base skill itself uses:

```sh
#!/usr/bin/env bash
set -euo pipefail
exec node -e "import('rhachet-roles-bhrain/cli/review.by').then(m => m.reviewBy())" -- "$@"
```

that is the whole extension: delegate to the base, forward the rest. the wrapper writes NO
`--role` of its own — rhachet already dispatched it by `--role mechanic` and forwards that flag
into `"$@"`, which the base cli reads as the role whose rubrics to run. one role in, one role out.
the base owns every hard part; the role owns one line plus its `rubrics.yml`.

**delegate through the node `exec` line, not a second `rhx review.by …` dispatch.** the node form
is the sanctioned wrapper shape; use it verbatim.

## .how the dispatch flags flow

`rhx` ALWAYS forwards `--repo`, `--role`, and `--skill` **into the skill's argv** — it does not
consume them. so on every invocation the base's parser sees those dispatch flags among its args:

- via a role wrapper, when `rhx review.by --role mechanic` dispatches the wrapper, which forwards
  `--role mechanic --skill review.by` into `"$@"` and hands it to the base cli
- directly, when an acceptance test runs `rhx review.by --repo bhrain --role reviewer -- ...`

so the base parser must **tolerate** the forwarded `--skill` / `--repo`: it reads them as dispatch
noise and ignores them, rather than reject them as unknown flags. a genuine typo (e.g. `--rool`)
still errors loud — the tolerance is surgical, limited to the exact dispatch flags rhachet injects.

`--role` is the one dispatch flag that is ALSO a real skill arg (the target role). the base parses
`--role` **last-wins**, so the base-direct test form (`--role reviewer -- --role mechanic`) still
resolves to the later `mechanic`. through a role wrapper there is only ONE `--role` in `"$@"` —
the human's — so the base reads it straight; the wrapper injects no second `--role` to override.

## .how a role author ships their own wrapper

1. declare the role's review set in its `rubrics.yml` (one entry per rubric: slug + rules glob;
   plus an optional `vibe:` block to brand the output with the role's own mascot/artifact — see
   `howto.add-review-by-to-a-role.[guide].md`)
2. add a `review.by` skill to the role — the one-line node delegation above, verbatim (it is
   role-agnostic; the target role rides in via `"$@"`, so no role is baked in)
3. that is it. `rhx review.by --role <role>` now runs the role's full review set through the base

the acceptance suite proves this end to end:
- `blackbox/review.by.dispatch.acceptance.test.ts` — the base run through real `rhx` dispatch,
  with the forwarded flags tolerated and `--role` last-wins honored by the parser
- `blackbox/review.by.wrapper.acceptance.test.ts` — a demo role's own wrapper delegates to the
  base and runs the demo role's rubric, the full wrapper → base → rubric chain

## .see also

- `contract.reviewer-output.md` — the stdout contract the base emits (the guard reads it)
- `review.tactics.md` — push vs pull, scope, brain selection for the base `review`
- `on.rules/rules101.[article].md` — what a rubric's rules are and how they are declared
