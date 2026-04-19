# self-review r2: has-questioned-deletables

tea first. then we proceed 🍵

---

## what this review checks

question whether each feature and component is truly needed. delete before optimize.

---

## feature traceability

### feature: `--yield drop|keep` flag

**traces to wish?** yes — line 3: "the ability to rewound --mode hard | soft"
**traces to criteria?** yes — blackbox criteria explicitly tests this flag

**verdict:** ✅ keep — explicitly requested

---

### feature: `--hard` alias

**traces to wish?** yes — line 7: "but --mode hard"
**traces to criteria?** yes — blackbox criteria tests `--hard` alias

**question:** is the alias necessary, or is `--yield drop` sufficient?

**analysis:**
- wish uses "hard" and "soft" terminology
- aliases match wisher's mental model
- no extra code complexity (just parseArgs boolean)

**verdict:** ✅ keep — matches wisher's language

---

### feature: `--soft` alias

**traces to wish?** yes — line 5: "soft should just do the current rewind"
**traces to criteria?** yes — blackbox criteria tests `--soft` alias

**question:** is `--soft` needed if it's the default behavior?

**analysis:**
- `--soft` makes the default explicit
- completes the `--hard`/`--soft` pair
- no user confusion about what default is
- minimal code (one boolean in parseArgs)

**verdict:** ✅ keep — completes the mental model

---

### feature: archive to `.route/.archive/`

**traces to wish?** yes — line 9: "should remove the yields"
**traces to criteria?** yes — criteria specifies archive location

**question:** why archive instead of delete?

**analysis:**
- archive is safer — can recover if needed
- follows pattern from delStoneGuardArtifacts (archives, doesn't delete)
- criteria explicitly says "archive" not "delete"

**verdict:** ✅ keep — safer, follows extant pattern

---

### feature: collision with timestamp suffix

**traces to wish?** no — not mentioned
**traces to criteria?** yes — criteria specifies collision behavior

**question:** is collision logic needed, or is overwrite acceptable?

**analysis:**
- if stone is rewound twice, prior archive would be lost on overwrite
- timestamp suffix preserves history
- follows pattern from delStoneGuardArtifacts
- minimal code (~5 lines)

**verdict:** ✅ keep — preserves history, low cost

---

### feature: cascade archival

**traces to wish?** yes — lines 21-25: "for all the stones that got rewound when hard mode"
**traces to criteria?** yes — criteria tests cascade archival

**verdict:** ✅ keep — explicitly requested

---

## component traceability

### component: archiveStoneYield.ts [CREATE]

**question:** can this be inlined into setStoneAsRewound?

**analysis:**
- archive logic is ~20 lines
- setStoneAsRewound is already ~50 lines
- separate function enables unit test
- follows single-responsibility pattern from delStoneGuardArtifacts

**verdict:** ✅ keep as separate — testable, follows extant pattern

---

### component: yieldOutcomes return type

**question:** is outcome per stone necessary?

**analysis:**
- enables output format to show `yield = archived | preserved | absent`
- enables tests to verify correct behavior per stone
- minimal overhead (array of objects)

**verdict:** ✅ keep — enables observability

---

### component: validation error messages (5 cases)

**question:** are all 5 error cases necessary?

| error | necessary? |
|-------|------------|
| `--hard` + `--soft` | yes — mutual exclusion |
| `--hard` + `--yield keep` | yes — contradiction |
| `--soft` + `--yield drop` | yes — contradiction |
| `--yield` + non-rewound | yes — scope limit |
| `--hard` + non-rewound | yes — scope limit |

**verdict:** ✅ keep all — each prevents a distinct user error

---

### component: driver.route.stone.set.yield.acceptance.test.ts [CREATE]

**question:** why new file instead of extend rewind-drive test?

**analysis:**
- dedicated file for yield feature = cleaner separation
- rewind-drive tests are focused on rewind + drive interaction
- new file can be self-contained
- follows pattern of feature-per-file tests

**verdict:** ✅ keep separate — cleaner organization

---

## deletables found

none. every feature traces to wish or criteria. every component serves a purpose.

---

## simplification opportunities

| component | simplification | rejected? |
|-----------|---------------|-----------|
| archive function | inline into setStoneAsRewound | yes — loses testability |
| collision logic | overwrite instead of timestamp | yes — loses history |
| `--soft` alias | remove, rely on default | yes — incomplete mental model |

all simplifications rejected for stated reasons.

---

## conclusion

zero deletable features or components found. each traces to requirements:

| item | traces to |
|------|-----------|
| `--yield drop\|keep` | wish line 3 |
| `--hard` alias | wish line 7 |
| `--soft` alias | wish line 5 |
| archive to `.route/.archive/` | criteria |
| collision timestamp | criteria |
| cascade archival | wish lines 21-25 |
| archiveStoneYield.ts | extant pattern |
| yieldOutcomes | observability |
| 5 error cases | user safety |
| new test file | organization |

the blueprint is minimal. none can be deleted without trace break.

🦉 zero deletables. so it is.

