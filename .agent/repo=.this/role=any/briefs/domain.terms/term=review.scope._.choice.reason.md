# domain.term.choice.reason: scope

## .etymology

latin *scopus*, a target or mark to aim at — via the modern sense *"the extent of what a thing
covers."* the word is already the one every flag in the surface reaches for
(`--paths-with` bounds it, `--join` composes it, `input.scope.json` records it), so it is
**adopted rather than coined**: the contract named it first, and this cluster ratifies the name.

⚠️ the boundary is `review`, never `route.guard.review`. the field is declared in
`src/domain.operations/review/`, and `rhx review` runs standalone — the guard is one caller of it,
not its home.

## .the rejected synonyms, and why each fails

| word | why it was refused |
|---|---|
| `selection` | names the ACT of choice, where the term names the RESULT. and it implies a human picked, when the set is computed from flags |
| `coverage` | 🔴 the sharpest refusal — **`coverage` is what a review ACHIEVED; `scope` is what it was GIVEN.** to fuse them asserts the reviewer examined all it received, which is the exact claim an overflow disproves |
| `surface` | already spoken for — a "surface a human reads" is the ergonomist's sense, and this repo uses it that way in several rules |
| `corpus` | in this repo `corpus` means the **snapshot corpus** (the `.snap` set a suite pins). one word, two file sets, is the overload the glossary exists to prevent |

## .the evidence — a measured round, 2026-09-06

the word earned its cluster the day a **false claim about scope** was made and then refuted by the
scope record itself.

**the claim:** *"every `.taken` I write lands in `since-main` and widens the prompt that
overflowed"* — offered with a table that showed i026 → i027 growth of `+11 files / +52.4k tokens`.

**the refutation, from the artifacts the scope emits:**

```
$ git check-ignore -v '.../.reviews/peer/…r001._.taken.by_self.repo-rules.md'
.reviews/peer/.gitignore:2:*     → IGNORED
```

⇒ a gitignored file cannot enter `git diff origin/main`, so it cannot enter `targetFiles`. and a
grep for `.reviews` across the whole token breakdown returns **0 matches**. the takens were never in
scope at all.

**what actually grew**, read from the per-file inventory rather than the aggregate:

| bucket | i026 | i027 | delta |
|---|---|---|---|
| `.behavior/` | 282.1k | 303.4k | **+21.3k** — of which `5.3.verification.yield.md` is +8.1k |
| `src/` | 398.2k | 407.5k | +9.3k |
| `blackbox/` | 202.3k | 211.1k | +8.8k |
| `.dream/` | 101.4k | 109.5k | +8.1k |
| `.agent/` | 43.3k | 48.2k | +4.9k |

## 🔴 .the lesson the word must carry — an aggregate names no site

the false claim was not careless about the numbers; **both totals were exactly right.** the error
was to read a *delta* and assert a *cause* — and the delta is agnostic about which bucket moved.

⇒ **a scope has two faces, and only one of them can attribute:**

| the face | what it answers | what it cannot |
|---|---|---|
| the **aggregate** (`files: 310`, `tokens: 1079.7k`) | how big | ⛔ **what is in it** |
| the **inventory** (`input.scope.debug.json`, `tokens.expected.md`) | what is in it, per file | — |

⚠️ the guard's own overflow message prints the aggregate and **names the inventory in its hint**.
so the two are one line apart, and the cheap read is the one that cannot attribute.

⇒ **this is the same failure as F10**, one round later and in a new surface: F10 attributed a render
to an operation by source read, and the operation was rekeyed with the render byte-unchanged. the
rule it yielded — *a claim about which site produced the bytes is settled by a run, never by a read*
— **generalizes here to: a claim about which file produced the tokens is settled by the inventory,
never by the total.**

## .the design consequence, recorded because it is the term's own boundary

with the inventory open, the fix became measurable rather than arguable. against the 750k cap:

| bound | remains | verdict |
|---|---|---|
| yields only, from `.behavior/` | 893.9k | ⛔ fails by 144k |
| drop `.behavior/` | 776.3k | ⛔ fails by 26k |
| `{src,blackbox}/**` | 618.6k | ✅ — and it matches the independent i025 measurement of 618.2k |

🔴 **and the yields are the worst content a scope can keep.** `5.3.verification.yield.md` at **81.8k**
is the largest single file in the whole scope — over three times the largest source file (25.4k).
a reviewer handed it grades **the report about the work** rather than the work.

⇒ **a review scope should carry the work, never the reports about the work.** that principle is the
term's sharpest edge, and it is why `coverage` was refused: the reports inflate the scope while they
add no coverage at all.

## .see also

- `term=review.scope._.choice._.md` — the contract
- `.dream/v2026_09_05.fix.paths-with-silently-drops-the-diffs-bound.md` — the flag defect that makes
  an unbounded scope look bounded
- `rule.always.diagnose-reviewer-malfunctions` (driver) — the scoped re-run this term underwrites
