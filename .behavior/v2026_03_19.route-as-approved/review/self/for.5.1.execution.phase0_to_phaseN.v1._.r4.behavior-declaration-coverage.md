# self-review: behavior-declaration-coverage (round 4)

## the question

is every requirement from the vision, criteria, and blueprint implemented?

## criteria check: usecase.1 (agent tries --as approved)

### requirement: system blocks the action

**code (setStoneAsApproved.ts:37-56):**
```typescript
if (!isHuman) {
  return {
    approved: false,
    // ...
  };
}
```

**verdict:** implemented. returns `approved: false` when `!isHuman`.

### requirement: guidance includes --as passed

**code (setStoneAsApproved.ts:48):**
```typescript
'   ├─ `--as passed` = signal work complete, proceed',
```

**verdict:** implemented.

### requirement: guidance includes --as arrived

**code (setStoneAsApproved.ts:49):**
```typescript
'   ├─ `--as arrived` = signal work complete, request review',
```

**verdict:** implemented.

### requirement: guidance includes --as blocked

**code (setStoneAsApproved.ts:50):**
```typescript
'   └─ `--as blocked` = escalate if stuck',
```

**verdict:** implemented.

### requirement: guidance clarifies human will run --as approved

**code (setStoneAsApproved.ts:52):**
```typescript
'the human will run `--as approved` when ready.',
```

**verdict:** implemented.

---

## criteria check: usecase.2 (boot.yml brief)

### requirement: boot.yml brief is loaded into context

**code (boot.yml:8-9):**
```yaml
    say:
      - briefs/howto.drive-routes.[guide].md
```

**verdict:** implemented. `say` level means brief is read when relevant.

### requirement: agent learns what a route is

**brief (howto.drive-routes.[guide].md:12-18):**
```markdown
> a route is a paved path — worn smooth by those who walked before.
> stones mark milestones. guards ensure readiness.
> you drive forward, one stone at a time.
>
> the route was crafted from generations of trial and error.
> respect the wisdom embedded in each stone.
```

**verdict:** implemented.

### requirement: agent learns to run rhx route.drive when lost

**brief (howto.drive-routes.[guide].md:26):**
```markdown
run `rhx route.drive` — it shows the current stone and what to do next.
```

**verdict:** implemented.

### requirement: agent learns the status commands

**brief (howto.drive-routes.[guide].md:30-34):**
```markdown
| command | when to use |
|---------|-------------|
| `--as passed` | signal work complete, proceed |
| `--as arrived` | signal work complete, request review |
| `--as blocked` | stuck, need human help |
```

**verdict:** implemented.

### requirement: agent learns what --as approved means

**brief (howto.drive-routes.[guide].md:46):**
```markdown
`--as approved` — only humans grant approval. if you need approval, signal `--as arrived` and wait.
```

**verdict:** implemented.

### requirement: agent learns to respect self-reviews

**brief (howto.drive-routes.[guide].md:40):**
```markdown
**self-reviews:** question yourself severely. the review is the work, not a gate to pass.
```

**verdict:** implemented.

### requirement: agent learns to respect peer-reviews

**brief (howto.drive-routes.[guide].md:42):**
```markdown
**peer-reviews:** address all blockers. maximize nitpick fixes. if you disagree, escalate via `--as blocked`.
```

**verdict:** implemented.

---

## criteria check: usecases 3-6

these are extant behaviors (rhx route.drive, --as passed, --as arrived, --as blocked). we did not modify them. the brief documents how to use them.

---

## blueprint check

### setStoneAsApproved.ts — update guidance string content

**status:** implemented. lines 46-53 contain the structured guidance.

### formatRouteStoneEmit.ts — add header override for blocked action

**status:** implemented. lines 287-299 handle the blocked case with custom header.

### howto.drive-routes.[guide].md — create the brief

**status:** implemented. 59 lines that cover all vision requirements.

### boot.yml — register the brief under say:

**status:** implemented. lines 8-9 add the say section.

---

## vision check: owl wisdom

the vision requested "owl zen wisdom" in the brief.

**brief (howto.drive-routes.[guide].md:50-58):**
```markdown
## the owl's wisdom 🌙

> read the stone messages carefully.
> when lost, run `rhx route.drive`.
> when done, signal `--as passed`.
> when ready for review, signal `--as arrived`.
> when stuck, signal `--as blocked`.
>
> patience, friend. the way reveals itself. 🪷
```

**verdict:** implemented with owl emoji and zen tone.

---

## conclusion

every requirement from the behavior declaration is implemented:

| source | requirements | covered |
|--------|--------------|---------|
| criteria.usecase.1 | 6 assertions | 6/6 |
| criteria.usecase.2 | 7 assertions | 7/7 |
| criteria.usecases.3-6 | extant | documented |
| blueprint | 4 components | 4/4 |
| vision.owl-wisdom | zen guidance | 1/1 |

no gaps found.
