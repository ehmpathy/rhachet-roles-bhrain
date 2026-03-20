# self-review: has-questioned-requirements

## requirements questioned

### 1. "fallen-leaf challenge at TOP of output"

**who said this?** the wish explicitly says "lets add a separate dedicated fallen-leaf challenge section at the top, before the stone head"

**why?** drivers get in infinite loops ("please run x", "run x", "x", ".") and don't see the `--as blocked` option because it only appears at the bottom after 5+ hooks

**what if we didn't do this?** drivers continue to loop infinitely, they waste tokens and human attention

**could we achieve this simpler?**
- option A: show `--as blocked` earlier (after count > 2 instead of > 5)
- option B: add it to the top without the fancy box format
- **decision**: the wish is explicit about "at the top" and "more clearly", so we keep the top placement. the box format is my interpretation — may need wisher validation.

**holds**: requirement is valid and well-justified by the infinite loop problem.

---

### 2. "update route.stone.set.sh header"

**who said this?** the wish says "the rhx route.stone.set skill's skill header (in the sh) should make the --as blocked, --as passed, --as arrived options super clear!"

**evidence**: current header in route.stone.set.sh only shows:
```
# usage:
#   ./route.stone.set.sh --stone 1.vision --route .behavior/my-feature --as passed
#   ./route.stone.set.sh --stone 1.vision --route .behavior/my-feature --as approved
```
does NOT show `--as blocked` or `--as arrived`

**why?** so drivers know what commands are available when the skill boots

**what if we didn't do this?** drivers wouldn't learn about `--as blocked` until they see it in route.drive output (if at all)

**holds**: requirement is valid. the header must document all options.

---

### 3. "add route.stone.set to boot.yml as 'say'"

**who said this?** the wish says "we should ensure taht the role.hooks.onBoot boots this skill and that the boot.yml includes this skill as a 'say'"

**current state**: boot.yml only has briefs, no skills section:
```yaml
always:
  briefs:
    ref:
      - briefs/im_a.bhrain_owl.md
      - ...
```

**question**: does boot.yml support `say` for skills? need to research rhachet boot.yml schema.

**what if we didn't do this?** drivers would still see the skill header via route.drive, but not on initial boot. may be redundant.

**concern**: if boot.yml doesn't support skill `say`, we need an alternative approach.

**holds with caveat**: requirement intent is valid (early awareness), but implementation path needs validation.

---

### 4. "fallen-leaf challenge" — the name

**who said this?** the wish says "dedicated fallen-leaf challenge section" but doesn't define what "fallen-leaf" means.

**my interpretation**: owl-themed autumn metaphor — leaves fall when it's time to let go / decide

**question**: is this name clear to drivers? or is it too poetic?

**alternative**: "status checkpoint", "decision gate", "are you here?" (matches current output)

**needs wisher validation**: confirm the "fallen-leaf" terminology.

---

### 5. ASCII box format

**who said this?** i invented this. the wish just says "at the top" and "more clearly".

**question**: is a box necessary? or would simpler tree output work?

**alternative**:
```
🍂 are you blocked? or have you decided not to try?
   ├─ ready for review?     → rhx route.stone.set --stone X --as arrived
   ├─ ready to continue?    → rhx route.stone.set --stone X --as passed
   └─ blocked and need help? → rhx route.stone.set --stone X --as blocked
```

**needs wisher validation**: confirm visual format preference.

---

## summary

| requirement | verdict | notes |
|-------------|---------|-------|
| top placement | **holds** | wish is explicit |
| route.stone.set.sh header | **holds** | current header incomplete |
| boot.yml say | **needs validation** | research boot.yml schema |
| "fallen-leaf" name | **needs validation** | my interpretation |
| ASCII box format | **needs validation** | my invention |

## action items

1. research boot.yml skill `say` support before we continue
2. ask wisher to confirm "fallen-leaf" terminology
3. ask wisher to confirm visual format (box vs tree)
