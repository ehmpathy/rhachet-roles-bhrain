# self-review: has-questioned-deletables

## question: can `guidanceList` be removed entirely?

**examination:**
the current type has `guidance: string`. the wish requires structured output with three alternatives. can we achieve this with just `guidance: string`?

**alternative approach:**
we could format the guidance as a multi-line string:
```typescript
guidance: `as a driver, you should:
   ├─ \`--as passed\` = signal work complete, proceed
   ├─ \`--as arrived\` = signal work complete, request review
   └─ \`--as blocked\` = escalate if stuck

   the human will run \`--as approved\` when ready.`
```

**verdict:** YES — we can simplify.

the `guidanceList` type change is unnecessary. the current `guidance: string` field can hold the full formatted guidance. the formatter can remain unchanged — it already renders `guidance` as a tree leaf.

**fix applied:**
remove the `guidanceList` type change from the blueprint. the implementation becomes:
1. update `setStoneAsApproved.ts` to pass a multi-line `guidance` string
2. no type change needed in `formatRouteStoneEmit.ts`

---

## question: can the owl header constant be removed?

**examination:**
the blueprint proposes to add `const HEADER_BLOCKED = '🦉 patience, friend.'`. is this needed?

**current behavior:**
the `action: 'blocked'` branch uses `HEADER_SET`:
```typescript
const header = input.operation === 'route.stone.get' ? HEADER_GET : HEADER_SET;
```

so blocked actions show "🦉 the way speaks for itself" — not ideal for a blocked error.

**verdict:** KEEP — the header constant adds value.

the distinction matters: "the way speaks for itself" is for success, "patience, friend" is for blocked guidance. different emotional context.

however, we can simplify with an inline header rather than a constant if it's only used once.

---

## question: can we delete any test cases?

**examination:**
the blueprint adds a new test case `[case6]` for blocked action with structured guidance. can we extend an extant case instead?

**verdict:** YES — extend [case3] in `setStoneAsApproved.test.ts` instead of new test file cases.

the tests are already well-structured. we extend the extant assertions rather than add parallel cases.

---

## simplified blueprint

after deletion pass:
1. **NO type change** — use `guidance: string` as-is
2. **NO new constant** — use header inline in blocked branch
3. **extend extant tests** — no new test cases, just more assertions

the implementation becomes simpler:
- `setStoneAsApproved.ts`: update guidance string content
- `formatRouteStoneEmit.ts`: add header override for blocked action
- tests: extend assertions only

---

## fixes applied to blueprint

the blueprint at `3.3.1.blueprint.product.v1.i1.md` has been updated:

1. **type changes section**: changed from `guidanceList` proposal to "none required"
2. **codepath tree for formatRouteStoneEmit**: removed `[+] lines.push guidanceList` and `[+] lines.push humanNote`, replaced with `[~] header = '🦉 patience, friend.'` and retained guidance line
3. **codepath tree for setStoneAsApproved**: changed `[~] guidance → guidanceList` to `[~] guidance: multi-line string`
4. **filediff tree comments**: updated to reflect simpler scope
5. **implementation order**: reordered to reflect simpler flow
6. **test coverage**: changed formatRouteStoneEmit from `[+] given '[case6]...'` to `[~] extend extant blocked action case`

---

## updated filediff tree

```
src/
├─ domain.operations/
│  └─ route/
│     ├─ [~] formatRouteStoneEmit.ts                    # add header for blocked
│     └─ stones/
│        └─ [~] setStoneAsApproved.ts                   # enhance guidance string
│
├─ domain.roles/
│  └─ driver/
│     ├─ [~] boot.yml                                   # add say section
│     └─ briefs/
│        └─ [+] howto.drive-routes.[guide].md           # new brief for drivers
```

tests: extend assertions in extant files only.
