# howto: add review.by to a role

## .what

the standard, step-by-step way to give a role its own `review.by` — so that
`rhx review.by --role <role>` runs that role's standard review set.

this is THE sanctioned way to create a new `review.by` review operation for a role. do not
invent another shape; the enforcement lives in `rule.require.review-by-wrapper-pattern`.

## .why

- `review.by` dispatches **by role**: `rhx review.by --role <role>` asks rhachet for a
  `review.by` skill owned by that role. a role with no such skill has no ergonomic command.
- the base engine (`repo=bhrain role=reviewer`) owns every hard part — rubric enumeration, the
  review subprocess, the owl treestruct, the exit codes. a role that reimplements any of that
  duplicates logic that drifts and rots.
- so a role extends `review.by` with exactly two owned pieces: its **rubrics** (the what) and a
  **one-line wrapper** (the delegation). the base owns the how.

## .the two pieces a role owns

### 1. the rubrics — `briefs/reviews/rubrics.yml`

declare the role's review set: one entry per rubric, each a slug + a rules glob.

```yaml
rubrics:
  - slug: term-application
    purpose: terms are applied well in usage — no ambiguity, disadherence, or inconsistency
    rules:
      - .agent/repo=bhrain/role=learner/briefs/rule.forbid.domain-term-ambiguity.md
      - .agent/repo=bhrain/role=learner/briefs/rule.forbid.domain-term-synonyms.md
      - .agent/repo=bhrain/role=learner/briefs/rule.forbid.domain-term-inconsistency.md

  - slug: term-aggregation
    purpose: declared terms are aggregated into the glossary — no inventory omission
    rules:
      - .agent/repo=bhrain/role=learner/briefs/rule.require.domain-term-itemization.md
```

#### optional: brand the review with the role's own vibe

by default the review renders under bhrain's owl (`🦉` mascot, `🔍` artifact). a role MAY override
that with an optional top-level `vibe:` block, so its review reads in the role's own voice — the
ehmpathy seaturtle marks its output with `🐢` / `🐚`, for instance:

```yaml
vibe:
  mascot: 🐢
  artifact: 🐚

rubrics:
  - slug: mech-failhides
    rules:
      - .agent/repo=ehmpathy/role=mechanic/briefs/practices/**/rule.forbid.failhide*.md
```

- `vibe` is optional — omit it and the review renders under the owl default (`🦉` / `🔍`)
- `mascot` opens the owl-phrase header line (`🐢 not even a vole`)
- `artifact` prefixes the command echo (`🐚 review.by --role mechanic`)
- each field defaults independently: declare only `mascot` and `artifact` stays `🔍`

### 2. the wrapper — `skills/review.by.sh`

one `exec` line that loads the base cli through node — the SAME line for every role
(role-agnostic), and the SAME node entry the base skill itself uses:

```sh
#!/usr/bin/env bash
set -euo pipefail
exec node -e "import('rhachet-roles-bhrain/cli/review.by').then(m => m.reviewBy())" -- "$@"
```

the wrapper writes NO `--role` of its own. rhachet already dispatched this wrapper by
`--role <role>` and forwards that flag into `"$@"`; the wrapper hands `"$@"` straight to the
base cli, which reads `--role <role>` as the role whose rubrics to run. one role in, one role
out — never a doubled `--role`.

delegate through the node `exec` line above, **not** a second `rhx review.by …` dispatch — the
node form is the sanctioned shape.

## .the steps

1. write `briefs/reviews/rubrics.yml` — one entry per rubric (slug + rules globs)
2. write `skills/review.by.sh` — the one node `exec` line above, verbatim
3. `chmod +x skills/review.by.sh` — a non-executable skill fails the repo build
4. rebuild so the skill registers in `rhachet.repo.yml`
5. verify: `rhx review.by --role <role> --paths '…'` runs the role's rubrics via the base

## .how a route peer review invokes it

a route guard runs a role's review as a peer review by one command per rubric:

```
rhx review.by --role <role> --for <rubric>
```

one rubric per invocation — the guard folds each rubric's verdict into its own tree. this holds
**even when** a role owns an internal `rhx enroll` command, a bespoke driver, or arbitrary bash:
the peer-review surface a guard talks to is always `rhx review.by --role <role> --for <rubric>`,
never the role's private internals. the internals may do whatever they like; the review contract
stays this one shape, so a guard tallies straight off its parseable stdout summary
(`contract.reviewer-output.md`).

## .the anti-patterns to avoid

- **a fat wrapper** that greps its own rubrics.yml and re-orchestrates — forbidden; delegate to
  the base
- **the base-direct form as the everyday command** —
  `rhx review.by --repo bhrain --role reviewer -- …` is PLUMBING, use it only in acceptance tests
- **a second `rhx` dispatch inside the wrapper** — delegate through the node `exec` line instead

## .see also

- `rule.require.review-by-wrapper-pattern` — the enforced rule behind this guide
- `howto.review-by.[guide].md` — the base-engine + per-role-wrapper architecture in full
- `contract.reviewer-output.md` — the stdout contract a guard parses per rubric
