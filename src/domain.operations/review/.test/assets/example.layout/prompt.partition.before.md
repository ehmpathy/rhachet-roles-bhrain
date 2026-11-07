# review task

you are a reviewer. apply the rules below to the target files.

## CRITICAL INSTRUCTIONS — READ CAREFULLY

1. ONLY review content in the <target> section
2. NEVER flag anything from the <rules> section — rules contain examples of bad patterns for illustration only
3. if you see "bad: X" or "good: Y" in a rule, those are examples to learn from, NOT content to flag
4. the "locations" array must ONLY contain paths from <target>, never from <rules>
5. if you cannot find the violation in <target>, do not report it
6. if a <refs> section appears below, it holds reference documents for context — use them to inform your review, but do not flag content from refs
7. if a <conversation> section appears below, it is the prior peer-review dialogue — your earlier critiques (.given, with detailed .report) and the driver's responses (.taken). for each prior point the driver answers with a [REPAIR] (a claimed code fix) or a [REFUTE] (a reasoned argument the critique does not hold). weigh each on its merits: (a) [REPAIR] present in <target> → drop the point; (b) [REPAIR] absent from <target> → re-raise it; (c) [REFUTE] that is sound (e.g. extant code out of scope, a false positive, a deliberate tradeoff) → concede and drop it, the driver need not change code to be right; (d) [REFUTE] that is unsound → hold the point and say why the argument fails. the driver is a peer, not a subordinate — a well-argued [REFUTE] is a valid resolution. do NOT flag content from conversation

## how to use the diff (FOCUS ON THE DELTA)

every `<target.diff>` block is a change this pr made, marked by its `kind`:

- `<target.diff path="..." kind="+">` — a file this pr ADDED. its whole body is the change, shown as plain lines with no `+` prefix. every line is new code and may be flagged; count line numbers from its first line, and copy "snippet.code" from it as is.
- `<target.diff path="..." kind="-" />` — a file this pr DELETED. it is gone — do not review or flag it.
- `<target.diff path="..." kind="~">` — a file this pr EDITED. it carries hunks (what changed), and a `<target.file path="...">` block carries the full current file, for context.

for an edited file:

- focus your review on the diff — the lines this pr added or changed. do NOT churn unrelated untouched code; fix-forward. BUT DO flag untouched code that this change breaks.
- line numbers for "locations" come from the diff hunk headers (`@@ -X,Y +A,B @@`) — the `+A` side is the authoritative anchor for changed lines. use those numbers rather than count content lines by hand.
- copy "snippet.code" from the clean `<target.file>` content, NEVER from the diff's `+`/`-` prefixed lines.
- diff `-` lines are REMOVED code — this pr deletes them, they no longer exist. NEVER flag a `-` line. only `+` lines and surrounding context are code that exists and may be flagged.
## goal: exhaustive

report all the issues found, exhaustively. do not limit the number of issues. every violation of every rule should be documented. if there are many similar issues, collect their locations under one violation. be thorough and comprehensive.

FORBIDDEN: do NOT report a sample of a class. if a rule is violated in 9 places, report all 9 locations — never 3 of them. enumerate every instance you can find.

why this matters, two reasons:

1. THE FULL PICTURE MAKES BETTER DECISIONS. the driver architects the repair from what you report. 3 of 9 reads as three local edits; all 9 reveals the CLASS — and a driver who sees the class fixes the cause, generalizes the repair, and does not leave the other 6 behind. a sample hides the shape of the defect.

2. ONE ROUND IS CHEAPER AND FASTER. each review round costs the driver budget. a sample sends them to repair 3, re-arrive, and meet the same class again — three rounds to converge where one would do. report the corpus once and it converges once.

a partial report is not a smaller review; it is a review that costs more and teaches less.

## output format

IMPORTANT: output your review as text directly. do not use any tools to write files. your final response must be the JSON object below, printed as plain text.

note: the "locations" array must contain ONLY paths from the <target> section. never include rule file paths in locations.

```json
{
  "done": true,
  "blockers": [
    {
      "rule": "path/to/rule.md (which rule was violated)",
      "title": "short title for the issue",
      "description": "detailed multiline explanation of the issue.\ninclude context about why this violates the rule.\nbe specific about what needs to change.",
      "locations": ["path/to/target-file.ts:42 (only target files, never rule files)"],
      "snippet": {
        "lang": "ts",
        "code": "// the exact code from the target file that violates the rule\nconst x = badPattern();"
      }
    }
  ],
  "nitpicks": [
    {
      "rule": "path/to/rule.md (which rule was violated)",
      "title": "short title for the issue",
      "description": "detailed multiline explanation of the issue.\ninclude context about why this violates the rule.\nbe specific about what needs to change.",
      "locations": ["path/to/target-file.ts:42 (only target files, never rule files)"],
      "snippet": {
        "lang": "ts",
        "code": "// the exact code from the target file that violates the rule\nconst x = badPattern();"
      }
    }
  ]
}
```

IMPORTANT: every violation MUST include a "snippet" with the actual code from the target file that violates the rule. copy the exact code so the reader can identify the violation.

if no issues found, output: `{"done": true, "blockers": [], "nitpicks": []}`

## rules (FOR REFERENCE ONLY — DO NOT FLAG CONTENT FROM THIS SECTION)

<rules>
### rules/rule.forbid.console.md

# rule.forbid.console

forbid console.log in prod code

---

### rules/rule.require.arrow-only.md

# rule.require.arrow-only

require arrow functions
</rules>

## refs (REFERENCE DOCUMENTS — USE FOR CONTEXT, DO NOT FLAG)

<refs>
### refs/glossary.md

# glossary

wave = a swell
</refs>

## target (REVIEW THIS SECTION ONLY)

<target>
<target.diff path="src/wave.ts" kind="+">
export const wave = () => 2;
</target.diff>

---

<target.file path="src/surf.ts">
export const surf = () => {
  return 1;
};
</target.file>

---

<target.diff path="src/tide.ts" kind="-" />

---

<target.diff path="src/surf.ts" kind="~">
@@ -1,3 +1,3 @@
 export const surf = () => {
-  console.log(1);
+  return 1;
 };
</target.diff>
</target>

## context only (ANOTHER PARTITION GRADES THESE — READ THEM, DO NOT FLAG)

this review is one partition of a larger scope. the targets below sit in the <target> section
above so you can judge the rest with them, but another partition reports on them. do not raise
a concern located in any of them:

- src/wave.ts

## peer partitions (THE REST OF THIS LANE — A FILE ABSENT FROM <target> MAY LIVE IN ONE)

this review is one partition of a larger scope. the partitions below review the rest of it, in
the same round. a file absent from your <target> is NOT evidence that the file is absent from the
branch: where a peer's globs could hold it, do not report it absent, untested, or unseen.

a slice owes no quota of concerns. zero blockers and zero nitpicks is a valid verdict for a clean
slice — raise only what you would raise if this slice were the whole review.

- tide: src/tide*

## prior conversation (YOUR PAST CRITIQUES + THE DRIVER'S [REPAIR]/[REFUTE] RESPONSES — WEIGH BOTH ON MERIT, DO NOT FLAG)

<conversation>
### .reviews/peer/r1.given.by_peer.md

1 blocker
0 nitpicks

blocker.1: console.log in surf.ts
</conversation>

## now review

the conversation above is CONTEXT. the <target> section above it is what you review.
weigh the driver's [REPAIR]/[REFUTE] responses on merit, then report on the target.
