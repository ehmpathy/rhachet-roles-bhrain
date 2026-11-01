# F9: the writer list stays closed this round

## .the fork

the guard grades two kinds of bash write: a file redirect, and a closed list of copy verbs (`tee`, `teesafe`, `cp`, `mv`). other writers pass: `sed -i`, `install`, `rsync`, `dd`, `ln`, `touch`, `python -c`, and the `MultiEdit` tool. widen the list this round, or keep it as the merge base had it?

## .taken: keep it closed this round

- the wish is a fail-open fix: a guard that cannot run must not halt the call. these writers passed on the merge base too, so no call this round newly lets through
- the guard is a safety net, not a seal (`rule.forbid.native-memory`, `.the boundary`); a determined write always has a route the text cannot see
- each verb added is a grade to design (where its destination sits, which flags write) and a row of friction for every read beside it. that is a scope call for the human, not a repair

## .rework: clean

a verb joins `BASH_COPY_VERBS`, with its destination rule in `asMemoryGuardActOfCopy` and a verdict row; `MultiEdit` joins the tool-name branch and the hook's matcher.

## .confidence: 85%

the arch lane names it a fork for the human, not a mandate; the risk is that a clone reaches for `sed -i` on a memory file before the list widens.

## .where

`src/domain.operations/memory/getOneBashCopyVerb.ts` · `getMemoryGuardVerdict.ts` · the learner hook's `Write|Edit|Bash` matcher.

## .verdict

open for the human.
