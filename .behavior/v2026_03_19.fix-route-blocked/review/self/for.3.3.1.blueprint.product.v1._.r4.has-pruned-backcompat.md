# self-review r4: has-pruned-backcompat (deeper pass)

r3 identified 4 backwards compat decisions. this r4 pass challenges each more deeply.

---

## challenge 1: bottom command prompt — is r3 analysis sufficient?

**r3 said**: justified in vision (line 61-63)

**r4 challenge**: did I actually READ those lines? let me verify.

**verification**: opened 1.vision.stone, searched for "bottom prompt":

line 61-63:
```
### what feels off or forced?

- the tree structure adds visual weight; might be noisy
- same three commands at top AND bottom feels redundant
```

wait — that's in "what is awkward" section. the JUSTIFICATION is at lines 52-54:

```
**question**: should we remove the bottom prompt since tea pause shows commands at top?

**verdict**: keep it — the bottom prompt serves a different purpose. it's positioned after the stone content, for easy copy when ready to act.
```

**r4 result**: r3 cited wrong line numbers. but the justification DOES exist at lines 52-54.

**r4 verdict**: ✅ backwards compat justified, but r3 citation was sloppy

---

## challenge 2: drum nudge — did r1 actually address this?

**r3 said**: justified in r1 deletables review (section 6)

**r4 challenge**: let me re-read r1 section 6 to verify.

**verification**: opened r1.has-questioned-deletables.md, section 6:

```
## 6. drum nudge (count >= 7)

**question**: should we remove drum nudge now that tea pause extant?

**verdict**: keep it — drum nudge serves a different purpose (philosophical reminder at 7+ hooks). tea pause is actionable (5+ hooks). they complement each other.

**reason it holds**: tea pause = "here are your options". drum nudge = "do your work, then step back". different messages, different timelines.
```

**r4 result**: r1 analysis holds. tea pause (count > 5) and drum nudge (count >= 7) have different triggers and purposes:
- tea pause: present options at count 6
- drum nudge: philosophical reminder at count 7+
- no conflict; they stack at count >= 7

**r4 verdict**: ✅ backwards compat justified with clear rationale

---

## challenge 3: approved status — is extant behavior worth to document?

**r3 said**: document extant behavior, not YAGNI

**r4 challenge**: but WHY document approved? what if driver never needs it?

**deeper analysis**:

1. **what is approved for?** — human sign-off on guarded stones
2. **when would driver use it?** — after guard passes AND human reviews
3. **is it in the tea pause?** — NO. tea pause shows arrived/passed/blocked, not approved.

**key insight**: the skill header documents ALL behaviors. tea pause shows RELEVANT behaviors for stuck drivers. these are different scopes:
- skill header = reference documentation (all options)
- tea pause = contextual prompt (actionable options)

**r4 result**: approved belongs in header (complete documentation) but NOT in tea pause (not relevant for stuck drivers). this distinction is correct.

**r4 verdict**: ✅ backwards compat justified — approved is extant behavior for header

---

## challenge 4: extant briefs — did we NEED to keep them?

**r3 said**: stay in scope — wisher asked to ADD skills.say, not change briefs

**r4 challenge**: what if briefs list causes issues? should we verify compatibility?

**verification**: check boot.yml structure:

```yaml
always:
  briefs:
    ref:
      - briefs/im_a.bhrain_owl.md
      - briefs/define.routes-are-gardened.[philosophy].md
      - briefs/research.importance-of-focus.[philosophy].md
      - briefs/howto.create-routes.[ref].md
```

**analysis**:
- `always.briefs.ref` is a list of paths
- `always.skills.say` will be a SIBLING key, not a modification
- no conflict; yaml supports multiple keys under `always`

**r4 result**: briefs and skills.say are orthogonal sections. no backwards compat concern — they coexist.

**r4 verdict**: ✅ not actually backwards compat — just separate concerns

---

## r4 stress test: what backwards compat did r3 MISS?

scan blueprint more carefully for hidden compat assumptions:

### missed item 1: formatRouteDrive function signature

**concern**: does tea pause require new parameters?

**blueprint check**: tea pause uses `input.suggestBlocked` — EXTANT parameter. no signature change.

**r4 result**: no backwards compat concern — uses extant interface

### missed item 2: test snapshots

**concern**: snapshot tests will change. is this a break?

**blueprint check**: snapshots capture OUTPUT, not behavior. changed output is expected.

**r4 result**: snapshot updates are EXPECTED, not backwards compat issues

### missed item 3: tree format vs ASCII box

**concern**: vision mentioned to consider ASCII box format. did we abandon it?

**vision check** (line 8-9): "tree format chosen over ASCII box (proven to render, consistent with extant output)"

**r4 result**: tree format was explicitly chosen. no backwards compat concern — new feature uses consistent style.

---

## conclusion

r4 deep analysis confirms backwards compat decisions are justified:

| decision | r3 verdict | r4 challenge | r4 verdict |
|----------|------------|--------------|------------|
| bottom prompt | ✅ | verified citation | ✅ holds |
| drum nudge | ✅ | verified r1 analysis | ✅ holds |
| approved status | ✅ | clarified scope difference | ✅ holds |
| extant briefs | ✅ | not actually backcompat | ✅ clarified |

additional items scanned:
- function signature: no change needed
- snapshots: expected updates, not compat issue
- tree format: explicitly chosen style

**r4 verdict**: blueprint passes backwards compat review. all decisions justified. no open questions.
