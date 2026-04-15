# self-review r2: has-questioned-assumptions

stone: 1.vision
reviewer: mechanic
round: 2 (deeper reflection, post-wisher-feedback)
date: 2026-04-12

---

## re-read and reflect

i re-read the updated vision line by line. most assumptions are now confirmed by wisher. let me look deeper at any i might have missed.

---

## deeper look at confirmed assumptions

### 1. "template path expansion"

**the assumption:** `$behavior` in `template($behavior/refs/...)` expands to current route path.

**fresh question:** what if the route is in a non-standard location?

**scenario:**
```sh
# behavior route at custom path
rhx route.stone.add --route /custom/path/.behavior/v1 --stone 3.1.6.research --from template($behavior/refs/template.stone)
# $behavior should expand to /custom/path/.behavior/v1
```

**is this handled?** the skill must expand `$behavior` based on the computed `--route` value, not a hardcoded path.

**verdict:** implementation detail. the contract is clear. **holds.**

---

### 2. "stone files are created with .stone extension"

**the assumption:** `--stone 3.1.6.research.custom` creates file `3.1.6.research.custom.stone`.

**fresh question:** what if user includes `.stone` in the name?

**scenario:**
```sh
rhx route.stone.add --stone 3.1.6.research.custom.stone --from @stdin
# should this create 3.1.6.research.custom.stone.stone?
# or should it strip the duplicate .stone?
```

**verdict:** the skill should accept the name as given and append `.stone`. if user says `--stone foo.stone`, they get `foo.stone.stone`. user error. **holds.**

---

### 3. "stdin consumption in plan mode"

**the assumption:** plan mode consumes stdin, must re-pipe for apply.

**fresh question:** could we buffer stdin and reuse it?

**analysis:**
- buffer adds complexity
- most shells allow easy re-pipe via `cat file | ...`
- the vision documents this clearly

**verdict:** documented in vision. simple solution: use `--mode apply` directly when stdin involved. **holds.**

---

### 4. "literal content escapes"

**the assumption:** `--from 'literal text'` handles quotes correctly.

**fresh question:** what about content with single quotes inside?

**scenario:**
```sh
rhx route.stone.add --stone 3.1.6.research --from 'investigate the user\'s problem'
# shell escape needed
```

**verdict:** this is standard shell behavior. for complex content, use stdin. literal is for simple cases only. **holds.**

---

### 5. "no position validation means driver responsibility"

**the assumption:** wisher confirmed no validation. driver picks any position.

**fresh question:** what if driver creates stone at position 0 or negative?

**scenario:**
```sh
rhx route.stone.add --stone 0.preface --from 'before everything'
# valid? the pattern requires numeric prefix
```

**verdict:** the validation is "numeric prefix + alpha segment". `0.preface` is valid. `-1.preface` would fail numeric check. **holds.**

---

## new assumption discovered

### 6. "template file must be readable"

**the assumption:** `template($behavior/refs/...)` assumes the file exists and is readable.

**evidence:** vision says failfast if template file not found.

**fresh question:** what if template file has no read permission?

**verdict:** failfast with clear error. same treatment as "file not found". **holds.**

---

## summary

deeper reflection found no new issues. all assumptions are now validated:

| assumption | status |
|------------|--------|
| $behavior expansion | holds (implementation detail) |
| .stone extension append | holds (user error if duplicate) |
| stdin consumption | holds (documented in vision) |
| literal escapes | holds (shell behavior, use stdin for complex) |
| position validation | holds (wisher confirmed none) |
| template file readable | holds (failfast on error) |

the vision is complete. wisher has confirmed all major decisions.
