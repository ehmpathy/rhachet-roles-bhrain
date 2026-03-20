# self-review r4: has-consistent-conventions

fresh pass on convention consistency.

---

## additional review: file name conventions

### boot.yml structure

**tea pause change:**
```yaml
  skills:
    say:
      - skills/route.stone.set.sh
```

**extant boot.yml structure:**
```yaml
always:
  briefs:
    ref:
      - briefs/im_a.bhrain_owl.md
      - ...
```

**verdict:** follows extant pattern:
- top-level: `always:`
- second-level: `briefs:` and now `skills:`
- third-level: `ref:` and `say:`
- items prefixed with `-`

consistent.

---

### shell header convention

**tea pause change to route.stone.set.sh:**
```bash
# .what = shell entrypoint for route.stone.set skill
#
# .why = mark stone status to progress through a route:
#        - arrived: ready for review (triggers guard)
#        - passed: work complete (continues route)
#        - approved: human sign-off (for guarded stones)
#        - blocked: stuck, need help (halts route)
```

**extant pattern (searched other skills):**
```bash
# .what = <brief description>
#
# .why = <reason>
```

**verdict:** follows extant pattern. multi-line .why is acceptable — other skills do this too.

---

### test name convention

**tea pause test:**
```typescript
given('[case7] tea pause after 5+ hooks', () => {
```

**extant test names:**
```typescript
given('[case6] drum nudge after 7+ hooks', () => {
```

**verdict:** follows exact pattern:
- `[caseN]` prefix
- descriptive text
- "after N+ hooks" structure

consistent.

---

## re-read of r3 analysis

r3 identified intentional divergences:
- `🍵` emoji — justified by owl theme
- shorter question text — justified by challenge tone
- `⚠️` emoji — justified by mandate visibility

these divergences are intentional per wish, not convention violations.

---

## summary

| convention | consistent? |
|------------|-------------|
| boot.yml structure | yes |
| shell header format | yes |
| test names | yes |
| emoji usage | intentional divergence |
| tree text | intentional divergence |

no unintentional convention violations found.
