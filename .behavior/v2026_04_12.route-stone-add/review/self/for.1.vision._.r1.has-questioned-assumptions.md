# self-review r1: has-questioned-assumptions

stone: 1.vision
reviewer: mechanic
round: 1 (post-wisher-feedback)
date: 2026-04-12

---

## pause and breathe

i stopped. i re-read the updated vision. i questioned each assumption. wisher has now confirmed most decisions. here is what i found.

---

## assumptions questioned

### 1. stone names must have numeric prefix + alpha segment

**what we assume:** stone names follow pattern like `3.1.6.research.custom`

**evidence:** wisher explicitly confirmed: "validate that the stone name is fully qualified" and "numeric prefix and then alpha afterwards" and "atleast".

**what if the opposite were true?** stones could be named freely. but wisher wants structure.

**did the wisher say this?** yes, explicitly.

**verdict:** assumption confirmed by wisher. **holds.**

---

### 2. templates are path-based, not enumerable

**what we assume:** templates use `template($behavior/refs/...)` syntax, not fixed names.

**evidence:** wisher gave exact syntax: "should support `--from template($behavior/refs/.research.adhoc.template.stone)`".

**what if we had a fixed template list?** would need discovery mechanism like `--list-templates`.

**did the wisher say this?** yes, wisher specified path-based syntax.

**verdict:** path-based templates eliminate need for discovery. **holds.**

---

### 3. bound route auto-detect with optional override

**what we assume:** `--route` defaults to bound route, accepts explicit path.

**evidence:** wisher confirmed: "auto detect just like the other route.stone operations do".

**what if explicit only?** would break consistency with rest of family.

**did the wisher say this?** yes, explicitly confirmed the pattern.

**verdict:** assumption confirmed. **holds.**

---

### 4. plan mode is default

**what we assume:** stone addition previews before it creates the file.

**evidence:** extant pattern in `route.stone.del` and other skills.

**what if apply were default?** faster but riskier.

**did the wisher say this?** no explicit mention, but no objection either.

**verdict:** convention-based assumption. plan mode is safer. **holds.**

---

### 5. stones only, no guards

**what we assume:** skill only adds stones, not guards.

**evidence:** wisher explicitly confirmed: "no guards for now too".

**what if guards were included?** scope creep for v1.

**did the wisher say this?** yes, explicitly.

**verdict:** assumption confirmed by wisher. **holds.**

---

### 6. no position validation

**what we assume:** driver can add stone at any numeric position.

**evidence:** wisher explicitly confirmed: "yep, no validation" and "no validation, no guards".

**what if we validated?** would gatekeep drivers.

**did the wisher say this?** yes, explicitly.

**verdict:** assumption confirmed by wisher. **holds.**

---

### 7. collision check required

**what we assume:** skill fails if stone already exists.

**evidence:** wisher explicitly said: "it should not collide with an extant stone".

**what if we allowed overwrite?** could lose work.

**did the wisher say this?** yes, explicitly.

**verdict:** assumption confirmed by wisher. **holds.**

---

### 8. @stdin is stdin marker

**what we assume:** `--from @stdin` means read from stdin.

**evidence:** extant pattern in `git.commit.set -m @stdin`.

**what if literal?** would be unclear.

**did the wisher say this?** implied by original wish syntax.

**verdict:** extant convention. **holds.**

---

### 9. $behavior resolves to current behavior route

**what we assume:** in `template($behavior/refs/...)`, `$behavior` is a variable.

**evidence:** follows pattern of shell variable expansion.

**what if literal path?** would break when routes have different paths.

**did the wisher say this?** implied by the syntax given.

**verdict:** logical extension of the syntax. **holds.**

---

## summary

all assumptions confirmed:

| assumption | source | verdict |
|------------|--------|---------|
| stone name validation | wisher | holds |
| path-based templates | wisher | holds |
| auto-detect route | wisher | holds |
| plan mode default | convention | holds |
| stones only | wisher | holds |
| no position validation | wisher | holds |
| collision check | wisher | holds |
| @stdin marker | convention | holds |
| $behavior variable | syntax | holds |

no issues found. most assumptions are now explicitly confirmed by wisher feedback.
