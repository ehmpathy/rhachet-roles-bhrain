# self-review: has-pruned-yagni (r1)

## stone: 5.1.execution.phase0_to_phaseN.v1

---

## yagni review

took a breath. re-read the wish. re-read the code. asked for each line: was this requested?

---

## the wish says

> upgrade the review skill to pull XAI_API_KEY from `rhx keyrack` rather than depend on envvars
> and pass it in through the upgraded rhachet-brains-xai context
> and failfast if the `rhx keyrack` cant find those creds under the `--ehmpath` owner
> ...
> add a keyrack to the reviewer role

---

## component 1: keyrack.yml (4 lines)

```yaml
org: ehmpath

env.all:
  - XAI_API_KEY
```

**line-by-line:**

| line | requested | why |
|------|-----------|-----|
| `org: ehmpath` | yes | wish: "from ehmpathy... `--ehmpath` owner" |
| `env.all:` | yes | standard keyrack manifest structure |
| `  - XAI_API_KEY` | yes | wish: "only add this support for XAI_API_KEY" |

**verdict:** no extras. 4 lines, all requested.

---

## component 2: getXaiCredsFromKeyrack.ts (79 lines)

re-read the file line by line.

**imports (lines 1-2):**
- `keyrack` from rhachet — needed to call keyrack.get()
- `BrainSuppliesXai` — needed for return type, matches wish "pass it in through the upgraded rhachet-brains-xai context"

**jsdoc (lines 4-10):**
- .what, .why, .note — standard mechanic practice. explains the workaround. not yagni.

**function signature (lines 11-13):**
- returns supplier object — wish: "pass it in through... context"
- no parameters — simple, no abstraction for configurability

**keyrack.get call (lines 15-18):**
- owner: 'ehmpath' — wish: "`--ehmpath` owner"
- key: 'XAI_API_KEY' — wish: "only add this support for XAI_API_KEY"

**granted handler (lines 21-37):**
- extracts apiKey — needed
- sets process.env.XAI_API_KEY — workaround documented in vision (rhachet limitation)
- returns supplier — needed

**locked handler (lines 39-50):**
- error messages — wish: "failfast"
- unlock command — actionable, user knows what to do
- process.exit(2) — constraint error per exit code semantics

**absent handler (lines 52-63):**
- error messages — wish: "failfast if... cant find those creds"
- set command — actionable

**blocked handler (lines 65-74):**
- error messages — completeness for all KeyrackGrantAttempt statuses
- needed for type safety

**exhaustiveness check (lines 77-78):**
- ensures all status cases handled
- typescript best practice

**yagni concerns reviewed:**

| potential yagni | analysis | verdict |
|-----------------|----------|---------|
| supplier return type | wish says "pass through context" | needed |
| process.env assignment | documented workaround for rhachet | needed |
| 'blocked' handler | completeness for discriminated union | needed |
| exhaustiveness check | type safety | needed |
| emoji in error messages | consistent with owl vibe | not yagni, its tone |

**verdict:** no extras. 79 lines, all serve a purpose.

---

## component 3: review.ts changes (6 lines)

```typescript
import { getXaiCredsFromKeyrack } from '@src/domain.operations/credentials/getXaiCredsFromKeyrack';

// fetch xai credentials from keyrack if xai brain selected
const isXaiBrain = options.brain.startsWith('xai/');
if (isXaiBrain) {
  await getXaiCredsFromKeyrack();
}
```

**line-by-line:**

| line | requested | why |
|------|-----------|-----|
| import | yes | needed to call the function |
| comment | yes | explains the paragraph |
| isXaiBrain check | yes | wish: "only... when we detect that the brain is from xai" |
| if block | yes | conditional execution |
| await call | yes | wish: "upgrade the review skill to pull XAI_API_KEY from keyrack" |

**verdict:** no extras. 6 lines, all minimal.

---

## component 4: reflect.ts changes (6 lines)

same pattern as review.ts.

**was it requested?**

the wish says "upgrade the review skill" — reflect.ts is not review.ts.

**but consider:**
- reflect accepts `--brain` flag
- if user runs `rhx reflect --brain xai/grok/...`, they'd expect same credential flow
- vision section 1.2 explicitly included reflect.ts
- blueprint step 1.2 explicitly included reflect.ts
- roadmap step 1.2 explicitly included reflect.ts

**is this scope creep or necessary consistency?**

scope creep would be: features not implied by the wish or vision.

this is: the same pattern applied to another skill that accepts the same flag.

**verdict:** not yagni. consistency is necessary for user experience.

---

## component 5: deferred tests

roadmap phase 2 includes tests. they are deferred, not added.

**is deferral itself yagni?**

no — yagni is about extra features. tests are part of the blueprint.
deferral is a decision about when, not what.

**verdict:** not applicable to yagni review.

---

## did we add abstraction "for future flexibility"?

reviewed for abstraction patterns:

| pattern | present? |
|---------|----------|
| configurability (owner param) | no, hardcoded 'ehmpath' |
| strategy pattern | no |
| factory pattern | no |
| dependency injection | no (direct SDK import) |
| generic types | no |
| optional parameters | no |

**verdict:** no premature abstraction.

---

## did we add features "while we're here"?

reviewed for feature creep:

| potential feature | present? |
|-------------------|----------|
| support for other keys | no, only XAI_API_KEY |
| support for other owners | no, only 'ehmpath' |
| auto-unlock | no, fail-fast only |
| retry logic | no |
| cache for results | no |
| log statements | no (just error output) |

**verdict:** no feature creep.

---

## did we optimize before needed?

reviewed for premature optimization:

| potential optimization | present? |
|------------------------|----------|
| cache keyrack results | no |
| lazy load | no |
| connection pool | no |
| batch operations | no |

**verdict:** no premature optimization.

---

## final summary

| component | lines | yagni? | action |
|-----------|-------|--------|--------|
| keyrack.yml | 4 | no | keep |
| getXaiCredsFromKeyrack.ts | 79 | no | keep |
| review.ts changes | 6 | no | keep |
| reflect.ts changes | 6 | no | keep (consistency) |

**total new lines:** 95
**lines that are yagni:** 0

no yagni detected. every line serves the wish, vision, or documented workaround.
