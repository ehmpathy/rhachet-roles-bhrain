# self-review r2: has-questioned-assumptions (deeper pass)

question technical assumptions with fresh eyes. what did r1 miss?

---

## re-examined: the insertion point

**r1 said**: insert tea pause after `🦉 where were we?` and before `🗿 route.drive`.

**fresh question**: what happens to the blank line between header and route.drive tree?

**investigation**: looked at lines 407-412 in stepRouteDrive.ts:
```typescript
// header
lines.push(`🦉 where were we?`);
lines.push('');  // <-- blank line here

// route.drive tree
lines.push(`🗿 route.drive`);
```

**issue found**: the blueprint shows tea pause after the blank line, but the code pattern shows the blank line is part of header format. if we insert tea pause, we need to add another blank line after tea pause for visual separation.

**fix applied to blueprint**: the code snippet in the blueprint already includes `lines.push('');` at the end of the tea pause block. verified this is correct.

**verdict**: assumption holds after fix verification.

---

## re-examined: direct mode vs hook mode

**r1 missed**: does tea pause appear in direct mode or only hook mode?

**investigation**: checked the code flow:
- direct mode calls `formatRouteDrive` with `suggestBlocked: false` (line 208-210)
- hook mode calls `formatRouteDrive` with `suggestBlocked: state.count > 5` (line 186-192)

**clarification needed**: tea pause should ONLY appear in hook mode (when count > 5). the blueprint correctly uses `suggestBlocked` conditional, which only triggers in hook mode.

**verdict**: assumption is correct. tea pause only in hook mode.

---

## re-examined: snapshot test updates

**r1 said**: snapshot tests will update.

**fresh question**: which snapshots will change, and do we need new ones?

**investigation**: checked stepRouteDrive.test.ts cases:
- [case4] vibecheck snapshots — uses `route.simple` fixture, direct mode → no tea pause
- [case6] drum nudge — triggers at count >= 7 → WILL show tea pause too (count > 5)

**issue found**: the drum nudge snapshot ([case6] t2) will now include BOTH drum nudge AND tea pause, since tea pause triggers at count > 5 and drum nudge at count >= 7.

**verdict**: this is correct behavior. snapshots will reflect both features when count >= 7. the test case [case7] for tea pause specifically tests the tea pause in isolation (count 6).

---

## re-examined: articulation requirement for --as blocked

**r1 missed**: the vision mentions "require articulation file before `--as blocked` proceeds".

**fresh question**: does the blueprint address this requirement?

**investigation**: the blueprint only covers tea pause visibility, skill header, and boot.yml. the articulation requirement is EXTANT behavior in route.stone.set, not new work to implement.

**verification**: checked route.stone.set documentation in vision — confirms this is extant behavior ("blocker articulation file at `<route>/.route/blocker/<stone>.md`").

**verdict**: assumption correct. articulation is extant, not new work.

---

## re-examined: the mandate text

**r1 accepted**: "to refuse is not an option" as the mandate.

**fresh question**: is this the exact text from the vision?

**investigation**: checked 1.vision.md line 27-28:
```
└─ ⚠️ to refuse is not an option.
   work on the stone, or mark your status.
```

**verdict**: blueprint matches vision exactly.

---

## re-examined: boot.yml indentation

**r1 said**: add `skills: say:` section.

**fresh question**: is the YAML indentation correct in the blueprint?

**investigation**: compared with mechanic boot.yml structure:
```yaml
always:
  briefs:
    ref:
      - ...
  skills:
    say:
      - ...
```

**verdict**: blueprint indentation matches extant pattern. correct.

---

## summary of r2 review

| assumption | r1 status | r2 discovery |
|------------|-----------|--------------|
| insertion point | verified | blank line handle verified |
| direct vs hook mode | missed | clarified: hook mode only |
| snapshot updates | mentioned | clarified: drum nudge + tea pause overlap |
| articulation requirement | missed | clarified: extant behavior |
| mandate text | verified | exact match confirmed |
| boot.yml indentation | verified | matches mechanic pattern |

**conclusion**: no blocker issues found. blueprint is ready for execution.
