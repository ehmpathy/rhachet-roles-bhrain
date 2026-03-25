# self-review: has-consistent-conventions (r4)

## stone: 5.1.execution.phase0_to_phaseN.v1

---

## fourth pass — deeper scrutiny

stepped away. came back. asked: what conventions did i gloss over?

---

## re-examination: "Creds" vs "credentials"

**what we wrote:**
- function: `getXaiCredsFromKeyrack`
- folder: `credentials/`
- comment: `// fetch xai credentials from keyrack`

**observed inconsistency:**
- function uses abbreviation `Creds`
- folder uses full word `credentials`
- comment uses full word `credentials`

**is this a problem?**

searched codebase for patterns:

| location | term used |
|----------|-----------|
| `backupSnapshots.ts` | "aws credentials" in comments |
| `backupSnapshots.ts` | "credentials" in error message |
| `rhachet-brains-xai` | `creds` in type name (`BrainSuppliesXai.creds`) |

the xai brain sdk uses `creds` (abbreviated). we inherit that term in our return type:
```typescript
supplier: { 'brain.supplier.xai': { creds: async () => ... } }
```

**verdict:**
- `Creds` in function name aligns with xai sdk (`creds` property)
- `credentials` in folder/comments is more readable for humans
- this is not an inconsistency — it's intentional: sdk-aligned abbreviation in code, readable word in prose

---

## re-examination: folder name "credentials" vs specific domain

**what we wrote:** `domain.operations/credentials/`

**r3 said:** follows `domain.operations/{domain}/` pattern.

**r4 asks:** but is "credentials" the right domain noun?

**alternatives considered:**
- `domain.operations/keyrack/` — too implementation-specific
- `domain.operations/auth/` — too broad
- `domain.operations/secrets/` — less accurate
- `domain.operations/credentials/` — describes what we fetch

**verdict:** `credentials` is the right domain noun. it describes the category of what we retrieve, not the mechanism (keyrack) we use.

---

## re-examination: function name semantics

**what we wrote:** `getXaiCredsFromKeyrack`

**r3 said:** follows `get*` pattern.

**r4 asks:** does the "From" suffix match extant patterns?

**searched for "From" in function names:**

| function | pattern |
|----------|---------|
| `getTranscriptSource` | no "From" |
| `getResearchBind` | no "From" |
| `getRouteBind` | no "From" |

**observation:** no extant functions use "From" suffix.

**why did we use it?**

to indicate the source: keyrack. alternatives:
- `getXaiCreds` — vague, doesn't indicate source
- `getXaiCredsViaKeyrack` — "Via" is unusual
- `getXaiCredsFromKeyrack` — "From" clarifies source

**is "From" a divergence?**

yes, technically. but it serves clarity. the function's purpose IS to get credentials FROM a specific source (keyrack).

**verdict:** "From" is a small divergence that improves clarity. acceptable trade-off. not worth a refactor to remove.

---

## re-examination: comment style

**what we wrote:**
```typescript
// fetch xai credentials from keyrack if xai brain selected
const isXaiBrain = options.brain.startsWith('xai/');
```

**extant patterns in review.ts:**

```typescript
// parse cli args (adapts for node -e mode)
const options = parseArgs(process.argv);
```

**observation:** our comment follows same style:
- single-line `//` comment
- describes what the next block does
- lowercase, no period

**verdict:** consistent with extant comment style.

---

## re-examination: keyrack.yml location

**what we wrote:** `src/domain.roles/reviewer/keyrack.yml`

**extant role structure:**

```
src/domain.roles/
├─ reviewer/
│  ├─ briefs/
│  ├─ skills/
│  └─ keyrack.yml  <-- our addition
```

**is keyrack.yml a standard location?**

checked rhachet-roles-ehmpathy:
- mechanic role has `keyrack.yml` at role root

**verdict:** consistent with keyrack manifest placement convention.

---

## final assessment (r4)

| convention | r3 verdict | r4 deeper look | final |
|------------|------------|----------------|-------|
| "Creds" vs "credentials" | not checked | intentional: sdk-aligned | consistent |
| folder name | consistent | right domain noun | consistent |
| "From" suffix | not checked | diverges but improves clarity | acceptable |
| comment style | not checked | matches extant | consistent |
| keyrack.yml location | consistent | matches mechanic role | consistent |

**divergences found:**
- `From` suffix in function name (not seen elsewhere)

**why the divergence is acceptable:**
- improves clarity about credential source
- no extant "credential fetch from X" functions to compare against
- not a name convention rule violation, just a new pattern

**changes needed:** none. the divergence is minor and justified.

