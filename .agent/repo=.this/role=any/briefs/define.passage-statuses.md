# define.passage-statuses

## .what

passage.jsonl tracks stone state via status entries. only `'passed'` constitutes valid passage.

---

## the statuses

| status | what it represents | is passage? |
|--------|-------------------|-------------|
| `'passed'` | driver explicitly marked stone complete | **yes** |
| `'approved'` | human approved a guarded stone's review | no |
| `'blocked'` | stone is blocked, cannot proceed | no |
| `'rewound'` | stone needs re-review | no |

---

## why only 'passed'

### passage is a deliberate act

passage means: "I have reviewed this stone's work and I am satisfied. I consciously proceed."

this is not automatic. this is not implied. this is an explicit `--as passed` command.

---

## why 'approved' is not passage

**what 'approved' means:**
a human reviewed the guard artifacts and signed off. the human says "this looks good."

**why it's not passage:**
approval is permission, not action. approval is one gate in a multi-gate guard.

a guarded stone requires:
1. automated review (no blockers)
2. human approval (sign-off)
3. explicit passage (driver says done)

the guard flow:
```
review → judge (reviewed?) → approve → judge (approved?) → pass
```

approval grants permission to pass. it does not pass.

**analogy:**
a bouncer waves you into the club. you still have to walk through the door.
'approved' = bouncer waved. 'passed' = you walked through.

---

## why 'blocked' is not passage

**what 'blocked' means:**
the stone cannot proceed. a blocker was found.

**why it's not passage:**
self-evident. blocked is the opposite of passage.

**analogy:**
the road is closed. you cannot drive through.

---

## why 'rewound' is not passage

**what 'rewound' means:**
the stone was marked for re-review. the driver or system said "go back."

**why it's not passage:**
rewind explicitly revokes prior passage. the stone must be re-passed.

even if:
- the artifact exists
- prior work is present
- the stone was passed before

the rewind says: "that prior passage is void. review again."

**analogy:**
you drove through a checkpoint, but realized you forgot something. you turn around and must re-enter.

---

## why auto-pass was wrong

**what auto-pass did:**
```typescript
if (!passage && !stone.guard && outputs.length > 0) {
  passage = 'auto:unguarded';
}
```

if an unguarded stone had output artifacts, it auto-passed.

**why it's wrong:**
- existence is not review
- presence is not approval
- output is not passage

auto-pass bypassed deliberate review. it assumed "artifact exists = work is done."

but a stone could have:
- outdated artifacts from prior criteria
- artifacts that don't match current requirements
- artifacts that need fresh eyes after upstream changes

**the fix:**
remove auto-pass. require explicit `--as passed` for all stones.

---

## the principle

> passage requires intent.
> only explicit `--as passed` constitutes passage.
> all other statuses are state, not progress.
