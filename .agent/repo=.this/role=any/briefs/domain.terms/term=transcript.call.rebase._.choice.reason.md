# domain.term.choice.reason: rebase (transcript.call)

## .etymology
the context is measured as a delta from a base: each call's context minus the prior call's. at a
compaction the base itself moves — the next delta is reckoned from a new, smaller base. *rebase*
names that move exactly.

chosen over `compaction` (one of two causes, so it cannot name both), `reset` (implies a return to
zero; the new base is the summary, never empty), and `truncation` (implies a cut at an end; a
compaction rewrites the whole).

## .the line against `git rebase`
both move a base, and that shared core is the reason for the word. no contract in this repo names a
git rebase, so the two never meet in one; the skill `git.branch.rebase` lives in another role's
repo.

## .evidence
- invariant: a rebase ends every held block; only blocks that arrive after it are held past it
- the live run of this route's own session showed 5 rebases across 428 calls, each a compaction
