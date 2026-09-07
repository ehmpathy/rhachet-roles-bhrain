# fulcrum F14 — the contrastive `never` is carved OUT of `rule.forbid.absolutes`

- **rework** = clean · **status** = open · **confidence** = 70% — raised 2026-09-07
- **where** = `src/domain.roles/telepath/briefs/rule.forbid.absolutes.md` · its `.md.min` · the canon
  table row in `readme.md`
- **raised** = 2026-09-07, when the rule was authored and its own corpus was walked

## .the fork, stated fairly

the wisher's ground is one line — *"only the sith deal in absolutes"* — and `absolute` names a
**quantifier over a set**. so the fork is whether `never` in the shape *"X, never Y"* is one.

| option | what it grades | what it costs |
|---|---|---|
| A — carve it out, as taken | a quantifier only. *"X, never Y"* is a **bound**, and a bound is what the rule asks for | a reader must part two senses of one word |
| B — grade every `never` | the word, wherever it appears | 1274 lines that already carry a bound, plus a rename of a booted published rule |
| C — forbid the word outright, contrastive included | the word | the same 1274, and it deletes the sharpest form the canon has |

## .taken — A, and why

- the two shapes differ on one checkable property: **can you name what the word ranges over?**
  - *"a claim, never a verdict"* ranges over ONE named alternative, and it is on the page
  - *"it never fails"* ranges over every run that ever happened, and the author walked zero
- ⇒ so the contrastive form already satisfies the rule's own repair — it states a bound
  - to grade it would be to demand a repair the passage has performed

🟡 **and option C would strike the canon's own strongest sentences.** `rule.require.generic-governs-structure-never-voice` is a booted published rule whose FILENAME carries the word, and its contrastive is what makes the seam legible.

## .the measurement it rests on

walked against disk 2026-09-07, over 4735 files:

| the class | count |
|---|---|
| `never`, all uses | 2900 across 962 files |
| — contrastive | 1274 |
| — the rest | 1626 |
| — in a filename | 4 |

⇒ **the sort is what makes the rule affordable.** at option B the rule opens with a 2900-line
backlog and a rename; at option A it opens with a candidate set of 1626 and no rename.

## 🟡 .why it is only 70%, and the counter is real

**the 1626 is a CANDIDATE set, never a defect count.** a regex cannot part a walked set from an
unwalked one, so the number that prices this fork is an upper bound on one side and unmeasured on
the other. three counters, each stated as a reader would put it:

- **the carve-out is a judgment, and the rule asks a reviewer to make it per line.** *"can you name
  what it ranges over?"* is answerable and it is not mechanical — so two reviewers can disagree, and
  a rule whose test forks is weaker than one whose test does not
- **a contrastive can still overstate.** *"a claim, never a verdict"* is a bound; *"a reviewer never
  reads code"* is contrastive in shape and a quantifier in substance. the carve-out admits the second
- **the canon has a peer that would catch it anyway.** `rule.require.disputable-claims` asks what
  observation would settle a sentence, and an unwalked quantifier fails it. so option C's loss might
  be recoverable

⇒ the counter that would move me: **if a reviewer finds a contrastive `never` that carries an
unwalked quantifier, the carve-out is a hole and the repair is a tighter predicate**, not a wider
forbid.

## .the rework, and why it is CLEAN

- **the whole reversal is two lines** — one `false positive` row in the rule, one in its `.md.min`
- no caller is hardened against it — the rule ships in this round, so no later work is built on it
- the 1274 lines it exempts are untouched either way, since option A never edited them

## .the verdict, once ruled

_open._

## .see also

- `src/domain.roles/telepath/briefs/rule.forbid.absolutes.md` — the rule, and its `.the two shapes`
  table is where the carve-out is declared
- `rule.require.disputable-claims` — the peer that would catch what this carve-out lets through
- `rule.require.enumerate-before-you-name` — the discipline the measurement above follows: the set is
  walked before the word is graded
- `F13` — the other measurement-priced call on this route, and the same instrument lesson
