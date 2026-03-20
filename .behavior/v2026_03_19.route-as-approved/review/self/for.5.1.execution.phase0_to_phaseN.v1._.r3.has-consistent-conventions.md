# self-review: has-consistent-conventions

## the question

do we diverge from extant name conventions and patterns?

## name convention review

### 1. file names

**brief file:** `howto.drive-routes.[guide].md`

extant briefs in driver role:
- `im_a.bhrain_owl.md`
- `define.routes-are-gardened.[philosophy].md`
- `research.importance-of-focus.[philosophy].md`
- `howto.create-routes.[ref].md`

our file follows the `{prefix}.{topic}.[{type}].md` convention with:
- prefix: `howto`
- topic: `drive-routes`
- type: `guide`

**verdict:** consistent with extant convention.

### 2. variable names

**guidance string:**

```typescript
guidance: [
  'as a driver, you should:',
  // ...
].join('\n'),
```

the `guidance` field name matches the extant type definition in the emit interface.

**verdict:** consistent.

### 3. function names

no new functions were introduced. we extended extant functions:
- `setStoneAsApproved` — extant function, only changed return value content
- `formatRouteStoneEmit` — extant function, added conditional branch

**verdict:** consistent (no new names).

### 4. action names

we use `action: 'blocked'` which matches the extant action type:

```typescript
type RouteStoneSetAction =
  | 'passed'
  | 'approved'
  | 'promised'
  | 'blocked'  // extant
  | 'rewound'
  | 'challenge:absent'
  | 'challenge:first'
  | 'challenge:rushed'
```

**verdict:** consistent (used extant action type).

### 5. test case labels

```typescript
given('[case6] blocked action (agent tried to approve)', () => {
```

extant test cases use the same `[caseN]` prefix convention throughout the test files.

**verdict:** consistent.

### 6. boot.yml section names

```yaml
say:
  - briefs/howto.drive-routes.[guide].md
```

the `say` section name is an extant boot.yml level documented in the rhachet role system. the brief path follows the extant `briefs/` prefix convention.

**verdict:** consistent.

## conclusion

all names follow extant conventions. no new terms, prefixes, or patterns were introduced.
