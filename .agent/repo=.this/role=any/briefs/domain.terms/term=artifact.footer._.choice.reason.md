# domain.term.choice.reason: footer

## .etymology

**`footer`** is adopted from typography and from the treestruct convention this repo already
writes: a block at the **foot** of a document that reports *about* the document rather than
continues it. it was chosen against four candidates, each rejected for a stated reason:

| rejected | why |
|---|---|
| `summary` | overloaded — `contract.reviewer-output` already uses `summary` for the reviewer's own stdout block. one word, two concepts (`rule.forbid.domain-term-ambiguity`) |
| `trailer` | film and freight jargon; it names a position with no sense of *what* sits there |
| `tail` | already a unix verb and a stream concept — a `tail` of a log is its last **lines**, which is exactly what a footer is NOT |
| `outcome-block` | a compound coinage where a single extant word serves. two words for one concept |

⚠️ **`footer` is not `stdout.body`.** `term=stdout.body` names what a *reviewer* emits to stdout;
a footer is what the *guard* appends to an artifact file. different producer, different consumer,
different file.

## 🔴 .why the term earns a cluster at all — it names an INVARIANT, not a shape

the honest test (`rule.require.enumerate-before-you-name`) was applied before the word was kept:
**every instance a footer must cover was listed first.**

| the artifact | passage footer? | tally footer? |
|---|---|---|
| a reviewer that exits 0 with a readable verdict | ✋ no | ✅ yes |
| a reviewer that exits non-zero with a readable verdict | ✅ yes | ✅ yes — **both** |
| a reviewer that exits non-zero with an unreadable verdict | ✅ yes | ✋ no |
| a **judge**, at any exit code | ✅ if non-zero | ✋ **never** — a judge counts no blockers |

⇒ **row 2 is the row that earns the word.** with two footers on one artifact, *"which one is
last?"* becomes a real question, and it is answerable only if both are rendered by one operation.
so `footer` is not a shape — it is the name of a **position that must be computed**.

## .evidence — the concept was proven by two defects, one round apart

### the i019 defect — two terminal branches at one level

before `formatArtifactFooters`, each footer was authored **as though it were last**, so each
hardcoded `└─`. a dual-outcome artifact then rendered:

```
└─ passage blocked
   ├─ blocked by constraints
   └─ exit code: 2 ✋
└─ tallied            ← 🔴 a second terminal branch at the root
   ├─ 3 blockers
   └─ 1 nitpick
```

`rule.require.treestruct-output` admits exactly one `└─` per level, so a driver who met this read
a shape no other artifact in the corpus produces. caught by `ergo-snapshot-visual-blemishes`
(i019, bounded re-run); repaired by the shared writer, which **derives** the marker and the child
indent together.

### 🔴 the i020 defect — the same concept, one layer down

the i019 repair lifted `runStoneGuardReviews`'s footer into the shared operation and **left
`runStoneGuardJudges`'s copy inline.** caught by `repo-rules` under
`rule.forbid.duplicate-format-tree-operations`.

⚠️ **it hid because the two renderers agreed.** a judge renders no tally, so `tally` is always
`null` at that call site; `formatArtifactFooters` then computes `isLast = true`, `marker = '└─'`,
`childIndent = '   '` — **byte-identical** to the three lines the inline block pushed by hand.
**no snapshot moved and no test failed.**

⇒ **that is the sharpest argument for the term.** the duplication was invisible to every rubric
that grades *rendered output*, r6 among them, which returned `0/0` on the same corpus in the same
round. it was visible only to a rule about **operations**. ⇒ a footer's correctness is a property
of *who computes its marker*, never of the bytes it happens to emit today.

**the generalizable lesson:** an extraction that lifts one of two call sites does not reduce
duplication — it converts a symmetric pair into an authoritative writer plus a stale copy, which
is strictly worse, since the copy now drifts against a writer that claims to own the grammar.

## .disputes

_(none opened)_

## .see also

- `rule.forbid.duplicate-format-tree-operations` — the rule both defects violated
- `rule.require.treestruct-output` (ergonomist) — the one-`└─`-per-level law the invariant serves
- `term=route.guard.review.tallier._.choice._.md` — who produces the tally a footer reports
- `.behavior/v2026_09_03.fix-contemplation-gate-on-entrance/5.3.verification.yield.md` — the i019 and i020 round records
