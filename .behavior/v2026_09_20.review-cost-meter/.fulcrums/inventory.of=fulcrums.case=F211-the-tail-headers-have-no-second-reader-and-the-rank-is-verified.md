# F211 — the tail headers have no second reader, and the scaffold rank is verified against bytes

- raised 2026-10-10, from i036 r015 nitpick.3 and nitpick.4 `[nitpick][better]`:
  - n3: `## target (…)` and `## prior conversation (…)` are inline literals in
    `asPromptTailVariable`, while the census lane knows the delimiters it cuts on
  - n4: `RANK_OF_SECTION` ranks `scaffold` 3rd, and the reviewer reads its first byte as later
- rework: clean
- status: 🟡 **BEST-GUESSED — disputed**
- confidence: **75%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — hoist the tail headers to constants, and re-state the rank** | one home per header string, as the head markers got |
| **B — the headers have one reader, and the rank already holds** | the census keys on the `<target>` / `<conversation>` tags, never on the `## …` header text; and the rank note was verified against a shipped prompt |

## .taken, and why

**B.** single-source-of-truth binds a string with **two readers**. the `## …` tail headers have
one: the renderer. `asPromptSectionChars` cuts on the `<target>` and `<conversation>` tags, so a
reworded header changes no row boundary — it moves a few chars inside `scaffold`, which the
attribution grade already bounds (`asAttributionOfResidual`). the head markers were hoisted because
the census cuts **on** them; the tail headers are not cut on, so the cases differ by the one
property the rule turns on. the reviewer grades it low for the same reason.

for n4: `instructions` has its own row from token 0, so the `# review task` preamble is not
`scaffold`. the first `scaffold` byte is the `## rules (FOR REFERENCE ONLY …)` header, after
`outputFormat` and ahead of the `<rules>` body — rank 3. the note beside the rank states this and
cites the shipped prompt's line offsets (43 `## output format`, 83 `## rules (…)`, 85 `<rules>`).

## .rework, and why

**clean.** two constants and two interpolations, if the council wants the headers hoisted anyway.

## .confidence, and why it is not higher

a future census that cuts on the header text would make n3 real; the rule's cue would then fire
on that change, not on this one.

## .where

`src/domain.operations/review/asPromptTailVariable.ts` ·
`src/domain.operations/review/asPromptSectionChars.ts` (`RANK_OF_SECTION`, its note at ~line 120)

## .verdict

(open)
