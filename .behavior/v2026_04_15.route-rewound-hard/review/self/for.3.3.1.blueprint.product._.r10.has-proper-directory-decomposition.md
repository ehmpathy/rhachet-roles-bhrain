# self-review r10: has-proper-directory-decomposition

tea first. then we proceed 🍵

---

## what this review checks

files are placed in the correct layer and subdomain directories.

---

## blueprint filediff tree

```
src/
├── contract/
│   └── cli/
│       └── [~] route.ts
│
├── domain.operations/
│   └── route/
│       ├── [~] stepRouteStoneSet.ts
│       └── stones/
│           ├── [~] setStoneAsRewound.ts
│           └── [+] archiveStoneYield.ts

blackbox/
└── [+] driver.route.stone.set.yield.acceptance.test.ts
```

---

## layer analysis

### route.ts — contract/cli/

**file:** `src/contract/cli/route.ts`
**role:** parse --yield, --hard, --soft flags

**analysis:**
- CLI flag parse belongs in `contract/cli/`
- this is the public interface layer

**verdict:** ✅ correct layer

### stepRouteStoneSet.ts — domain.operations/route/

**file:** `src/domain.operations/route/stepRouteStoneSet.ts`
**role:** orchestrator, passes yield option to setStoneAsRewound

**analysis:**
- orchestrator belongs in `domain.operations/`
- `route/` subdomain matches function purpose

**verdict:** ✅ correct layer and subdomain

### setStoneAsRewound.ts — domain.operations/route/stones/

**file:** `src/domain.operations/route/stones/setStoneAsRewound.ts`
**role:** orchestrator, handles cascade and yield archival

**analysis:**
- orchestrator belongs in `domain.operations/`
- `route/stones/` subdomain matches function purpose
- extant file location, not a new choice

**verdict:** ✅ correct layer and subdomain

### archiveStoneYield.ts — domain.operations/route/stones/

**file:** `src/domain.operations/route/stones/archiveStoneYield.ts`
**role:** communicator, archives yield file to .route/.archive/

**question:** should this be in `access/` instead of `domain.operations/`?

**analysis:**
- `access/` contains third-party SDK wrappers (e.g., sdkOpenAi.ts)
- `domain.operations/` contains domain-specific file operations
- extant: `delStoneGuardArtifacts.ts` is in same location and does file i/o
- this function operates on route-specific paths, not generic file operations

**verdict:** ✅ follows extant pattern — domain-specific file ops in domain.operations/

### acceptance test — blackbox/

**file:** `blackbox/driver.route.stone.set.yield.acceptance.test.ts`
**role:** acceptance tests for CLI

**analysis:**
- acceptance tests belong in `blackbox/`
- file name follows `driver.route.*.acceptance.test.ts` pattern

**verdict:** ✅ correct location and name pattern

---

## subdomain structure

**extant structure:**
```
src/domain.operations/route/
├── stepRouteStoneSet.ts
├── stones/
│   ├── setStoneAsRewound.ts
│   ├── delStoneGuardArtifacts.ts
│   └── ... (other stone operations)
```

**blueprint structure:**
```
src/domain.operations/route/
├── stepRouteStoneSet.ts        # extend
├── stones/
│   ├── setStoneAsRewound.ts    # extend
│   └── archiveStoneYield.ts    # new
```

**analysis:**
- new file `archiveStoneYield.ts` placed in same subdirectory as related operations
- follows extant subdomain structure
- not flattened to root

**verdict:** ✅ follows extant subdomain structure

---

## test file decomposition

**extant test pattern:**
- unit/integration tests collocated with source files
- acceptance tests in `blackbox/` directory

**blueprint test files:**
```
src/domain.operations/route/stones/
├── setStoneAsRewound.test.ts        # extant, extend
├── archiveStoneYield.integration.test.ts  # new, collocated

blackbox/
└── driver.route.stone.set.yield.acceptance.test.ts  # new
```

**analysis:**
- `archiveStoneYield.integration.test.ts` collocated with source — ✅ correct
- acceptance test in `blackbox/` — ✅ correct
- test file names follow extant patterns

**verdict:** ✅ test files follow extant decomposition

---

## why access/ is not the right place

**question revisited:** should `archiveStoneYield` be in `access/`?

**access/ current contents:**
```
src/access/
└── sdk/
    └── sdkOpenAi.ts    # third-party SDK wrapper
```

**key distinction:**
- `access/` is for infrastructure that could be swapped (db, api, sdk)
- `archiveStoneYield` is domain-specific:
  - operates on `.route/.archive/` paths
  - knows about stone name conventions
  - specific to route rewind behavior

**if it were in access/:**
- would suggest it's a generic file archival service
- would imply it could be swapped for S3, cloud storage, etc.
- would lose domain context

**verdict:** ✅ domain.operations is correct — this is domain behavior, not infrastructure

---

## summary

| file | layer | subdomain | verdict |
|------|-------|-----------|---------|
| route.ts | contract/cli | n/a | ✅ |
| stepRouteStoneSet.ts | domain.operations | route | ✅ |
| setStoneAsRewound.ts | domain.operations | route/stones | ✅ |
| archiveStoneYield.ts | domain.operations | route/stones | ✅ |
| acceptance test | blackbox | n/a | ✅ |

all files placed in correct layers and subdomains. no directory decomposition issues found.

🦉 directory decomposition verified. so it is.

