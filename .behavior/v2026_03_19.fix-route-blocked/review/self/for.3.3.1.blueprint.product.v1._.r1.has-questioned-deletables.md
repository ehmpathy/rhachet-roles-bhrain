# self-review r1: has-questioned-deletables

question each component in the blueprint. can it be deleted?

---

## 1. tea pause section (formatRouteDrive)

**question**: can the tea pause be removed?

**verdict**: no — this IS the core feature. the wish explicitly requests visibility of the blocked option at the TOP. without it, drivers remain stuck in infinite loops.

**reason it holds**: drivers currently loop 20+ times before escalation. the tea pause interrupts this earlier (count > 5) with clear options.

---

## 2. mandate line ("to refuse is not an option")

**question**: can the mandate be removed?

**verdict**: no — the mandate is essential for the behavioral nudge. without it, drivers might dismiss the options as suggestions rather than requirements.

**reason it holds**: the vision explicitly states "the challenge makes clear: a choice is mandatory". soft suggestions fail; clear mandates succeed.

---

## 3. route.stone.set.sh header update

**question**: can we skip the header update?

**verdict**: no — the header is how drivers learn commands on boot. incomplete documentation leads to incomplete awareness.

**reason it holds**: drivers boot → see skill headers → learn what commands exist. if --as blocked is absent, drivers don't know it extant.

---

## 4. boot.yml skills.say section

**question**: can we skip the boot.yml change?

**verdict**: no — the boot.yml `say` directive is how skills appear on boot. without it, drivers must discover route.stone.set on their own.

**reason it holds**: mechanic role uses same pattern. drivers should see route.stone.set skill header on boot.

---

## 5. bottom command prompt (retained)

**question**: should we remove the bottom prompt since tea pause shows commands at top?

**verdict**: keep it — the bottom prompt serves a different purpose. it's positioned after the stone content, for easy copy when ready to act.

**reason it holds**: the vision acknowledges redundancy ("same three commands at top AND bottom") but accepts it for visibility. top catches attention; bottom enables action after read.

---

## 6. drum nudge (count >= 7)

**question**: should we remove drum nudge now that tea pause exists?

**verdict**: keep it — drum nudge serves a different purpose (philosophical reminder at 7+ hooks). tea pause is actionable (5+ hooks). they complement each other.

**reason it holds**: tea pause = "here are your options". drum nudge = "do your work, then step back". different messages, different timelines.

---

## 7. test case [case7]

**question**: can we skip the new test case?

**verdict**: no — test coverage is mandatory for behavior proof. the blueprint explicitly lists test coverage requirements.

**reason it holds**: without tests, we cannot verify the tea pause appears when expected.

---

## summary

| component | can delete? | reason |
|-----------|-------------|--------|
| tea pause section | no | core feature |
| mandate line | no | behavioral nudge |
| header update | no | boot-time awareness |
| boot.yml skills.say | no | skill visibility |
| bottom prompt | no | serves different purpose |
| drum nudge | no | complements tea pause |
| test case [case7] | no | behavior proof |

**conclusion**: all components are necessary. no deletions identified.

---

## simplification opportunity

**found**: the blueprint shows both "arrived" and "passed" options in the tea pause. this matches the vision.

**question**: could we simplify to just "passed" and "blocked"?

**verdict**: no — "arrived" is for guarded stones that need review. without it, drivers can't trigger the guard. all three options must remain.
