# define.diffusion

> **diffusion is the spread of a passage's PURPOSE across its prose, until no one place carries it.**
> do not lose the needle in the haystack. **elevate the needle.**

it is the antonym of `elucidation`, and the clamp on the rule that requires it.

⇒ that it grades **findability** rather than presence — and what parts it from an absent point — is
declared in `rule.forbid.diffusion` and is not restated here.

## .the etymology names the mechanism

latin `dis-` (*apart*) + `fundere` (*to pour*) — **to pour apart**.

⇒ the physical sense is exact: ink in water spreads until the concentration gradient vanishes. the
ink is all still there; what is destroyed is not the substance but the gradient — and a gradient
is precisely what a reader follows to find a point.

🟡 it completes a pair the glossary already holds: `con-` + `densāre` (*a gather-together*) against
`dis-` + `fundere` (*a pour-apart*).

## .the subject is PURPOSE, not words

**this is not *"too many words"***, and the distinction keeps it clear of `forbid.rambles`:

| rule | its subject |
|---|---|
| `forbid.rambles` | a line that runs past its own point |
| **diffusion** | a passage whose purpose is spread across rival points |

⇒ **a three-line passage diffuses** if it carries three claims of equal weight. length is neither
necessary nor sufficient.

## .the smells — each is a page scan, never a judgment of intent

| smell | what a reader sees |
|---|---|
| the buried lede | the point arrives in paragraph four |
| the rival headline | two claims in one passage, neither subordinated to the other |
| the diluted claim | the point stated once, then six facts beneath it at equal rank |
| the scattered claim | the same point in three places, none authoritative |
| the implied point | the reader must infer the claim; it is never asserted |
| the flat list | twelve bullets at one depth, so none of them is the needle |
| the diffuse ask | a question spread across three unstated dimensions |

⇒ **the last row is the input-direction case**, and it is real: a swallowed question diffuses your
uncertainty across the whole answer as hedges and unstated reads. **`surface the read` is the repair
because it CONCENTRATES that into one line.**

## .the repair is ELEVATE — and it is not a cut

| rule | its repair |
|---|---|
| `require.reflexive-condensation` | cut the haystack down |
| **diffusion** | raise the needle up |

**the haystack may stay.** promote the point to a header, a lead line, a bolded claim, or a parent
bullet with the rest as its children.

⇒ that distinction is what keeps the two rules from a merge: one changes the volume, the other
the gradient. a passage can be perfectly condensed and perfectly diffuse.

## .the demos

### 👎 bad — the diluted claim

> the reviewer inherits `--diffs since-main` from the guard convention. that convention dates to the
> first guard authored here. `getAllFileDiffsFromRange.ts` prefers `origin/main` and takes a
> merge-base. the reviewer grades prose. `src/` holds no prose. the flags are declared per-guard in the
> `run:` line.

**six facts, one rank, no needle.** every sentence is true, tight, and checkable — and the reader
cannot say what the passage claims.

### 👍 good — the needle elevated

> **the telepath reviewer declares its own scope, against the guard convention**
> - it grades **prose**; `--diffs since-main` pulls `src/` in
> - ⇒ the flags are per-guard, in the `run:` line — so this costs a declaration, never a guard change

**same facts. one is now the claim and the rest are its children.** naught was cut.

---

### 👎 bad — the rival headline

> the reviewer is cheap to run and it cannot enforce two of the ten issues.

⇒ two claims, one sentence, equal weight. a reader who acts on the first misses the second entirely,
and both carry load.

### 👍 good — one needle, one subordinate

> **the reviewer cannot enforce #407 or #411 — a reviewer reads files, and those govern live messages**
> - ⇒ so no reviewer, however good, closes them. the mechanism that reaches a message is #414
> - (cost is not the constraint here: measured at 8.0% of context, $0.013)

**the second claim is demoted to a parenthetical**, because it does not change what the reader does.

---

### 👎 bad — the flat list

> - it is cheaper
> - it reuses the extant shape
> - the rules are repo-agnostic
> - adoption costs two files
> - voice is not telepath's axis

🟡 **bulletized, terse, one concept per line — and it passes `require.bulletize` outright.** it still
diffuses: five peers at one depth, and the reader must rank them.

### 👍 good — the same five, with a gradient

> **fork it and you buy naught — the rules are repo-agnostic by nature**
> - the one reason to fork is a **voice** difference, and voice is explicitly not telepath's axis
> - ⇒ so adoption is cheap by consequence: two files, the extant shape, no new logic

⇒ **that pair is the strongest case for this rule**: `bulletize` renders a tree and **cannot tell a
tree from a rake**. diffusion is what grades whether the tree has a trunk.

## 🟡 .the boundary

| a violation | not a violation |
|---|---|
| six facts at one rank with no claim above them | six facts under a claim that ranks above them |
| a claim the reader must infer | a claim asserted, then given its ground |
| twelve peers at one depth | twelve peers where the axis is genuinely flat — a table, not a list |
| a question across three unstated dimensions | a question with its ground stated |

**a genuinely flat set is not diffuse — it is a TABLE.** if every member answers the same question
about a different subject, the shared axis is a **column**, and the needle is the column header.

## .see also

- `rule.forbid.diffusion` — the trait
- `rule.require.elucidation` — the require this clamps
- `rule.forbid.obfuscation` — the straddle: prose that is findable and disputable and still conceals
- `rule.require.reflexive-condensation` — cuts the haystack; this raises the needle
- `rule.require.bulletize` — renders the tree; this grades whether it has a trunk
