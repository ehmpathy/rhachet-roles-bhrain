# self-review: has-no-silent-scope-creep (r4)

## stone: 5.2.evaluation.v1

---

## what is scope creep?

scope creep = changes made beyond what was requested, without acknowledgment.

**silent** scope creep = creep that is hidden, undocumented, sneaky.

the danger: each small addition compounds. a feature that was "just 3 files" becomes 10. complexity grows untracked.

---

## methodology: trace every change back to wish

for each change in git diff, i will:
1. quote the exact wish text that requires it (if any)
2. if no wish text requires it, check if blueprint requires it
3. if neither requires it, flag as potential scope creep

---

## analysis: keyrack.yml

### the change

new file: `src/domain.roles/reviewer/keyrack.yml`

```yaml
org: ehmpath

env.all:
  - XAI_API_KEY
```

### wish trace

> "add a keyrack to the reviewer role, so that when folks init their keyrack with this role, they extend this roles keyrack, and know that `XAI_API_KEY` is required to be filled in"

exact match. wish explicitly requests this file.

### scope creep check

| element | required by wish? |
|---------|-------------------|
| file existence | yes, "add a keyrack to the reviewer role" |
| org: ehmpath | yes, "ehmpathy, so we feel comfortable to ask for creds from the `--ehmpath` owner" |
| XAI_API_KEY entry | yes, "know that `XAI_API_KEY` is required" |

**verdict:** no scope creep. every line maps to wish text.

---

## analysis: getXaiCredsFromKeyrack.ts

### the change

new file: `src/domain.operations/credentials/getXaiCredsFromKeyrack.ts` (79 lines)

### wish trace

> "upgrade the review skill to pull XAI_API_KEY from `rhx keyrack`"
> "failfast if the `rhx keyrack` cant find those creds"
> "pass it in through the upgraded rhachet-brains-xai context"

### line-by-line scope check

**lines 1-3: imports**

```typescript
import { type KeyrackGrantAttempt, keyrack } from 'rhachet/keyrack';
import type { BrainSuppliesXai } from 'rhachet-brains-xai';
```

required? yes. cannot call keyrack or define supplier type without these.

**lines 4-10: jsdoc**

```typescript
/**
 * .what = fetch xai credentials from keyrack with fail-fast semantics
 * .why = xai is the default brain; credentials should come from keyrack, not envvars
 *
 * .note = also sets process.env.XAI_API_KEY for current rhachet compatibility
 *         (rhachet's genContextBrain does not yet pass supplier context through)
 */
```

required? to document operations is standard practice, not scope creep.

**lines 11-18: keyrack.get call**

```typescript
const grant = (await keyrack.get({
  for: { key: 'XAI_API_KEY' },
  owner: 'ehmpath',
})) as KeyrackGrantAttempt;
```

required? yes. "pull XAI_API_KEY from `rhx keyrack`"

**lines 21-36: granted handler**

sets process.env and returns supplier.

required? yes. "pass it in through the upgraded rhachet-brains-xai context"

**lines 39-50: locked handler**

```typescript
if (grant.status === 'locked') {
  console.error('🦉 patience, friend');
  // ... actionable instructions
  process.exit(2);
}
```

required? yes. "failfast if the `rhx keyrack` cant find those creds"

but wait — did we add extra error states?

**lines 52-63: absent handler**

required? yes. "failfast if the `rhx keyrack` cant find those creds" — absent means creds not found.

**lines 65-74: blocked handler**

is "blocked" a state the wish requested?

the wish says "failfast if the `rhx keyrack` cant find those creds."

blocked means keyrack cannot be accessed. this is "cant find those creds."

required? yes. handles the complete set of keyrack failure modes.

**lines 76-78: exhaustiveness check**

```typescript
const _exhaustive: never = grant;
throw new Error(`unexpected grant status: ${JSON.stringify(_exhaustive)}`);
```

required? this is defensive code for type safety. standard typescript practice.

is this scope creep? no. exhaustiveness checks are not features; they are correctness guarantees.

### scope creep check

| element | required by wish? |
|---------|-------------------|
| keyrack.get call | yes |
| granted handler | yes |
| locked handler | yes |
| absent handler | yes |
| blocked handler | yes (edge case of "cant find") |
| exhaustiveness | standard practice |

**verdict:** no scope creep. every branch handles a keyrack failure mode the wish requires.

---

## analysis: review.ts changes

### the change

lines 10, 183-187 modified

### wish trace

> "upgrade the review skill to pull XAI_API_KEY from `rhx keyrack`"
> "only add this support for XAI_API_KEY for now, specifically when we detect that the brain is from xai"

### line-by-line scope check

**line 10: import**

```typescript
import { getXaiCredsFromKeyrack } from '@src/domain.operations/credentials/getXaiCredsFromKeyrack';
```

required? yes. must import to use.

**line 184: detection**

```typescript
const isXaiBrain = options.brain.startsWith('xai/');
```

required? yes. "specifically when we detect that the brain is from xai"

**lines 185-187: conditional fetch**

```typescript
if (isXaiBrain) {
  await getXaiCredsFromKeyrack();
}
```

required? yes. "pull XAI_API_KEY from `rhx keyrack`"

### what is NOT in review.ts

did we add any other changes to review.ts?

let me verify via the actual diff:

```bash
git diff main -- src/contract/cli/review.ts
```

the diff shows only:
- import line added
- isXaiBrain detection added
- if block added

no other changes. no "while we're in there" cleanup.

**verdict:** no scope creep in review.ts.

---

## analysis: reflect.ts changes

### the change

lines 8, 144-147 modified (same pattern as review.ts)

### wish trace

> "upgrade the review skill to pull XAI_API_KEY from `rhx keyrack`"

the wish says "review skill" — not "reflect skill."

### is this scope creep?

yes, this is beyond the literal wish text.

### is this SILENT scope creep?

no. this was documented as divergence #8 in the evaluation artifact:

> **divergence #8: reflect.ts included**
> **blueprint:** `[?] reflect.ts # OPEN QUESTION`
> **implementation:** `[~] reflect.ts` updated
> **resolution:** backup
> **rationale:** the open question was resolved to include reflect.ts for consistency

the decision was:
1. explicitly marked as an open question in blueprint
2. resolved consciously in implementation
3. documented as a divergence
4. addressed with rationale

**verdict:** scope extension, not silent scope creep. the difference matters:
- silent creep = hidden, undocumented, sneaky
- documented extension = acknowledged, rationalized, traceable

---

## analysis: package.json changes

### the change

```diff
- "rhachet": "0.23.2",
+ "rhachet": "0.23.7",
```

### is this scope creep?

dependency version bumps are infrastructure maintenance, not feature scope.

the wish requires keyrack integration. keyrack api may have changed between versions. the version bump enables the feature.

**verdict:** no scope creep. dependency updates are routine.

---

## analysis: pnpm-lock.yaml changes

### is this scope creep?

lockfile changes automatically when package.json changes. this is not intentional scope; it is a consequence of dependency management.

**verdict:** no scope creep.

---

## what about files NOT changed?

scope creep can also manifest as changes we should have made but did not.

### tests deferred

the blueprint specified test coverage. tests were deferred per roadmap.

is deferral scope creep? no. it is documented and intentional reduction of scope, not expansion.

### other cli commands

did we change any other cli commands? no.

review.ts and reflect.ts are the only cli files touched.

---

## scope creep enumeration

| change | required by wish? | documented? | verdict |
|--------|-------------------|-------------|---------|
| keyrack.yml | yes | n/a | no creep |
| getXaiCredsFromKeyrack.ts | yes | n/a | no creep |
| review.ts changes | yes | n/a | no creep |
| reflect.ts changes | no | yes (#8) | extension, not silent |
| package.json | yes (enables feature) | n/a | no creep |
| pnpm-lock.yaml | automatic | n/a | no creep |

---

## the key distinction

**scope creep**: adds work without acknowledgment
**scope extension**: adds work with explicit decision

reflect.ts is the only change not literally in the wish. it was:
- flagged as open question in blueprint
- decided in implementation
- documented as divergence
- rationalized as consistency improvement

this is not silent. this is explicit scope management.

---

## final verdict (r4)

no silent scope creep detected.

the implementation contains exactly what the wish requested, plus one documented scope extension (reflect.ts) that was explicitly decided and rationalized.

every other change traces directly to wish text or is standard infrastructure maintenance.
