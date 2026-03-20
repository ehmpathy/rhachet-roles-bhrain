# self-review r1: has-behavior-coverage

verify every behavior from wish/vision has a test.

---

## behaviors from 0.wish.md

| behavior | test? | test location |
|----------|-------|---------------|
| tea pause at top of route.drive | yes | [case7] [t1] |
| show all three options clearly | yes | [case7] [t1] asserts all three commands |
| mandate: "to refuse is not an option" | yes | [case7] [t1] asserts mandate text |
| update route.stone.set.sh header | unit test not needed | header is documentation |
| boot.yml skills.say | yes | getDriverRole.test.ts [case1] |

---

## behaviors from 1.vision.md

### user experience section

| behavior | test? | test location |
|----------|-------|---------------|
| arrived command works | implicit | extant route.stone.set tests |
| passed command works | implicit | extant route.stone.set tests |
| blocked command works | implicit | extant route.stone.set tests |

### outcome world section

| behavior | test? | test location |
|----------|-------|---------------|
| tea pause visible after count > 5 | yes | [case7] [t1] with count: 6 |
| tea pause absent at count <= 5 | yes | [case7] [t0] with count: 5 |
| three options shown | yes | [case7] [t1] asserts arrivedCmd, passedCmd, blockedCmd |
| mandate shown | yes | [case7] [t1] asserts mandate text |

---

## can I point to each test file?

| test file | behaviors covered |
|-----------|-------------------|
| stepRouteDrive.test.ts | tea pause visibility, options, mandate |
| getDriverRole.test.ts | boot.yml briefs/skills declaration |

---

## conclusion

every testable behavior has a test:
- tea pause visibility: [case7] [t0], [t1], [t2]
- boot.yml completeness: [case1]
- snapshot for visual verification: [case7] [t2]

behaviors not tested (documentation changes):
- route.stone.set.sh header: documentation only, no runtime behavior

behavior coverage is complete.

