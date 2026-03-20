# self-review r5: has-consistent-conventions

review for divergence from extant names and patterns.

---

## name conventions in blueprint

### 1. variable names for commands

**blueprint names**:
- `arrivedCmd`
- `passedCmd`
- `blockedCmd`

**extant names** (stepRouteDrive.ts lines 419-420, 450):
```typescript
const arrivedCmd = `rhx route.stone.set --stone ${input.stone} --as arrived`;
const passedCmd = `rhx route.stone.set --stone ${input.stone} --as passed`;
// ...
const blockedCmd = `rhx route.stone.set --stone ${input.stone} --as blocked`;
```

**comparison**: IDENTICAL. blueprint uses exact same `${status}Cmd` pattern as extant code.

**r5 verdict**: ✅ consistent with extant convention

---

### 2. emoji prefix for section headers

**blueprint names**:
- `🍵 tea first. then, choose your path.`

**extant names** (stepRouteDrive.ts):
- `🦉 where were we?` (line 408)
- `🗿 route.drive` (line 412)
- `🪘 walk the way` (line 378 in nudge)

**comparison**: all section headers use emoji + lowercase text. tea pause follows same pattern.

**r5 verdict**: ✅ consistent with extant emoji convention

---

### 3. tree characters

**blueprint uses**:
- `├─` for branches
- `└─` for last item
- `│` for continuation

**extant uses** (stepRouteDrive.ts lines 413-464):
- same characters throughout

**comparison**: IDENTICAL tree character set.

**r5 verdict**: ✅ consistent with extant tree convention

---

### 4. indentation levels

**blueprint tea pause**:
```
🍵 tea first. then, choose your path.
   │
   ├─ you must choose one
   │  ├─ ready for review?
   │  │  └─ ${arrivedCmd}
```

indent pattern: 3 spaces per level

**extant code** (stepRouteDrive.ts line 413):
```
   ├─ where do we go?
   │  ├─ route = ${input.route}
   │  └─ stone = ${input.stone}
```

indent pattern: 3 spaces per level

**comparison**: IDENTICAL 3-space indent levels.

**r5 verdict**: ✅ consistent with extant indent convention

---

### 5. function name convention

**blueprint does NOT introduce new functions**. tea pause is inline in `formatRouteDrive`.

**extant function names**:
- `formatRouteDrive` — format verb + noun
- `formatRouteDriveNudge` — format verb + compound noun

**r5 verdict**: ✅ no new functions, no name concern

---

### 6. test case name convention

**blueprint names**:
- `[case7] tea pause after 5+ hooks`
- `[t0] fewer than 6 hooks`
- `[t1] 6 or more hooks`
- `[t2] tea pause snapshot`

**extant names** (stepRouteDrive.test.ts):
- `[case4]`, `[case6]` — sequential case numbers
- `[t0]`, `[t1]`, `[t2]` — sequential test numbers

**comparison**: blueprint follows extant `[caseN]` and `[tN]` pattern.

**r5 verdict**: ✅ consistent with extant test convention

---

### 7. skill header comment style

**blueprint header**:
```bash
######################################################################
# .what = shell entrypoint for route.stone.set skill
#
# .why = mark stone status to progress through a route:
#        - arrived: ready for review (triggers guard)
```

**extant header** (route.stone.set.sh current):
```bash
######################################################################
# .what = shell entrypoint for route.stone.set skill
#
# .why = mark stone status to progress through a route
```

**comparison**: blueprint extends extant style with more detail. same `.what`, `.why` convention. same `#####` delimiter.

**r5 verdict**: ✅ consistent with extant header convention

---

### 8. boot.yml section names

**blueprint names**:
```yaml
always:
  briefs:
    ref:
  skills:
    say:
```

**extant names** (mechanic's boot.yml):
```yaml
always:
  briefs:
    ref:
  skills:
    say:
```

**comparison**: IDENTICAL section names.

**r5 verdict**: ✅ consistent with extant yaml convention

---

## new terms introduced

**blueprint introduces**:
- "tea pause" — new concept name

**does "tea pause" conflict with extant terms?**

search codebase for related terms:
- "drum nudge" — extant term for philosophical reminder
- "tea" — not used elsewhere in codebase
- "pause" — not used as a section name

**r5 verdict**: "tea pause" is a NEW term that doesn't conflict. it was introduced in the vision and approved by wisher.

---

## summary

| convention | blueprint | extant | verdict |
|------------|-----------|--------|---------|
| command vars | `${status}Cmd` | `${status}Cmd` | ✅ identical |
| emoji headers | `🍵 lowercase` | `🦉 lowercase` | ✅ consistent |
| tree chars | `├─ └─ │` | `├─ └─ │` | ✅ identical |
| indent | 3 spaces | 3 spaces | ✅ identical |
| test labels | `[caseN] [tN]` | `[caseN] [tN]` | ✅ identical |
| header style | `.what .why` | `.what .why` | ✅ consistent |
| yaml sections | `always.skills.say` | `always.skills.say` | ✅ identical |
| new term | "tea pause" | — | ✅ no conflict |

---

## conclusion

all name conventions in the blueprint align with extant patterns. no divergence found. the only new term ("tea pause") was introduced in the approved vision and doesn't conflict with extant terminology.

**r5 verdict**: blueprint passes convention consistency review. all names align with codebase patterns.
