# self-review r2: has-behavior-coverage

second pass: detailed comparison against wish and vision.

---

## re-read wish behaviors

from 0.wish.md (opened fresh):

1. "add a separate dedicated fallen-leaf challenge section at the top"
   - test: [case7] [t1] verifies tea pause at top

2. "say 'are you blocked? or have you decided not to try?'"
   - test: [case7] [t1] verifies tea pause text

3. "repeat the options: are you ready for review? are you ready to continue? are you blocked?"
   - test: [case7] [t1] asserts all three: arrivedCmd, passedCmd, blockedCmd

4. "make it clear that it must pick one or continue to work. its not an option to refuse."
   - test: [case7] [t1] asserts mandate: "to refuse is not an option"

5. "route.stone.set skill's skill header should make options super clear"
   - no runtime test needed: documentation change

6. "ensure boot.yml includes this skill as a 'say'"
   - test: getDriverRole.test.ts [case1] verifies all skills in boot.yml

---

## re-read vision behaviors

from 1.vision.md (opened fresh):

### outcome world section

| vision behavior | test coverage |
|-----------------|---------------|
| tea pause at TOP after count > N | [case7] [t1] with count: 6 |
| tea pause shows three options | [case7] [t1] asserts all three |
| mandate: "to refuse is not an option" | [case7] [t1] asserts text |
| skill header documents all --as options | documentation, no test |
| boot.yml shows skill via say | [case1] in getDriverRole.test.ts |

### user experience section

| usecase | test coverage |
|---------|---------------|
| driver runs route.drive | [case7] [t1], [t0] |
| driver sees tea pause | [case7] [t1] |
| driver marks status | extant route.stone.set tests |

---

## hostile reviewer check

**claim:** "boot.yml skills.say behavior is not tested"

**response:** getDriverRole.test.ts [case1] [t0] tests that every brief/skill in boot.yml extant in directory, and [t1] tests that all files in briefs/ are declared in boot.yml. the skills.say section is covered by this test.

**claim:** "tea pause text variations not tested"

**response:** [case7] [t2] captures snapshot which includes exact output format. any text changes would fail the snapshot.

---

## conclusion

all testable behaviors from wish and vision are covered:
- tea pause visibility: covered by [case7]
- boot.yml completeness: covered by [case1]
- snapshot for visual verification: covered by [t2]

behavior coverage is complete after second pass.

