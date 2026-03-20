# self-review r3: has-consistent-conventions

review for divergence from extant names and patterns.

---

## name conventions reviewed

### 1. variable names

**tea pause variables:**
```typescript
const arrivedCmd = ...
const passedCmd = ...
const blockedCmd = ...
```

**extant variables (lines 419-420, 450):**
```typescript
const arrivedCmd = ...
const passedCmd = ...
const blockedCmd = ...
```

**verdict:** exact match. consistent.

---

### 2. emoji prefix convention

**tea pause:**
```typescript
lines.push(`🍵 tea first. then, choose your path.`);
```

**extant emojis in formatRouteDrive:**
- `🦉 where were we?` — owl header
- `🗿 route.drive` — stone moai
- extant nudge uses plain text

**analysis:** `🍵` is new. is this consistent?

**extant emoji usage in codebase:**
- driver role uses owl themes (`🦉`)
- route system uses stone themes (`🗿`)
- tea fits owl philosophy (see: im_a.bhrain_owl.md — "loves jasmine tea")

**verdict:** consistent with owl vibe. tea is owl-themed.

---

### 3. tree branch text

**tea pause text:**
```
🍵 tea first. then, choose your path.
   │
   ├─ you must choose one
   │  ├─ ready for review?
   │  ├─ ready to continue?
   │  └─ blocked and need help?
```

**extant tree text (lines 421-425):**
```
   ├─ are you here?
   │  ├─ when ready for review, run:
   │  └─ when ready to continue, run:
```

**analysis:** tea pause uses different wording:
- "ready for review?" vs "when ready for review, run:"
- "ready to continue?" vs "when ready to continue, run:"
- "blocked and need help?" — new

**verdict:** intentionally different. tea pause is a challenge, not just a prompt. shorter, more direct questions fit the challenge tone. this divergence is intentional per the wish.

---

### 4. mandate text

**tea pause:**
```
   └─ ⚠️ to refuse is not an option.
      work on the stone, or mark your status.
```

**extant:** no similar text

**analysis:** is ⚠️ appropriate?

**extant ⚠️ usage:** searched — not used elsewhere in this file

**verdict:** new but appropriate. the mandate needs visual weight. ⚠️ signals "attention required" per wish requirement.

---

### 5. comment style

**tea pause comment:**
```typescript
// tea pause for stuck drivers (same trigger as suggestBlocked)
```

**extant comments:**
```typescript
// header
// route.drive tree
// drum nudge for stuck clones (7+ hooks without passage attempt)
// stone content block
// command prompt at bottom
```

**verdict:** consistent style — lowercase, brief, descriptive.

---

## summary

| convention | diverges? | justified? |
|------------|----------|------------|
| variable names | no | exact match |
| emoji choice | yes — new emoji | yes — owl-themed |
| tree wording | yes — shorter | yes — challenge tone |
| ⚠️ emoji | yes — new usage | yes — mandate visibility |
| comment style | no | consistent |

intentional divergences are justified by wish requirements. no unintentional divergence found.
