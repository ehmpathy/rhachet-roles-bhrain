# F7: quoted prose keeps the verb scan

## .the fork

a verb word inside quotes, beside a memory path, blocks: `git commit -m "stop cp of …/memory into briefs"`, a `gh pr create --body` that names `tee`, and a brief heredoc that quotes a memory path. exempt a quoted span that no runner word (`bash -c`, `sh -c`, `xargs`, `find -exec`) precedes, or keep the scan over quoted words?

## .taken: keep the scan

- the exemption needs a closed list of runner words, and a runner the list lacks would pass: `zsh -c`, `ssh host "cp …"`, `eval "cp …"`, `su -c`, `watch "cp …"`, `parallel`. that is the fail-open shape the l3 lanes just repaired, at a new seam
- the cost of the scan is a nudge on prose that names a verb and a memory path in one command, which is rare and recoverable: drop the path from the message, or write the brief with the Write tool, which the guard grades by its file path alone
- the guard's one job is a write into memory; a false block is a nudge, a false pass is a lost lesson

## .rework: clean

a quote-aware exemption in `getOneBashCopyVerb` plus a runner list and table rows. no contract moves.

## .confidence: 80%

the prose case is real friction, and the brief heredoc case is the nudge's own destination; a human may weigh the friction higher than the runner gap.

## .where

`src/domain.operations/memory/getOneBashCopyVerb.ts`.

## .verdict

open for the human.
