# define.reflexive-condensation

> **a second pass over what you already wrote. per line: if it is not 95%+ important to mention,
> do not mention it.**

**reflexive** — the pass runs over the draft, every time. it is not a discipline you try to hold
while the words appear.

## .what it cuts that no extant rule cuts

⇒ the three-rule contrast table is declared in `rule.require.reflexive-condensation` and is not
restated here.

**a merely-useful line is invisible to `brevity` and `rambles` alike.** it can be short, active, and correct, and be
the 70th-most-important sentence in a passage that needed twelve. **no word is surplus and the line
still costs the reader.**

## .the bar inverts the burden of proof

⇒ the inversion table is declared in `rule.require.reflexive-condensation` and is not restated here.

what that rule cannot carry: **an author cannot answer *"is this concise?"* honestly.** they always
say yes, because the draft is a record of what they already judged worth the words. a number forces
a RANK where the question forced a verdict, and a rank is what a second reader can check.

⇒ the bar is high on purpose. it is not *"cut the obvious filler"* — it is **cut each line that is
merely useful**.

## .the demos

### 👎 bad — every line true, tight, and unranked

> the guard hardcodes `--diffs since-main` in its `run:` line. that convention dates to the first
> guard authored in this repo. it is a sensible default for a code reviewer. telepath's reviewer, however,
> grades prose, so it must declare its own scope.

**four sentences — all true, all tight.** only the last carries the claim; the convention's
provenance ahead of it is background the reader did not need to hold it.

### 👍 good — the pass run, at the bar

> telepath's reviewer declares its own `--diffs` scope. the guard's `--diffs since-main` convention pulls
> `src/` in, and this reviewer grades prose.

**two sentences, and both are 95%+.** the convention's provenance did not survive the rank, and
its absence costs the reader naught.

---

### 👎 bad — five reasons, ranked by the order they occurred to the author

> - it is cheaper
> - it reuses the extant `review.by` shape
> - the rules are repo-agnostic by nature
> - adoption costs two files
> - the only reason to fork is a voice difference, and voice is not telepath's axis

### 👍 good — ranked, then cut at the bar

> - the rules are **repo-agnostic by nature**, so a fork buys naught
> - ⇒ and the one reason to fork — a voice difference — is explicitly not telepath's axis

**two survive.** *cheaper*, *reuses the shape*, and *two files* are true and rank below the bar —
they support the call rather than carry it.

---

### 👎 bad — a pass that never ran

a draft written carefully, sentence by sentence, and shipped as first drafted.

⇒ **careful is not condensed.** each line was judged at the moment it was typed — against the
sentence before it, never against the passage's final set. a rank needs the whole set to exist.

### 👍 good — the reflexive pass

1. write the draft
2. re-read it as a set, and ask of every line: *does this out-rank what stays?*
3. cut each line below the bar

⇒ **step 2 is what the word `reflexive` names**, and it cannot be performed inside step 1.

## 🟡 .the boundary — what the bar does NOT license

| a violation | not a violation |
|---|---|
| a true, tight line that ranks below the bar | a line that carried a distinction — its cut is lossy, and lossy is a defect of the cut |
| a restated claim | a caveat a reader must act on |
| background nobody asked for | a stated read offered beside an uncertain answer |
| a section padded to fill a template header | a passage the purpose genuinely demands at length |

### the bar grades IMPORTANCE, never LENGTH

**lossless compression cannot add ambiguity, by construction** — it removes the words that carried no
distinction. so a word that carried one is not surplus, and a cut that drops it was lossy.

⇒ that is a defect of the cut, never a property of density, and the bar must never be cited to
justify it. the repair for a lossy cut is a shorter, more precise cut — not a restored paragraph.

measured, in this repo: a `.md.min` cut *"a skip writes no `log` artifacts"* down to *"a skip writes
no artifacts"*. two words removed, one distinction destroyed, and the min is what boots — so every
reader held the false form and the precise source was never read.

## .where it sits in the canon

⇒ its position is stated in `rule.require.reflexive-condensation`, and the full order once in the
role's `readme.md`. neither is restated here.

**`bulletize` makes this pass cheap.** a bullet is one concept on one line, so the set is already
ranked-shaped: the pass reads down the outline and strikes rows. **on a paragraph the same pass must
first find where each claim begins.**

## .see also

- `rule.require.reflexive-condensation` — the trait
- `rule.require.bulletize` — the container that makes the pass cheap
- `rule.require.purpose-first` — the yardstick the rank is measured against
- `rule.forbid.subversive-prose` — the shapes a below-bar line most often wears
