# fulcrum F23 — three concerns in one round cite a file state that moved

- rework = **clean** — a re-raise costs one round; no code depends on the call
- status = 🟡 **BEST-GUESSED 2026-09-23** — refuted on staleness, all three
- confidence = 🟡 **88%**
- raised.by = the driver, at i001 of `5.3.verification`

## .the fork

three of the six concerns at `i001.9a4e1de04b07e57f4e` name a repair that is **already in the
file they name**, at the grain they name:

| lane | concern | what it asked for | where it stands |
|---|---|---|---|
| `repo-rules` | n1 | `REPEATABLE_CONFIG` should read `process.env.CI ? 'SOME' : 'EVERY'` | **both named files carry that exact line**, with a comment citing the rule |
| `ergo-contract-snapshots` | b1 | a snapshot per refusal variant, across six locations | **20 refusal snapshots**, covering all six |
| `ergo-snapshot-visual-blemishes` | b1 + n1 | glyph every row, one `└─` at the tail, drop the padded literal | **all four sub-items repaired**, snapshot and renderer alike |

⇒ each lane's **claim** is sound and its **locations** are stale. the fork is what to do with a
concern in that shape.

## .the two forks, stated fairly

### A — dispute, and quote the current file state (taken)

- a concession commits the driver to a fix (`rule.always.absorb-every-concern`), and there is no
  fix left to make. **to concede would be to claim work I did not do this round**, which makes
  the absorption record false at exactly the point a council reads it for truth
- the `.taken` carries the current bytes verbatim, so the lane can re-read rather than re-derive
- ⇒ and `rule.forbid.overzealous-blockers` cuts both ways: a concern the driver cannot act on —
  because it is already actioned — is one no round can close by action

### B — concede as already-repaired, and move on

- cheaper. no argument to write, no fulcrum, no council attention
- 🔴 and it **records a repair against this round that this round did not make**, which corrupts
  the one artifact that says what each round did. the next reader of `passage.jsonl` sees three
  concessions and looks for three diffs that are absent

## .why A was taken

the deciding property is **what a concession MEANS**, not which is cheaper. a disposition is a
statement of fact about this round, and the fact here is *"already true"* rather than *"now
made true"*. those are different, and only one of them is honest.

🟡 and the dispute is not adversarial — every `.taken` here opens by granting the rule and the
argument. what is refused is the verdict against **these files**, and the refusal is settled by a
quote a reader can check in one open.

## 🔴 .the part that earns a fulcrum rather than three quiet refutations

**three in six concerns is not an anecdote.** one stale concern is a lane that read a snapshot of
the tree; three in one round is a property of how this stone reviews.

⇒ the likely cause is mechanical and this round cannot prove it: the lane corpus is bound
`--diffs since-main`, and with **zero commits on this branch** that range unions the entire
staged-and-untracked set. a round that repairs a file does not shrink the range, so a later lane
reads a corpus that holds both the defect and its repair, and may attend to either.

🟡 that is a **hypothesis with a mechanism**, not a measurement — and the measurement is not this
round's to take, because the collapse lever is a commit and no stone asked for one
(`rule.forbid.commits-the-route-did-not-ask-for`).

## .what the council may rule differently

- **that a stale concern is conceded rather than disputed**, to keep the ladder quiet. the cost is
  the false-repair record above; the benefit is a round that ends sooner
- **that three-in-six warrants a halt** rather than three refutations — i.e. that the corpus
  defect is the real finding and the concerns are its symptom
- **that the `.taken` should not quote current bytes at length.** each of the three runs 60–100
  lines, and most of that is evidence. a shorter form would cite line numbers alone and trust the
  lane to open the file

## 🔴 .it recurred at a second stone, which upgrades the hypothesis

**2026-09-25, `5.1.execution.from_vision` i008, `arch-hazards-maintenance` b1.** the lane quoted
`} catch { return null; }` from `getOneReviewerLastRunAt.ts` and wrote that the `SyntaxError`
allowlist *"is NOT present in the current target"*. it is present, at line 93, and every other
fault rethrows through `UnexpectedCodePathError`.

🔴 **the tell is sharper here than in any of the three above, and it is checkable with no file
open at all: the quoted `catch` binds NO error to a name.** a catch that binds no error cannot
express the allowlist it says is absent, so the two claims cannot both be true of one file — the
snippet refutes itself.

⇒ so the class is not a property of one stone. **the mechanism in the section above — a
`--diffs since-main` range that unions the whole staged set, so a lane reads both the defect and
its repair — is the same on every stone of this branch**, and this occurrence is what raises it
from *"how this stone reviews"* to *"how this branch reviews."*

🟡 and the lane's own argument corroborated the repair it denied: it praised the **read** half two
lines above for its correct allowlist and wrap. both halves were repaired in one edit, for one
reason, with one wrap — so a reader of the current file sees them adjacent and identically shaped.

## .where

- `.reviews/peer/…r001._.taken.by_self.repo-rules.md` — n1
- `.reviews/peer/…r002._.taken.by_self.ergo-contract-snapshots.md` — b1
- `.reviews/peer/…r006._.taken.by_self.ergo-snapshot-visual-blemishes.md` — b1, n1
- 🔴 `5.1.execution.from_vision` i008 · `…r006._.taken.by_self.arch-hazards-maintenance.md` — b1

## .the verdict

_unruled._

## .see also

- `F20` — the adjacent class, and **not** this one: there a test asserts a rule prefix no
  mechanism enforces. the two get confused because both involve a claim that outruns its artifact
- `rule.always.absorb-every-concern` — why a disposition is a statement of fact
- `rule.forbid.commits-the-route-did-not-ask-for` — why the corpus cause stays a hypothesis here
