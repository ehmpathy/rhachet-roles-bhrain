# F9 — a poke rides the head its run already wrote

## .the fork

- **A** — the poke sends the head file its review run wrote into the run's log dir. no copy
- **B** — the poke writes its own copy of the head under a poke cache dir, as the prior design did,
  so the run's log dir holds only the run's record

## .taken — A, and why

- a poke exists to warm the exact bytes its peers send. a copy is a second source for those bytes,
  and two sources can drift: a poke that reads a copy can warm a head no peer sends
- two pokes of one reviewer wrote to one copy path and could overwrite each other; one file per run
  removes the race (`setOnePrefixPoke.integration.test.ts` `[case5]`, both heads checked)
- the run's log dir still holds only its own record: the head IS part of that record, and the poke
  reads it, writes no file there

## .rework — clean

restore `asPrefixPokeHeadPath`, write the copy, point the poke at it. one module and its test.

## .confidence — 80%, and why low

it reverses an intent the old test stated outright (the run dir is the run's record, so the poke
must not write there). A keeps the letter of that intent — the poke writes naught there — but reads
from it, which the old author may also have meant to forbid.

## .where

`src/domain.operations/review/prime/setOnePrefixPoke.ts` ·
`src/domain.operations/review/prime/setOnePrefixPoke.integration.test.ts` `[case1]` `[case5]`

## .verdict

ruled 2026-11-06 by the director: **A**, the best guess stands. a clean rework that touches no
credential and no prod write.
