# self-review: has-critical-paths-frictionless (r2)

## question

on second review: are there any hidden frictions?

## friction check

### potential friction points

| potential friction | present? |
|--------------------|----------|
| confusing error messages | no — messages include guidance |
| unexpected prompts | no — guard exits cleanly |
| performance delays | no — guard is fast (shell operation) |
| ambiguous outcomes | no — exit codes are clear (0/2) |

### error message quality

when blocked, the guard outputs:

```
🦉 to chase all paths, is to reach none. focus.

🗿 route.mutate guard
   ├─ route = .route/xyz
   ├─ path = .../.route/passage.jsonl
   ├─ access = blocked
   │
   └─ instead, run
      └─ rhx route.drive
```

this is:
- clear about what happened
- helpful with next steps
- consistent with other guard messages

### user journey smoothness

1. user runs `rhx declapract.upgrade init` → route created
2. user binds with `rhx route.bind.set` → bound successfully
3. user works on artifacts → writes succeed
4. user tries to modify metadata → blocked with guidance
5. user follows guidance → uses proper flow

no surprises, no friction.

## conclusion

no hidden frictions found. the path is smooth.
