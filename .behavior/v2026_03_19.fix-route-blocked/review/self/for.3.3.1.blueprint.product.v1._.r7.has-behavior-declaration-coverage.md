# self-review r7: has-behavior-declaration-coverage (deep pass)

r6 claimed full coverage. r7 verifies by extract and trace each requirement from vision and criteria.

---

## DEEP verification: vision summary (6 items)

### item 1: "add a tea pause section at the top of route.drive output (after count > N)"

**exact requirement**: tea pause at TOP, BEFORE stone content, when count > N

**blueprint trace**:
- blueprint summary line 10: "add tea pause section at TOP of route.drive output when `suggestBlocked: true`"
- blueprint line 81: "insert after line 409 (`lines.push('');`) and before line 412"
- blueprint code lines 85-104: full tea pause block

**verification**:
- TOP? → yes, before `🗿 route.drive`
- when count > N? → yes, `if (input.suggestBlocked)` which fires when count > 5

**r7 verdict**: ✅ FULLY covered

---

### item 2: "the section presents all three options: arrived, passed, blocked"

**exact requirement**: ALL THREE options visible

**blueprint trace**:
- blueprint lines 86-99 show all three:
  ```typescript
  lines.push(`   │  ├─ ready for review?`);
  lines.push(`   │  │  └─ ${arrivedCmd}`);  // arrived
  lines.push(`   │  ├─ ready to continue?`);
  lines.push(`   │  │  └─ ${passedCmd}`);   // passed
  lines.push(`   │  └─ blocked and need help?`);
  lines.push(`   │     └─ ${blockedCmd}`);  // blocked
  ```

**verification**:
- arrived? → yes, line 93
- passed? → yes, line 96
- blocked? → yes, line 99

**r7 verdict**: ✅ FULLY covered

---

### item 3: "the section makes clear: to refuse is not an option"

**exact requirement**: mandate text must appear

**blueprint trace**:
- blueprint lines 101-102:
  ```typescript
  lines.push(`   └─ ⚠️ to refuse is not an option.`);
  lines.push(`      work on the stone, or mark your status.`);
  ```

**verification**:
- exact phrase "to refuse is not an option" → yes, line 101

**r7 verdict**: ✅ FULLY covered

---

### item 4: "update route.stone.set.sh header to document all --as options"

**exact requirement**: header documents ALL --as options

**blueprint trace**:
- blueprint lines 107-134 show updated header:
  ```bash
  # options:
  #   --as      status: arrived | passed | approved | blocked (required)
  #             - arrived: "i'm here, review my work"
  #             - passed: "done, continue to next stone"
  #             - approved: "human approved" (requires human)
  #             - blocked: "stuck, escalate to human" (requires articulation)
  ```

**verification**:
- arrived documented? → yes, line 130
- passed documented? → yes, line 131
- approved documented? → yes, line 132
- blocked documented? → yes, line 133
- usage examples? → yes, lines 121-124

**r7 verdict**: ✅ FULLY covered

---

### item 5: "ensure Role.hooks.onBoot boots the route.stone.set skill"

**exact requirement**: onBoot awareness of route.stone.set

**research from r1 assumptions** (verified):
> "onBoot runs `route.drive --mode hook`. this is correct. skill awareness comes from boot.yml say, not onBoot command."

**blueprint trace**:
- blueprint section 3 adds boot.yml `skills.say` section
- this makes skill header visible on boot

**verification**:
- onBoot change needed? → no, route.drive already runs
- skill awareness achieved? → yes, via boot.yml say

**r7 verdict**: ✅ covered via boot.yml say (correct approach)

---

### item 6: "add route.stone.set to boot.yml as a say skill for startup awareness"

**exact requirement**: boot.yml must include skills.say with route.stone.set.sh

**blueprint trace**:
- blueprint lines 147-149:
  ```yaml
  skills:
    say:
      - skills/route.stone.set.sh
  ```

**verification**:
- skills section added? → yes
- say directive present? → yes
- correct skill path? → yes, `skills/route.stone.set.sh`

**r7 verdict**: ✅ FULLY covered

---

## DEEP verification: criteria usecases

### usecase.1 (route.drive output)

| criterion | blueprint location | exact line |
|-----------|-------------------|------------|
| tea pause at TOP | "insert after line 409" | line 81 |
| three options | arrivedCmd/passedCmd/blockedCmd | lines 86-99 |
| mandate | "to refuse is not an option" | line 101 |
| absent when count <= 5 | `if (input.suggestBlocked)` | line 85 |

**r7 verdict**: ✅ all criteria satisfied

### usecase.2 (boot awareness)

| criterion | blueprint location | exact line |
|-----------|-------------------|------------|
| skill header shown on boot | boot.yml skills.say | lines 147-149 |
| header documents options | header update | lines 127-133 |

**r7 verdict**: ✅ all criteria satisfied

### usecase.3 (route.stone.set behavior)

| criterion | blueprint coverage |
|-----------|-------------------|
| arrived marks stone | EXTANT behavior (no change) |
| passed marks stone | EXTANT behavior (no change) |
| blocked requires articulation | EXTANT behavior (no change) |

**r7 verdict**: ✅ criteria rely on extant behavior (correctly unchanged)

### usecase.4 (escape infinite loop)

| criterion | blueprint coverage |
|-----------|-------------------|
| tea pause shows blocked option | blueprint lines 97-99 |
| route halts when blocked | EXTANT behavior |

**r7 verdict**: ✅ criteria satisfied

---

## gaps analysis

**gaps found in r7**: NONE

every vision item has exact blueprint location.
every criterion has test assertion or relies on extant behavior.

---

## conclusion

r7 traced each requirement to exact blueprint line numbers:

| vision item | lines |
|-------------|-------|
| 1. tea pause at top | 81, 85-104 |
| 2. three options | 86-99 |
| 3. mandate | 101-102 |
| 4. header update | 107-134 |
| 5. onBoot via boot.yml | 137-150 |
| 6. boot.yml say | 147-149 |

**r7 verdict**: blueprint passes behavior declaration coverage. all requirements traced to exact implementation.
