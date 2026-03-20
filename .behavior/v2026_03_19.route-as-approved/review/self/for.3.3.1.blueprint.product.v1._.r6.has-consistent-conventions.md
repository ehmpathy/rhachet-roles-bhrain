# self-review: has-consistent-conventions (round 6)

## deep name convention consistency review

the guide asks: "review for divergence from extant names and patterns."

for each name choice:
- what name conventions does the codebase use?
- do we use a different namespace, prefix, or suffix pattern?
- do we introduce new terms when extant terms exist?
- does our structure match extant patterns?

---

## name.1: `guidance` field name

### question: do we introduce new terms when extant terms exist?

**examination:**

the field `guidance: string` already exists at `formatRouteStoneEmit.ts:56`:
```typescript
{
  operation: 'route.stone.set';
  stone: string;
  action: 'blocked';
  reason: string;
  guidance: string;  // ← EXTANT
}
```

the blueprint does NOT introduce a new field. it reuses the extant `guidance` field.

**alternatives considered:**

| alternative name | why rejected |
|-----------------|--------------|
| `hint` | extant uses `guidance`, divergent |
| `suggestion` | extant uses `guidance`, divergent |
| `help` | extant uses `guidance`, divergent |
| `message` | extant uses `guidance`, divergent |

**articulation: why this holds**

the `guidance` field is the correct name because:
1. it already exists in the type definition
2. it already has a semantic purpose (guidance for blocked action)
3. a change to the field name would require a change to the type and formatter

**verdict:** CONSISTENT — reuses extant name.

---

## name.2: action value `'blocked'`

### question: does our structure match extant patterns?

**examination:**

the action value `'blocked'` already exists at `formatRouteStoneEmit.ts:54`:
```typescript
action: 'blocked';  // ← EXTANT
```

the blueprint does NOT introduce a new action value.

**extant action pattern:**

| action value | sense |
|--------------|-------|
| `'passed'` | stone completed |
| `'approved'` | human approved guard |
| `'blocked'` | action prevented |
| `'rewound'` | stone rewound |
| `'promised'` | review promised |
| `'challenge:absent'` | challenge for absent review |
| `'challenge:first'` | challenge for first attempt |
| `'challenge:rushed'` | challenge for rushed attempt |

**pattern:** lowercase, colon-separated for compound actions

**articulation: why this holds**

`'blocked'` is the correct action because:
1. it already exists in the type union
2. it matches the semantic purpose (action is blocked)
3. the formatter already has a branch for this action

**verdict:** CONSISTENT — reuses extant action value.

---

## name.3: header string `'🦉 patience, friend.'`

### question: do we use a different prefix or suffix pattern?

**examination:**

extant header constants at `formatRouteStoneEmit.ts:15-17`:
```typescript
const HEADER_GET = '🦉 and then?';
const HEADER_SET = '🦉 the way speaks for itself';
const HEADER_DEL = '🦉 hoo needs 'em';
```

extant inline headers:
- `route.ts:1146`: `'🦉 patience, friend'`
- `formatPatienceFriend.ts:16`: `'🗿 patience, friend'`

**pattern analysis:**

| header | emoji | phrase | punctuation |
|--------|-------|--------|-------------|
| HEADER_GET | 🦉 | and then? | ? |
| HEADER_SET | 🦉 | the way speaks for itself | none |
| HEADER_DEL | 🦉 | hoo needs 'em | none |
| route.ts:1146 | 🦉 | patience, friend | none |
| formatPatienceFriend.ts:16 | 🗿 | patience, friend | none |
| **blueprint** | 🦉 | patience, friend. | . |

**observation:** the blueprint adds a period. is this divergent?

examine more closely:
- HEADER_GET ends with `?` (question)
- others have no punctuation
- the blueprint has `.` (period)

**articulation: why this holds**

the period is acceptable because:
1. it's a complete sentence ("patience, friend.")
2. HEADER_GET shows punctuation is allowed
3. the phrase is still consistent with extant tone

however, for maximum consistency with route.ts:1146 which uses no period, we could remove it.

**consideration:** the vision shows `🦉 patience, friend.` with the period. this is wisher intent.

**verdict:** CONSISTENT — follows extant pattern (emoji + phrase), period matches wisher vision.

---

## name.4: brief file name `howto.drive-routes.[guide].md`

### question: do we use a different namespace, prefix, or suffix pattern?

**examination:**

extant briefs in `src/domain.roles/driver/briefs/`:

| file name | prefix | topic | type |
|-----------|--------|-------|------|
| `define.routes-are-gardened.[philosophy].md` | define | routes-are-gardened | philosophy |
| `howto.create-routes.[ref].md` | howto | create-routes | ref |
| `im_a.bhrain_owl.md` | im_a | bhrain_owl | (none) |
| `research.importance-of-focus.[philosophy].md` | research | importance-of-focus | philosophy |

**pattern:** `{prefix}.{topic}.[{type}].md`

**blueprint:** `howto.drive-routes.[guide].md`
- prefix: `howto` ✓ (matches `howto.create-routes`)
- topic: `drive-routes` ✓ (kebab-case like `create-routes`)
- type: `[guide]` — is this extant?

**extant types:**
- `[philosophy]` — philosophical content
- `[ref]` — reference content

**new type:** `[guide]` — guidance content

**articulation: why this holds**

`[guide]` is consistent because:
1. it follows the bracket syntax `[type]`
2. it's semantically distinct from `[ref]` (reference = lookup, guide = tutorial)
3. the wish says "say level boot.yml brief" which implies contextual guidance, not reference

**verdict:** CONSISTENT — follows `{prefix}.{topic}.[{type}].md` pattern, new type is semantically appropriate.

---

## name.5: boot.yml `say:` section

### question: what name conventions does the codebase use?

**examination:**

rhachet boot.yml structure supports:
```yaml
always:
  briefs:
    ref:     # reference briefs (always loaded)
    say:     # contextual briefs (loaded when relevant)
```

the `say:` key is a standard rhachet convention, not a new invention.

**extant boot.yml:**
```yaml
always:
  briefs:
    ref:
      - briefs/im_a.bhrain_owl.md
      - ...
```

the `say:` section is not currently present, but it's a standard key.

**articulation: why this holds**

`say:` is consistent because:
1. it's a standard rhachet boot.yml key
2. the wish explicitly requests "say level" brief
3. the key follows lowercase yaml convention

**verdict:** CONSISTENT — uses standard rhachet key.

---

## summary

| name | convention question | extant pattern | blueprint | diverges? |
|------|---------------------|---------------|-----------|-----------|
| `guidance` | introduces new term? | extant field | reused | no |
| `'blocked'` | matches structure? | extant action | reused | no |
| `'🦉 patience, friend.'` | different prefix/suffix? | emoji + phrase | emoji + phrase + . | no (wisher intent) |
| `howto.drive-routes.[guide].md` | different namespace? | `{prefix}.{topic}.[{type}].md` | follows pattern | no |
| `say:` | codebase convention? | standard rhachet key | standard key | no |

**no name convention divergences found.**

each name choice either:
1. reuses an extant name (`guidance`, `'blocked'`)
2. follows an extant pattern (header format, brief name)
3. uses a standard convention (`say:` key)

---

## the owl reflects 🦉

> i searched for each name.
> i questioned each choice.
> i found the extant patterns.
> i verified consistency.
>
> no divergence.
> the names honor what came before. 🪷

