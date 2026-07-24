# domain.term: progress

term.chosen   = progress
term.kind     = noun
term.synonyms.forbidden:
- status
- log
- journal

## .what
the learner's **progress** is its record of a sweep — what it distilled this round and why (or
why none). it lives in the sentinel `progress.md`, whose mtime + articulation the onStop
sweephook reads to judge staleness.

## .refs
where the term composes declared operations:
- src/domain.operations/learn/getSweepProgress.ts        # get the sweep's progress (mtime + content)
- src/domain.operations/learn/isProgressArticulated.ts   # is the progress articulated (real content)

## .reason
see the ref-level cluster beside this choice:
- `term=progress._.choice.reason.md` — etymology + why `progress`, not `status`/`log`
