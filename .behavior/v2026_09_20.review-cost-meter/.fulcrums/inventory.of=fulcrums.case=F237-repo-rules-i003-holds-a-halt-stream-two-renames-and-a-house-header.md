# F237 — the repo-rules i003 holds a halt stream, two renames, and a house header

- raised 2026-10-12, by `repo-rules` (blocker.3, nitpick.3, nitpick.6, nitpick.11), at 5.3 i003
- rework: **clean** — each row is a mechanical sweep: a stream move, a field rename, a label
  rename, or a constant hoist. none ripples into a contract a caller outside this repo hardened
  against
- status: 🟡 **BEST-GUESSED — disputed**
- confidence: **78%**

## .the fork, stated fairly

the i003 r001 `repo-rules` lane raised four concerns that are true in premise, and whose cure
spreads past this diff. two answers per row:

| option | the claim |
|---|---|
| **A — hold, and record the tradeoff** | each cure is a sweep across snapshots, fixtures, or five cli files, for a concern that ships no harm. hold it here, where the council reads it |
| **B — repair now** | each is a rule violation the lane named; the rules do not wait for a cheap moment |

| global | concern | why it holds |
|---|---|---|
| blocker.3 | `route.stone.set` prints its halt tree to stdout, then exits 2 | extant on main, byte for byte (`origin/main:src/contract/cli/route.ts:1206-1220` — `console.log(stdoutWithoutOwl)` under `isGuardExitRequired`). a move to stderr rewrites the halt contract of every guard halt, and every acceptance case that pins `stderr === ''` beside halt text on stdout |
| nitpick.3 | a partition's id is `slug` at parse and `name` on `ReviewPartitionOfTargets` | `getAllTargetsByPartition.ts:13` already glosses `name` as the slug. a field rename on two partition dobjs reaches ~15 read sites and every fixture of the review partition dir and the route partition dir |
| nitpick.6 | the census row label `corpus` | the row counts prompts read and unread, a concept distinct from the file set `scope` names — yet `term=review.scope._.choice.reason.md` records `corpus` as the snapshot set, so the word is overloaded either way. the cure is a new canonical word for the run-log set, then a ~31-line snapshot sweep across unit and acceptance |
| nitpick.11 | the `✋ ConstraintError:` literal in `asOpenerFailureNote` | the literal is the house header, in ~15 sites over five cli files (`route.ts`, `reflect.ts`, `review.ts`, `review.by.ts`, `asOpenerFailureNote.ts`). `asConstraintErrorHeader` takes a caught error, so no shared prefix unit exists to call. a hoist of one site is a half-cure, and `rule.require.qualified-error-headers` prescribes the literal header itself |

## .taken, and why

**A**, for all four. not one ships a harm a user would meet; all are `better`. blocker.3 is the
weightiest, and it predates this branch on main — a halt-stream change is a contract change of its
own, owed its own behavior and its own acceptance sweep.

## .rework, and why

**clean.** each row is mechanical: a stream swap plus a resnap, a field rename the compiler walks,
a label rename plus a resnap, a constant hoist across five files. none forks a shape a caller
outside this repo leans on.

## .confidence, and why it is not higher

a strict reader holds blocker.3 as a live `rule.forbid.stdout-on-exit-errors` blocker whatever its
age on main, and nitpick.6 as a synonym that should not ship on a new surface at all.

## .where

`src/contract/cli/route.ts` · `src/domain.operations/review/partition/getAllTargetsByPartition.ts` ·
`src/domain.operations/review/asPromptInputsCensusLines.ts` · `src/contract/cli/asOpenerFailureNote.ts`

## .verdict

— (awaits the council)
