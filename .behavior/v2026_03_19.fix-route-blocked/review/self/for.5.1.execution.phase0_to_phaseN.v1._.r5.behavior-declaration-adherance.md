# self-review r5: behavior-declaration-adherance

review for adherance to the behavior declaration.

---

## files changed in this pr

checked `git diff main --name-only`:

1. `src/domain.operations/route/stepRouteDrive.ts`
2. `src/domain.operations/route/stepRouteDrive.test.ts`
3. `src/domain.roles/driver/skills/route.stone.set.sh`
4. `src/domain.roles/driver/boot.yml`

---

## file-by-file adherance check

### 1. stepRouteDrive.ts

**change made:** added tea pause section in formatRouteDrive function

**vision check:**
- vision says: "tea pause appears at TOP after count > N (same trigger as bottom message)"
- implementation: uses `if (input.suggestBlocked)` which is `count > 5`
- **adherant:** yes, same trigger

**criteria check:**
- usecase.1 says: "when count > N, tea pause section appears at TOP of output"
- implementation: tea pause inserted after header, before `🗿 route.drive`
- **adherant:** yes, appears at TOP

**blueprint check:**
- blueprint says: "insert after line 409 (`lines.push('');`) and before line 412"
- implementation: exact location confirmed
- **adherant:** yes, exact match

**deviation check:** none found

---

### 2. stepRouteDrive.test.ts

**change made:** added [case7] tea pause tests

**vision check:**
- vision does not specify test requirements
- tests added to verify tea pause behavior
- **adherant:** n/a (bonus coverage)

**criteria check:**
- criteria usecase.1 specifies behavior to test
- test [t0] verifies count <= 5 does NOT show tea pause
- test [t1] verifies count > 5 shows tea pause with all options
- test [t2] captures snapshot
- **adherant:** yes, covers all criteria scenarios

**blueprint check:**
- blueprint specifies [case7] tea pause tests
- implementation matches specification
- **adherant:** yes, exact match

**deviation check:** none found

---

### 3. route.stone.set.sh

**change made:** updated skill header

**vision check:**
- vision says: "skill header documents all status options"
- implementation: documents arrived, passed, approved, blocked
- **adherant:** yes, all options documented

**criteria check:**
- usecase.2 says: "skill header documents --as arrived, --as passed, --as blocked options"
- implementation: includes all three plus --as approved
- **adherant:** yes, exceeds criteria (approved is valid extant status)

**blueprint check:**
- blueprint provides exact header text
- implementation matches blueprint
- **adherant:** yes, exact match

**deviation check:** none found

---

### 4. boot.yml

**change made:** added skills.say section

**vision check:**
- vision says: "boot.yml shows skill via `say`"
- implementation: `skills: say: - skills/route.stone.set.sh`
- **adherant:** yes, exact match

**criteria check:**
- usecase.2 says: "route.stone.set skill header is shown" on boot
- implementation: skills.say causes header to be shown
- **adherant:** yes, satisfies criteria

**blueprint check:**
- blueprint shows exact yaml structure
- implementation matches blueprint
- **adherant:** yes, exact match

**deviation check:** none found

---

## cross-file consistency check

| requirement | stepRouteDrive.ts | test | route.stone.set.sh | boot.yml |
|-------------|-------------------|------|-------------------|----------|
| tea pause trigger | `suggestBlocked` | tests count > 5 | n/a | n/a |
| three options shown | arrivedCmd, passedCmd, blockedCmd | asserts all three | documents all | n/a |
| mandate text | exact match | asserts exact text | n/a | n/a |
| skill header | n/a | n/a | all options | says skill |

all files work together to fulfill the vision.

---

## potential junior mistakes checked

| risk | checked | result |
|------|---------|--------|
| wrong trigger condition | yes | correct: `suggestBlocked` |
| tea pause at wrong location | yes | correct: after header, before tree |
| three options with wrong commands | yes | correct: all use `input.stone` |
| mandate text differs from vision | yes | correct: exact match |
| skill header with wrong options | yes | correct: all four status values |
| boot.yml with wrong structure | yes | correct: skills.say format |

no junior mistakes found.

---

## summary

all four files adhere to the behavior declaration:
- vision requirements met
- criteria satisfied
- blueprint followed exactly
- no deviations found
- no junior mistakes found

