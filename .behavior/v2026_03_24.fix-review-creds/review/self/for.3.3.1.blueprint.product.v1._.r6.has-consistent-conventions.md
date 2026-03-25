# self-review: has-consistent-conventions (r6)

## stone: 3.3.1.blueprint.product.v1

---

## r6: deeper convention review

took a breath. re-read the blueprint line by line. questioned each name choice.

---

## the blueprint introduces these names

1. `getXaiCredsFromKeyrack` — function name
2. `credentials/` — new directory
3. `keyrack.yml` — role manifest file
4. `isXaiBrain` — boolean variable
5. `supplier` — context variable
6. `keyrackResult` — operation result
7. error message text and format

---

## name 1: getXaiCredsFromKeyrack

### current choice

`getXaiCredsFromKeyrack`

### decomposition

| part | convention | source |
|------|------------|--------|
| `get` | verb prefix | extant: `getSavepoint`, `getReflectScope` |
| `Xai` | provider name | domain term from rhachet-brains-xai |
| `Creds` | short for credentials | **question: is this the extant term?** |
| `From` | source indicator | extant: `enumFilesFromGlob` (50+ usages) |
| `Keyrack` | source system | domain term from rhachet |

### investigation: "Creds" vs alternatives

**search performed**:
```bash
grep -ri 'creds\|credentials\|apikey' src/
```

**results**:
- no extant usage of "creds" or "credentials" in src/
- `XAI_API_KEY` is used as an envvar name (per research)

**analysis**: since this codebase has no extant credential terminology, "Creds" is a reasonable choice. it's concise and unambiguous.

**alternative considered**: `getXaiApiKeyFromKeyrack`

| option | pros | cons |
|--------|------|------|
| `getXaiCredsFromKeyrack` | generic (could add more keys later) | introduces new term |
| `getXaiApiKeyFromKeyrack` | specific to current need | hardcodes single key |

**verdict**: `getXaiCredsFromKeyrack` is better because:
1. the supplier pattern expects `creds` (not `apiKey`)
2. keyrack could supply multiple keys in future
3. the function returns a supplier, not just a raw key

---

## name 2: credentials/ directory

### current choice

`src/domain.operations/credentials/`

### investigation: directory structure

**extant pattern**:
```
src/domain.operations/
├── artifact/      # artifact operations
├── git/           # git operations
├── hooks/         # hook operations
├── reflect/       # reflect operations
├── research/      # research operations
├── review/        # review operations
└── route/         # route operations
```

**analysis**: each subdirectory groups operations by domain area. `credentials/` fits this pattern — it groups credential operations.

**alternative considered**: put `getXaiCredsFromKeyrack` in `review/` since it's used by review skill.

**verdict**: `credentials/` is better because:
1. credentials could be used by multiple skills (review, reflect, research)
2. separation of concerns: review is the consumer, credentials is the provider
3. consistent with bounded-context principle

---

## name 3: keyrack.yml

### current choice

`src/domain.roles/reviewer/keyrack.yml`

### investigation: role manifest conventions

**search performed**: checked rhachet docs and getMechanicRole research.

**extant pattern** (from rhachet):
```
domain.roles/<role>/
├── skills/
├── briefs/
└── keyrack.yml    # keyrack manifest (per rhachet convention)
```

**verdict**: `keyrack.yml` follows rhachet convention exactly.

---

## name 4: isXaiBrain

### current choice

```typescript
const isXaiBrain = (options.brain ?? DEFAULT_BRAIN).startsWith('xai/');
```

### investigation: boolean conventions

**extant patterns**:
```bash
grep 'const is[A-Z]' src/**/*.ts | head -20
```

**examples found**:
- no boolean `is*` variables in domain.operations (most logic is extracted to functions)

**analysis**: while no extant `is*` variables exist, the convention is standard TypeScript. the name clearly indicates a boolean check.

**alternative considered**: extract to function `isXaiBrainSlug(slug: string): boolean`

**verdict**: inline is appropriate because:
1. it's a one-liner (prefix check)
2. it's used exactly once
3. extraction would be premature abstraction

---

## name 5: supplier

### current choice

```typescript
let supplier: { 'brain.supplier.xai': BrainSuppliesXai } | undefined;
```

### investigation: context variable conventions

**extant pattern** (genContextBrain signature):
```typescript
genContextBrain({ choice, supplier? })
```

**verdict**: `supplier` matches the parameter name in the function we call. consistent.

---

## name 6: keyrackResult

### current choice

```typescript
const keyrackResult = await getXaiCredsFromKeyrack();
supplier = keyrackResult.supplier;
```

### investigation: result variable conventions

**extant patterns**:
```bash
grep 'Result = await' src/**/*.ts | head -10
```

**examples**: mixed patterns — some use `*Result`, some destructure directly.

**analysis**: `keyrackResult` is clear. could also destructure:
```typescript
const { supplier } = await getXaiCredsFromKeyrack();
```

**verdict**: either is fine. current choice is explicit about what we get back. no convention violation.

---

## name 7: error message text

### current choice

```
🦉 patience, friend

✋ keyrack is locked
   ├─ owner: ehmpath
   └─ run: rhx keyrack unlock --owner ehmpath --prikey ~/.ssh/ehmpath --env all
```

### investigation: error message conventions

**extant pattern** (route.ts):
```
🦉 patience, friend

🗿 route.bounce
   ├─ blocked
   │  ├─ artifact = ...
   │  └─ guard = ...
```

### comparison

| aspect | route.ts | blueprint |
|--------|----------|-----------|
| opener | `🦉 patience, friend` | `🦉 patience, friend` |
| icon | `🗿` (stone) | `✋` (stop hand) |
| tree | `├─`, `└─`, `│` | `├─`, `└─` |
| content | route-specific | keyrack-specific |

**analysis**: the `✋` icon is new. is it appropriate?

**context**: `🗿` represents route stones. `✋` represents "stop, action required." different semantic, appropriate for keyrack errors.

**verdict**: consistent with spirit. appropriate variation for context.

---

## summary: all names reviewed

| name | consistent? | evidence |
|------|-------------|----------|
| `getXaiCredsFromKeyrack` | yes | follows `get*From*` pattern |
| `credentials/` | yes | follows domain.operations/ structure |
| `keyrack.yml` | yes | follows rhachet role manifest convention |
| `isXaiBrain` | yes | standard boolean convention |
| `supplier` | yes | matches genContextBrain parameter |
| `keyrackResult` | yes | clear result variable |
| error message format | yes | consistent with route.ts vibe |

---

## open questions

none. all names follow extant conventions or add appropriate new terms.

---

## lesson learned

when a new domain term is added (like "Creds"), verify:
1. no extant term exists for the concept
2. the term aligns with external apis (supplier pattern expects `creds`)
3. the term is concise and unambiguous

---

## conclusion

all names and patterns in the blueprint are consistent with codebase conventions. no changes needed.

