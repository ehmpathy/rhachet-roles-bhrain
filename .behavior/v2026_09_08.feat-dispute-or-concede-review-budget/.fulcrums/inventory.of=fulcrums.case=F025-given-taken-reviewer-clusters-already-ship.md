# F025 · `given` / `taken` / `reviewer` term clusters already ship — the itemization is complete

- **rework** = clean · **confidence** = 97% · **status** = disputed (repo-rules nitpick.1, r001)

## .the concern

`review.by.repo-rules`, stone `5.1.execution.from_vision`, r001 nitpick.1 (rule
`rule.require.domain-term-itemization`):

> new contracts compose `given`, `taken`, and `reviewer`, which are treated as declared terms but no
> term cluster ships for them … **If `given`/`taken`/`reviewer` already have clusters elsewhere,
> confirm it**; otherwise itemize them so the new contract vocabulary is complete.

## .the stance — DISPUTE

the reviewer's own hedge names the check, and the check passes: **all three clusters already ship.**
they were itemized on a prior route, not in this diff, so a reviewer scoped to `--diffs since-main`
does not see them — but `rule.require.domain-term-itemization` is satisfied by their existence in
`domain.terms/`, never by their presence in this diff.

## .the evidence

`rhx globsafe --pattern '.agent/repo=.this/role=any/briefs/domain.terms/term=route.guard.review.{given,taken,reviewer}._.choice._.md'`
returns **3 files** (2026-09-14):

- `term=route.guard.review.given._.choice._.md`
- `term=route.guard.review.taken._.choice._.md`
- `term=route.guard.review.reviewer._.choice._.md`

⇒ each of the three has its `.reason.md` beside it. the `feedback` forbidden-synonym line the
nitpick quotes points AT `term=route.guard.review.given` — the extant cluster it names — so the
new `concern` cluster references a term that is already declared, rather than one that is owed.

## .what this diff adds vs reuses

- **adds** the `concern`, `stance`, `dispute`, `concede` clusters — all present in `git status`
- **reuses** the `given` / `taken` / `reviewer` clusters, already itemized

⇒ the contract vocabulary is complete. no new itemization is owed.

## .rework, and why

**clean.** the requested files already exist, so there is naught to change — a concede here would
manufacture work (re-itemize three extant clusters) the rule does not ask for.

## .confidence, and why it is 97%

the claim is a `Glob` result, not a judgment — the files exist or they are absent, and they exist.
the 3%: a reviewer could argue the clusters must be re-cited from within this diff's contracts, but
the rule is satisfied by one canonical cluster per word org-wide, reused across every dobj/dop —
which is the rule's own text (*"one entry per word, REUSED"*).

## .where

`.reviews/peer/5.1.execution.from_vision._.review.i001.2aabd61fe4954da558.r001._.given.by_peer.repo-rules.report.md`
nitpick.1, and its paired `.taken.by_self.repo-rules.md` § nitpick.1 `[REFUTE]`.

## .the verdict

_not yet ruled._
