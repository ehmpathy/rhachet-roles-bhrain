# fulcrum F23 — the word `blocked` names a guard hold AND a driver wall

- rework     = **dirty**
- status     = **open** — deferred, dreamed, handed up
- confidence = **90%** that the deferral is correct; **50%** on which repair direction wins
- where      = `PassageReport.status` · `RouteStoneDisposition.why` · the status line · every
               `passage.jsonl` on disk · every snapshot that prints the word

## .the fork, stated fairly

| option | what it does | cost |
|---|---|---|
| **A — split the word** | coin a distinct status for the driver wall; keep `'blocked'` for the guard hold | a durable ledger-format change + a read-time shim or a migration |
| **B — qualify in the RENDER** | leave the stored status; derive a distinct label from `blocker`'s presence | cheap and reversible, and the ledger stays ambiguous for any file-reader |
| **C — defer entirely** | record it, repair only the in-file contradiction | the overload ships another round |

## .taken, and why — at the time

**C**, with **A vs B left open** for a council.

the SAFE/CLEAN test decided it, and both halves fail:

- **SAFE** 🔴 — a rename of a `PassageReport.status` value changes a durable on-disk format that
  every prior route already wrote
- **CLEAN** 🔴 — it ripples into the status-line contract, the hook disposition, the judge, and
  every snapshot that prints the word. files this round never opened ⇒ the *smuggled refactor* shape
  `rule.always.fix-forward-under-scouts-honor` grades a blocker

⇒ and the overload **predates this round in every file that holds it**. this round wrote no new
`blocked` semantics.

## 🔴 .what WAS fixed in-round, and why the line sits there

`PassageReport.ts:12` declared `'blocked'` to mean *"a hard driver wall (--as blocked)"* — **false**,
and contradicted four lines below by `blocker?: RouteStoneGuardBlockerType`, a discriminant whose
**seven** values contain no driver wall at all.

that comment was repaired in-round. it passes **both** questions: SAFE (a docblock touches no
behavior — types, lint, and format each re-run green, and `Grep 'PassageReport\.ts'` over every
`*.ts` returns zero matches, so no test can reach it) and CLEAN (one comment, one file, the ledger
contract this round's own gate writes to).

⇒ **the line: a one-line comment with zero ripple is a fix; a ledger format is a dream.**

## .rework, and why it is dirty

a `status` value is a **published, persisted enum**. the reversal cost is not the rename — it is
every `passage.jsonl` already on disk in every route of every repo that runs this engine, plus every
consumer that keys on the string.

## .confidence, and why it is not higher on the direction

**90%** the deferral is right — the SAFE/CLEAN answers are mechanical and both are no.

🔴 **50%** on A vs B, and the reason is that the drive did not do the work that settles it:
`domain.terms/` holds **no** `term=route.stone.passage.blocked` cluster, so the two senses have never
been enumerated in the glossary. `rule.require.domain-term-itemization` wants that itemization
**before** a split is chosen, and `rule.forbid.domain-term-ambiguity` carries the measured lesson
that makes the order load-bearing: *enumerate the senses of the word you KEEP before the settlement,
because afterward the word you would have reached for is forbidden.*

## 🔴 .the general question handed up, for the second time

**the same one `F22` raises**: *is a verification stone's zero-tolerance clause scoped to the stone's
own DIFF, or to the whole REPO?*

this round assumed **the stone's own diff**, and acted on that assumption **twice in one review** —
it FIXED the in-file contradiction and DEFERRED the repo-wide overload. ⇒ two fulcrums now rest on
one unanswered question, which is worth a council's verdict rather than a third instance.

## .the verdict, once ruled

_(open)_

## .see also

- `$route/dreams/v2026_09_23.fix.the-word-blocked-names-a-guard-hold-and-a-driver-wall.md` — the
  work, with the code cites and the two repair directions
- `$route/review/self/for.5.3.verification._.has-ergonomics-validated.md` — the live capture that
  found it, and the `def.ergonomic` score
- `F22` — the first instance of the scope question this hands up
