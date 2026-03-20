# self-review r1: has-questioned-assumptions

question each technical assumption in the blueprint.

---

## assumption 1: count > 5 is the right threshold

**what we assume**: the tea pause should appear when `state.count > 5` (same as suggestBlocked trigger).

**evidence**: checked `stepRouteDrive.ts:191` — the extant `suggestBlocked: state.count > 5` trigger is already used for the bottom blocked option. reuse of this threshold ensures consistency.

**could opposite be true?**: if we use a different threshold:
- lower (e.g., 2): too aggressive, shows tea pause too early
- higher (e.g., 10): defeats purpose, drivers already frustrated

**verdict**: assumption holds. reuse extant threshold for consistency.

---

## assumption 2: tea pause should appear BEFORE stone content

**what we assume**: insert tea pause after `🦉 where were we?` header and before `🗿 route.drive`.

**evidence**: the vision explicitly states "front-and-center, not buried at the bottom". the wish says "at the top, before the stone head".

**could simpler approach work?**: we could append to the bottom instead. but the whole point is visibility — top placement is intentional.

**verdict**: assumption holds. placement matches wish and vision.

---

## assumption 3: boot.yml supports skills.say directive

**what we assume**: the driver boot.yml can add a `skills: say:` section to show route.stone.set.sh on boot.

**evidence**: checked mechanic's boot.yml at lines 36-54 — uses exact same pattern. rhachet supports `skills: say:` for skill header exposure.

**verdict**: assumption verified. pattern works.

---

## assumption 4: route.stone.set.sh is the right skill to expose

**what we assume**: drivers need to see route.stone.set on boot to learn --as blocked option.

**could opposite be true?**: if drivers don't boot with this role, they won't see it. but the wish specifically targets drivers who boot → drive routes.

**verdict**: assumption holds. driver role boots → should see route commands.

---

## assumption 5: all three options are needed in tea pause

**what we assume**: tea pause must show arrived, passed, AND blocked.

**evidence**: the vision's example output shows all three. the criteria (usecase.1) states "tea pause shows all three options".

**could simpler work?**: we could show only "passed" and "blocked". but "arrived" is needed for guarded stones that require review.

**verdict**: assumption holds. all three options serve different purposes.

---

## assumption 6: tree format will render correctly

**what we assume**: the tree characters (├─, └─, │) will render in the output.

**evidence**: the vision notes "tree format chosen over ASCII box (proven to render, consistent with extant output)". checked `formatRouteDrive` — it already uses tree format throughout.

**verdict**: assumption verified. tree format is extant pattern.

---

## assumption 7: no changes needed to getDriverRole.ts

**what we assume**: the onBoot hook already runs route.drive, so no changes needed there.

**evidence**: checked `getDriverRole.ts:22-27` — onBoot runs `route.drive --mode hook`. this is correct. skill awareness comes from boot.yml say, not onBoot command.

**verdict**: assumption verified. no changes needed.

---

## summary

| assumption | verified? | method |
|------------|-----------|--------|
| count > 5 threshold | yes | code check |
| top placement | yes | wish/vision check |
| boot.yml supports skills.say | yes | mechanic boot.yml check |
| route.stone.set is right skill | yes | wish intent check |
| all three options needed | yes | criteria check |
| tree format renders | yes | extant code check |
| no getDriverRole changes | yes | code check |

**conclusion**: all assumptions verified. no hidden issues found.
