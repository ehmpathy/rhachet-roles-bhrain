# rule.forbid.sampled-instances

> **enumerate every instance of a class. never report a sample of it.**

if a rule is violated in 9 places, report all 9 locations — never 3 of them.
`rhx review --goal` defaults to **exhaustive** for this reason.

## .the test

before you emit: **for each class you report, did you scan for its other instances?**

- yes, and you listed them all → ✅
- you stopped at *"enough to make the point"* → 🔴 a sample. go back and enumerate

⚠️ **this is COVERAGE, never SEVERITY.** it does not ask for more blockers.
`rule.forbid.overzealous-blockers` still grades each point, and a class you would grade a nitpick
stays a nitpick with nine locations under it.

## 🔴 .why — two reasons

### 1. the full picture makes better decisions

the driver architects the repair from what you report.

| what you report | what the driver builds |
|---|---|
| 👎 3 of 9 | **three local edits.** the other 6 stay, unseen |
| ✅ all 9 | **the CLASS.** they fix the cause, generalize the repair, and close it whole |

⇒ **a sample hides the SHAPE of the defect.** three instances read as three accidents; nine read as
a pattern with a root — and only the second tells the driver what to actually change.

### 2. one round is cheaper and faster

each review round costs the driver **budget**, which is scarce by design.

| round | a sample reports | the driver repairs |
|---|---|---|
| r1 | 3 of 9 | 3 |
| r2 | 3 of 9 | 3 |
| r3 | the last 3 | 3 — **budget exhausted** |

⇒ **three rounds to converge on ONE class**, where one round would do. and the driver cannot tell a
sample from a corpus: a report of 3 reads as *"there are 3"*, so they re-arrive confident and meet
the same class again — which reads as a target that MOVED rather than the sample it always was.

## .how to report many instances without many violations

collect them under ONE violation:

```json
{
  "rule": "rule.forbid.gerunds",
  "title": "gerunds in brief prose",
  "locations": ["a.md:12", "a.md:40", "b.md:7", "c.md:91", "c.md:104"]
}
```

⇒ **one violation, five locations — never five violations.** the guard tallies VIOLATIONS, so a
collected class costs the driver one concern to answer and hands them the full scope to repair.

## .the one exception

`--goal representative` exists, and a caller may pass it deliberately for a quick human read. the
default is exhaustive; **a sample requires that the caller asked for one.**

⚠️ **and if the corpus exceeds your context bound, SAY SO in the review** — a partial report that
does not admit it is partial is the failure this rule exists to forbid (`rule.forbid.failhide`).

## .see also

`contract.reviewer-output` — the two numeric lines every review owes ·
`rule.forbid.overzealous-blockers` — the severity of each point, which this rule does not touch ·
`compileReviewPrompt.ts` — the exhaustive goal prompt, which states these two reasons verbatim
