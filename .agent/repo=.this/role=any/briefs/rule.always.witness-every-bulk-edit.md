# rule.always.witness-every-bulk-edit

> **a bulk text sweep is run one bounded glob at a time, and its PLAN is read before its apply.**

`sedreplace` demands a plan before an apply so a human can read the diff. ⇒ a plan piped to
`/dev/null` satisfies the gate and discards the witness, so **every apply behind it is blind.**

## .why — the gate is a witness, never a formality

| what the plan is for | what a redirect does to it |
|---|---|
| a human reads the diff and can refuse | nobody reads it, and the apply runs regardless |
| a wrong pattern is caught before it lands | the wrong pattern lands, silently, on every file it matched |
| the apply is a **confirmation** of a read | the apply is a coin flip with a receipt |

🔴 **and the failure scales with the loop.** one blind apply is one risk; a `for` loop of 51 is
51, and not one of them was seen. ⇒ **the loop is what converts a small carelessness into an
unreviewable one.**

⚠️ output redirection is on this environment's auto-decline list for exactly this reason. **the
block is the rule, not an obstacle to it.**

## 🔴 .never sweep a directory whose contract is VERBATIM speech

| directory | why a sed is forbidden there |
|---|---|
| `$route/.seeds/` | `.said` is verbatim wisher speech — *"do not clean it up. typos, lowercase, mid-thought corrections and all"* (`rule.always.archive-the-wishers-words-verbatim`) |
| any quoted `>` block | a cited quote keeps its original words (`define.simplified-technical-english` § exemptions) |

⇒ **a tidied quote is already a paraphrase**, and a sed cannot tell a quote from prose. exclude the
directory; do not trust the pattern to miss it.

## 🔴 .prefer a DISCRIMINATING pattern over a bare token

a bare ordinal is the sharpest instance: this route's `F14` and another route's `F14` render
identically, and **only the link form parts them.**

```
👍  case=F14-          # a filename fragment — this route's, unambiguously
👎  F14                # could be any route's inventory. a blind sweep corrupts the citation
```

⇒ before a sweep, ask: **could this pattern match something the sweep does not own?** yes → narrow
the pattern until it cannot.

## 🟡 .for ordinal padding, ASCENDING is the safe order

```
👍  F01→F001, F02→F002, … F17→F017
👎  F17→F017, … F01→F001     # "F01" is a substring of "F017" ⇒ "F0017"
```

ascending is safe because a produced `F0XY` can only be matched by a pattern `F0X`, and every such
pattern (X ≤ 9) is spent before any `F0XY` (XY ≥ 10) exists.

| when… | then… |
|---|---|
| you would pipe a plan to `/dev/null` | 🔴 the strongest cue. the plan IS the reason the apply is permitted |
| you would loop plan-then-apply | 🔴 that loop cannot be witnessed. one glob, one read, one apply |
| a sweep's glob would reach `.seeds/` | exclude it. verbatim speech is not sweepable |
| a pattern is a bare ordinal, id, or short token | narrow it — a neighbour's identifier may render identically |
| you would run more than ~10 subprocesses in a loop | the grove is shared. check the load, or widen the glob rather than the count |
| a sweep must pad ordinals | ascending, always |

blocker: an apply whose plan was redirected away · a sed over a directory that holds verbatim
speech · a bare-token pattern where a discriminating form exists.
nitpick: a loop of many invocations where one bounded glob would serve.

⇒ see also: `rule.always.archive-the-wishers-words-verbatim` (driver) ·
`rule.prefer.sedreplace-for-renames` (ehmpathy/mechanic — the WHEN to this HOW) ·
`rule.forbid.brackets-in-filenames` (librarian) — *"a find-and-replace cannot part a **citation** of
a bad name from an **instance** of one."*
