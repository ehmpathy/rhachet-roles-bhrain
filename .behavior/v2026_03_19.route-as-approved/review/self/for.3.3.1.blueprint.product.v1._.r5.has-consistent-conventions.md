# self-review: has-consistent-conventions (round 5)

## name convention consistency review

the guide asks: "review for divergence from extant names and patterns."

---

## step 1: inventory of name choices in blueprint

| name choice | location | category |
|-------------|----------|----------|
| `guidance` (field) | setStoneAsApproved.ts | field name |
| `action: 'blocked'` | formatRouteStoneEmit input | enum value |
| `'🦉 patience, friend.'` | formatRouteStoneEmit | header string |
| `howto.drive-routes.[guide].md` | briefs/ | file name |
| `say:` section | boot.yml | yaml key |

---

## step 2: convention check for each name

### name.1: `guidance` field

**extant convention:**

examined `formatRouteStoneEmit.ts` type definition at lines 53-56:
```typescript
{
  ...
  action: 'blocked';
  reason: string;
  guidance: string;
}
```

the field is already named `guidance`. we do not rename it.

**blueprint approach:**

use extant `guidance` field, change only the value.

**verdict:** CONSISTENT. uses extant field name.

---

### name.2: `action: 'blocked'`

**extant convention:**

examined action values in `formatRouteStoneEmit.ts`:
- line 54: `action: 'blocked'`
- line 63: `action: 'approved'`
- line 68: `action: 'rewound'`
- line 73: `action: 'promised'`
- line 81: `action: 'passed'`
- line 156: `action === 'challenge:absent'`
- line 165: `action === 'challenge:first'`
- line 168: `action === 'challenge:rushed'`

**pattern:** lowercase, colon-separated for compound values

**blueprint approach:**

uses extant `action: 'blocked'`. no new action introduced.

**verdict:** CONSISTENT. uses extant action value.

---

### name.3: header string `'🦉 patience, friend.'`

**extant convention:**

examined extant headers:
- `HEADER_GET = '🦉 and then?'` — owl emoji + phrase + punctuation
- `HEADER_SET = '🦉 the way speaks for itself'` — owl emoji + phrase
- `HEADER_DEL = '🦉 hoo needs 'em'` — owl emoji + phrase

inline headers:
- route.ts:1146: `'🦉 patience, friend'` — owl emoji + phrase
- formatPatienceFriend.ts:16: `'🗿 patience, friend'` — stone emoji + phrase

**pattern:** emoji + short phrase, optional punctuation

**blueprint approach:**

`'🦉 patience, friend.'` — owl emoji + phrase + period

**verdict:** CONSISTENT. follows extant header pattern (emoji + phrase).

---

### name.4: file name `howto.drive-routes.[guide].md`

**extant convention:**

examined briefs in `src/domain.roles/driver/briefs/`:
- `define.routes-are-gardened.[philosophy].md` — prefix.topic.[type].md
- `howto.create-routes.[ref].md` — prefix.topic.[type].md
- `im_a.bhrain_owl.md` — prefix.identity.md
- `research.importance-of-focus.[philosophy].md` — prefix.topic.[type].md

**pattern:** `{prefix}.{topic}.[{type}].md` or `{prefix}.{identity}.md`

**blueprint approach:**

`howto.drive-routes.[guide].md`
- prefix: `howto` (matches extant `howto.create-routes`)
- topic: `drive-routes` (kebab-case like `create-routes`, `routes-are-gardened`)
- type: `[guide]` (bracket syntax like `[ref]`, `[philosophy]`)

**verdict:** CONSISTENT. follows `{prefix}.{topic}.[{type}].md` pattern.

---

### name.5: `say:` section in boot.yml

**extant convention:**

examined boot.yml structure:
```yaml
always:
  briefs:
    ref:
      - briefs/...
```

rhachet boot.yml supports:
- `always:` — top-level context
- `briefs:` — brief collection
- `ref:` — reference level (always loaded)
- `say:` — contextual level (loaded when relevant)

**pattern:** lowercase yaml keys, colon-terminated

**blueprint approach:**

```yaml
always:
  briefs:
    ref:
      - ...
    say:
      - briefs/howto.drive-routes.[guide].md
```

**verdict:** CONSISTENT. `say:` is a standard rhachet boot.yml key.

---

## step 3: check for divergent names

| name | extant pattern | blueprint | diverges? |
|------|---------------|-----------|-----------|
| `guidance` | extant field name | reused | no |
| `'blocked'` | extant action value | reused | no |
| `'🦉 patience, friend.'` | emoji + phrase | emoji + phrase | no |
| `howto.drive-routes.[guide].md` | `{prefix}.{topic}.[{type}].md` | follows pattern | no |
| `say:` | standard rhachet key | standard key | no |

---

## summary

**no name convention divergences found.**

all names in the blueprint either:
1. reuse extant names (`guidance`, `'blocked'`)
2. follow extant patterns (brief name, header format)
3. use standard rhachet conventions (`say:` section)

---

## the owl reflects 🦉

> names are not arbitrary.
> names carry the weight of convention.
> when you diverge, you create confusion.
> when you follow, you create clarity.
>
> the extant names serve.
> the blueprint honors them. 🪷

