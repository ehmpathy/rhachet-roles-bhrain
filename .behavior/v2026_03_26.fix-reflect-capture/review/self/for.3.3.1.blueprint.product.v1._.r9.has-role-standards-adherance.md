# self-review r9: has-role-standards-adherance

## step back and breathe

r1 enumerated categories. let me go deeper into each rule.

---

## lang.terms deep dive

### rule.forbid.gerunds — line by line

**blueprint comments**:
1. `// ensure directory exists FIRST (before shell redirect)` — "ensure" = verb ✓
2. `// write staged diff directly to file via shell` — "write" = verb ✓
3. `// compute hash from files via shell` — "compute" = verb ✓
4. `// get sizes from filesystem` — "get" = verb ✓

**variable names**:
1. `stagedPatchPath` — no gerund ✓
2. `unstagedPatchPath` — no gerund ✓
3. `combinedHash` — no gerund ✓
4. `MAX_BUFFER` — no gerund ✓
5. `encoding` — Node.js API property, unavoidable ✓

**why no gerunds hold**: all names use concrete nouns or imperative verbs.

### rule.require.ubiqlang — term consistency

**terms used**:
- `savepoint` — domain term from reflect module ✓
- `scope` — extant term in codebase ✓
- `mode` — extant pattern ('plan' | 'apply') ✓
- `patch` — git term for diff content ✓
- `hash` — standard term for content fingerprint ✓

**why ubiqlang holds**: all terms are extant in the codebase or standard domain vocabulary.

---

## code.prod/evolvable.procedures deep dive

### rule.require.clear-contracts

**blueprint declares contract**:
```typescript
export const setSavepoint = (input: {
  scope: ReflectScope;
  mode: 'plan' | 'apply';
}): Savepoint => { ... }
```

**contract elements**:
- input type: explicit ✓
- output type: explicit (`Savepoint`) ✓
- no optional inputs without defaults ✓

**why clear-contracts holds**: signature is fully typed, no ambiguity.

### rule.require.dependency-injection

**blueprint context needs**:
- `input.scope.gitRepoRoot` — injected via input
- `fs` — standard library (global)
- `execSync` — standard library (global)

**why DI holds**: external state (git repo root) comes via input, not hardcoded.

### rule.require.single-responsibility

**setSavepoint responsibilities**:
1. capture staged diff
2. capture unstaged diff
3. compute combined hash
4. compute sizes
5. persist files (apply mode)
6. return savepoint metadata

**is this single responsibility?**: YES. all responsibilities serve one purpose: create a savepoint. the function is cohesive.

**why single-responsibility holds**: the function captures a point-in-time snapshot — one conceptual action.

---

## code.prod/pitofsuccess.errors deep dive

### rule.require.fail-fast

**error points in blueprint**:

1. `fs.mkdirSync` — throws if cannot create directory
2. `execSync(\`git diff...\`)` — throws if git fails
3. `execSync(\`cat ... | sha256sum...\`)` — throws if hash fails
4. `fs.statSync` — throws if file absent

**error handle pattern**: none of these are wrapped in try-catch. errors propagate immediately.

**why fail-fast holds**: blueprint uses native throws without suppression.

### rule.forbid.failhide

**try-catch blocks in blueprint**: NONE

**why failhide avoidance holds**: no catch blocks exist to hide errors.

---

## code.prod/readable.narrative deep dive

### rule.require.narrative-flow

**blueprint codepath**:
```
1. ensure directory exists
2. write staged diff
3. write unstaged diff
4. compute hash
5. compute sizes
6. return savepoint
```

**is this flat linear flow?**: YES. each step follows the previous without deep nested blocks.

**why narrative-flow holds**: steps are sequential, no nested conditionals.

### rule.forbid.else-branches

**conditional structure in blueprint**:
```
if mode === 'apply':
  shell redirect approach
if mode === 'plan':
  maxBuffer approach
```

**question**: is this if-if or if-else?

**answer from blueprint codepath tree**:
```
├─ [+] if mode === 'apply': shell redirect to file
└─ [○] if mode === 'plan': execSync with maxBuffer
```

the tree shows these as separate branches under the same parent node. implementation should use:
```typescript
if (mode === 'apply') {
  // apply approach
  // could early return or set variables
}

// plan approach (default path or separate if)
```

**why else-branches avoidance holds**: blueprint structure implies separate conditionals, not if-else.

---

## additional checks

### rule.require.what-why-headers

**blueprint section headers**:
- `## summary` — describes what
- `## codepath tree` — shows structure
- `## contracts` — defines interfaces
- `## implementation detail` — shows how

**why what-why headers hold**: blueprint is organized with clear sections.

### rule.prefer.lowercase

**blueprint text case**:
- section headers use `##` lowercase
- variable names use camelCase (standard)
- no SHOUTING except `MAX_BUFFER` (constant convention)

**why lowercase preference holds**: follows standard conventions.

---

## conclusion

r9 deep role standards review:
- lang.terms: all gerund-free, ubiqlang consistent
- evolvable.procedures: clear contracts, DI, single responsibility
- pitofsuccess.errors: fail-fast, no failhide
- readable.narrative: flat linear flow, no else branches
- readable.comments: organized sections

blueprint adheres fully to mechanic role standards.
