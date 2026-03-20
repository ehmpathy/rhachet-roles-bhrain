# self-review r7: has-behavior-declaration-adherance

review for adherance to the behavior declaration. check if blueprint CORRECTLY implements the spec.

---

## adherance check 1: tea pause OUTPUT matches vision

### vision describes (line 6-18):

```
🍵 tea first. then, choose your path.
   │
   ├─ you must choose one
   │  ├─ ready for review?
   │  │  └─ rhx route.stone.set --stone X --as arrived
   │  │
   │  ├─ ready to continue?
   │  │  └─ rhx route.stone.set --stone X --as passed
   │  │
   │  └─ blocked and need help?
   │     └─ rhx route.stone.set --stone X --as blocked
   │
   └─ ⚠️ to refuse is not an option.
      work on the stone, or mark your status.
```

### blueprint produces (lines 89-103):

```typescript
lines.push(`🍵 tea first. then, choose your path.`);
lines.push(`   │`);
lines.push(`   ├─ you must choose one`);
lines.push(`   │  ├─ ready for review?`);
lines.push(`   │  │  └─ ${arrivedCmd}`);
lines.push(`   │  │`);
lines.push(`   │  ├─ ready to continue?`);
lines.push(`   │  │  └─ ${passedCmd}`);
lines.push(`   │  │`);
lines.push(`   │  └─ blocked and need help?`);
lines.push(`   │     └─ ${blockedCmd}`);
lines.push(`   │`);
lines.push(`   └─ ⚠️ to refuse is not an option.`);
lines.push(`      work on the stone, or mark your status.`);
```

### compare line by line:

| vision line | blueprint line | match? |
|-------------|----------------|--------|
| `🍵 tea first...` | line 89 | ✅ exact |
| `   │` | line 90 | ✅ exact |
| `   ├─ you must choose one` | line 91 | ✅ exact |
| `   │  ├─ ready for review?` | line 92 | ✅ exact |
| `   │  │  └─ ${arrivedCmd}` | line 93 | ✅ dynamic |
| (blank tree line) | line 94 | ✅ vision shows blank |
| `   │  ├─ ready to continue?` | line 95 | ✅ exact |
| `   │  │  └─ ${passedCmd}` | line 96 | ✅ dynamic |
| (blank tree line) | line 97 | ✅ vision shows blank |
| `   │  └─ blocked and need help?` | line 98 | ✅ exact |
| `   │     └─ ${blockedCmd}` | line 99 | ✅ dynamic |
| `   │` | line 100 | ✅ exact |
| `   └─ ⚠️ to refuse...` | line 101 | ✅ exact |
| `      work on the stone...` | line 102 | ✅ exact |

**r7 verdict**: ✅ blueprint output MATCHES vision exactly

---

## adherance check 2: trigger condition matches vision

### vision describes (line 1):
> "add a tea pause section at the top of route.drive output (after count > N)"

### criteria specifies (usecase.1):
```
when(route.drive hook runs and count > N)
  then(tea pause section appears at TOP of output, before stone content)
```

### blueprint implements:
```typescript
if (input.suggestBlocked) {
  // tea pause section
}
```

### code trace from r2 assumptions:
> "`suggestBlocked: state.count > 5` trigger is already used for the bottom blocked option"

**r7 verdict**: ✅ `suggestBlocked` correctly implements "count > N" (where N=5)

---

## adherance check 3: skill header matches vision

### vision describes (line 85-95):
```
# usage:
#   ./route.stone.set.sh --stone 1.vision --as arrived
#   ./route.stone.set.sh --stone 1.vision --as passed
#   ./route.stone.set.sh --stone 1.vision --as approved
#   ./route.stone.set.sh --stone 1.vision --as blocked
#
# options:
#   --as      status: arrived | passed | approved | blocked
#             - arrived: "i'm here, review my work"
#             - passed: "done, continue to next stone"
#             - approved: "human approved"
#             - blocked: "stuck, escalate to human"
```

### blueprint produces (lines 121-133):
```bash
# usage:
#   ./route.stone.set.sh --stone 1.vision --route .behavior/my-feature --as arrived
#   ./route.stone.set.sh --stone 1.vision --route .behavior/my-feature --as passed
#   ./route.stone.set.sh --stone 1.vision --route .behavior/my-feature --as approved
#   ./route.stone.set.sh --stone 1.vision --route .behavior/my-feature --as blocked
#
# options:
#   --stone   stone name or glob pattern (required)
#   --route   path to route directory (required)
#   --as      status: arrived | passed | approved | blocked (required)
#             - arrived: "i'm here, review my work"
#             - passed: "done, continue to next stone"
#             - approved: "human approved" (requires human)
#             - blocked: "stuck, escalate to human" (requires articulation)
```

**difference found**: blueprint adds `--route` parameter and `(requires ...)` notes.

**is this deviation correct?**
- `--route` is an EXTANT required parameter in route.stone.set
- the vision examples were simplified; blueprint shows full usage
- `(requires ...)` notes add clarity without deviation

**r7 verdict**: ✅ blueprint correctly EXTENDS vision header with complete information

---

## adherance check 4: boot.yml matches vision

### vision describes (line 98):
> "add route.stone.set to boot.yml as a say skill for startup awareness"

### blueprint produces (lines 147-149):
```yaml
skills:
  say:
    - skills/route.stone.set.sh
```

**r7 verdict**: ✅ blueprint matches vision exactly

---

## adherance check 5: position matches vision

### vision describes:
> "front-and-center, not buried at the bottom"
> "tea pause appears at TOP after count > N"

### blueprint implements:
> "insert after line 409 (`lines.push('');`) and before line 412 (`lines.push('🗿 route.drive');`)"

**code trace**: this places tea pause AFTER header `🦉 where were we?` and BEFORE `🗿 route.drive`.

**r7 verdict**: ✅ blueprint places tea pause at correct position (front-and-center)

---

## deviations analysis

| area | vision says | blueprint does | deviation? |
|------|-------------|----------------|------------|
| output format | tree with 3 options | exact tree with 3 options | ✅ none |
| trigger | count > N | suggestBlocked (count > 5) | ✅ none |
| header | all --as options | all + notes | ✅ extends |
| boot.yml | skills.say | skills.say | ✅ none |
| position | top | after header, before tree | ✅ none |

---

## conclusion

blueprint adheres to behavior declaration. the only "deviation" is that the header EXTENDS vision with additional clarity (--route param, requires notes). this is correct because:
1. --route is an extant required parameter
2. additional notes improve usability
3. vision was simplified; blueprint is complete

**r7 verdict**: blueprint passes behavior declaration adherance. no deviations from spec.
