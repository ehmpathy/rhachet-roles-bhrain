# domain.term.choice.reason: prose.summary

## .etymology

latin *summa* — "the highest, the total" — via the accountant's sense: the one figure that stands in
place of every row above it. that is exactly the claim the word makes here, and it is why the
rejected synonyms all fail: each names a shape where `summary` names a **relation to a whole**.

### why not the rejected synonyms

| rejected | why it fails |
|---|---|
| `recap` | names the ACT of a re-run, not the artifact. a recap can be as long as its source |
| `wrapup` | a schedule word — it says *when*, never *what*. and it is a gerund-shaped compound |
| `takeaway` | names one point a reader should carry, which is a **conclusion**, not the whole |
| `tldr` | an initialism, and `rule.forbid.shouts` bars capital acronyms. it also names the reader's impatience rather than the passage's property |
| `digest` | carries a settled sense elsewhere — a periodic roll-up of many sources, not one turn |

⇒ **the wisher chose the word, and it was taken verbatim.** it arrived inside the skill name they
typed: *"rhx elucidate.summary --when onStop"*. `rule.require.ubiqlang` says adopt the wisher's
word rather than a synonym of it, so no alternative was weighed for the contract — only for the
forbidden list above.

## .why it was undeclared until the day it shipped

`elucidate.summary` is a published skill name — it appears in `package.json` exports, in
`rhachet.repo.yml`, and in the `onStop` hook command every adopter will inherit.
`rule.require.domain-term-itemization` grades a declared dop whose constituent terms are not
itemized a blocker, and this one shipped with `elucidate` conformed and `summary` undeclared.

the librarian canon uses `summary` in `rule.require.summary-at-the-cluster-root` and in
`rule.forbid.itemization-without-coordinates`; every itemization in this behavior's own `.fulcrums/`
and `.seeds/` carries a `## .the summary` header. none of that is a declaration.

⇒ the fourth instance of one tell, now recorded four times in four rounds:

> **the undeclared word is not the rare one. it is the word so common that its absence reads as a
> background fact.**

| round | the word | what surfaced it |
|---|---|---|
| 1 | `reviewer` | a reader who could not parse `reviewer` |
| 2 | `review` | a look for `reviewer`'s boundary |
| 3 | `prose` | a second word (`bulletize`) that reached for the same absent home |
| 4 | `summary` | a contract published with it in the name |

**the fourth surfaced differently from the first three, and that is the part worth the record.**
the first three were found by a reader — someone confused, or a look that came up empty. this one
was found by a shipped artifact: the term sweep ran against a contract that already existed.

⇒ so the tell has a second, later trigger: **a word you just put in a published name is a word to
check, whether or not anyone was confused by it.** the reader-driven find is cheaper; the
contract-driven find is the backstop, and it fires after the cost is already incurred.

## .evidence

### the instance list, per `rule.require.enumerate-before-you-name`

| where | its subject | the sense |
|---|---|---|
| `elucidate.summary` (this cluster) | a turn | the last passage before rest |
| `rule.require.summary-at-the-cluster-root` | a cluster | the `$subject._.md` root file |
| `rule.forbid.itemization-without-coordinates` | an itemization | the `_.md` that holds axes, counts, gaps |
| `inventory.of=fulcrums._.md` → `## .the summary` | an inventory | the index table |

⇒ *"$word, of WHAT?"* returns two distinct answers:

- **a turn** — a passage
- **a cluster** — a file with peers
- per `rule.require.boundary-qualified-terms`, two answers is two senses and two clusters, each boundary-qualified
  - ⇒ this cluster takes the first; `itemization.summary` is owed for the second

### the invariant

**a summary carries no claim its source does not.** it restates; it never introduces. a passage that
states a fact found nowhere above it is not a summary at all — it is a new claim under a summary's
header, and it escapes every review the source received.

⇒ that invariant is what makes the telepath sense checkable rather than a matter of taste, and it is
why `## .what it is NOT` bars `conclusion` and `status`: both may introduce.

## .disputes

none.

🟡 one is foreseeable, and is recorded rather than opened:

- if `itemization.summary` is paved and the two senses differ only in subject
  - a future traveler may argue for a single root `term=summary` that heads both
  - `rule.prefer.decompose-a-subject-via-suffixes` would favor that over two peers
- **that argument needs both clusters to exist first** — so it is not opened today
