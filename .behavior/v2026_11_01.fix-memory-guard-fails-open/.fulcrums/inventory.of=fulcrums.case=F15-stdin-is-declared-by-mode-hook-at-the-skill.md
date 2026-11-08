# F15: stdin is declared by `--mode hook` at the skill

## .the fork

`memoryGuard()` in `src/contract/cli/memory.ts` reads stdin with no flag of its own. add a flag check in node, or hold that the skill's `--mode hook` is the declaration?

## .taken: the skill's `--mode hook` is the declaration

- the skill reads stdin only under `--mode hook`, and only when stdin is not a tty (`memory.guard.sh:56`, `:61`)
- node never meets the harness stdin: the skill feeds it a here-string, `<<<"${PAYLOAD-}"`, empty where no payload was read. a bare run cannot hang
- `memoryGuard` has one caller, the skill; a second flag check in node would repeat the first

## .rework: clean

a flag check in node is a few lines with no caller to change.

## .confidence: 90%

## .where

`src/contract/cli/memory.ts:43`; `src/domain.roles/learner/skills/memory.guard.sh:56`.

## .verdict

open.
