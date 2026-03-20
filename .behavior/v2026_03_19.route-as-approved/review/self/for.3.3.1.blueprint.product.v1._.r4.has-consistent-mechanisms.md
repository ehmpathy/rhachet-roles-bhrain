# self-review: has-consistent-mechanisms (round 4)

## mechanism consistency review

the guide asks: "review for new mechanisms that duplicate extant functionality."

---

## step 1: inventory of new mechanisms in blueprint

| mechanism | location | what it does |
|-----------|----------|--------------|
| guidance string | setStoneAsApproved.ts | multi-line guidance with alternatives |
| header inline | formatRouteStoneEmit.ts | "🦉 patience, friend." for blocked action |
| new brief file | howto.drive-routes.[guide].md | driver education brief |
| boot.yml say section | boot.yml | register brief at say level |

---

## step 2: consistency check for each mechanism

### mechanism.1: guidance string in setStoneAsApproved.ts

**what it does:**
replaces single-line guidance with multi-line structured string that contains tree characters.

**does the codebase already have a mechanism for this?**

searched for extant guidance patterns:
- `formatRouteStoneEmit.ts` line 291: `lines.push(\`   └─ ${input.guidance}\`);`
- the formatter already accepts multi-line strings
- no separate guidance formatter exists

**is the blueprint consistent?**

yes. the blueprint proposes:
- pass a pre-formatted multi-line string to `guidance`
- let the extant formatter render it as a tree leaf
- no new formatter, no new type, no new mechanism

**verdict:** consistent. reuses extant guidance render.

---

### mechanism.2: header inline for blocked action

**what it does:**
uses inline string "🦉 patience, friend." instead of HEADER_SET constant for blocked action.

**does the codebase already have inline header patterns?**

searched for extant inline header patterns:
- `route.ts` line 1146: `'🦉 patience, friend',` (inline, no constant)
- `formatPatienceFriend.ts` line 16: `lines.push(\`🗿 patience, friend\`);` (inline, no constant)

**is the blueprint consistent?**

yes. the blueprint proposes:
- inline string in blocked branch
- no new constant added
- follows extant pattern of inline headers for specific contexts

**alternative considered: add HEADER_BLOCKED constant**

this would be INCONSISTENT because:
- route.ts uses inline "🦉 patience, friend" without constant
- formatPatienceFriend.ts uses inline "🗿 patience, friend" without constant
- constants are used for operation-level headers (GET/SET/DEL)
- blocked is an action within SET operation, not a new operation

**verdict:** consistent. inline header matches extant patterns.

---

### mechanism.3: new brief file howto.drive-routes.[guide].md

**what it does:**
new markdown brief for driver education.

**does the codebase already have brief patterns?**

examined extant briefs in `src/domain.roles/driver/briefs/`:
- `define.routes-are-gardened.[philosophy].md`
- `howto.create-routes.[ref].md`
- `im_a.bhrain_owl.md`
- `research.importance-of-focus.[philosophy].md`

**is the blueprint consistent?**

yes. the proposed name `howto.drive-routes.[guide].md`:
- follows `howto.*.md` pattern (extant: `howto.create-routes.[ref].md`)
- uses bracket suffix for type (`[guide]` vs `[ref]` vs `[philosophy]`)
- follows kebab-case name convention

**verdict:** consistent. follows extant brief name conventions.

---

### mechanism.4: boot.yml say section

**what it does:**
adds `say:` section under `briefs:` to register the new brief.

**does the codebase already have this structure?**

examined extant boot.yml:
```yaml
always:
  briefs:
    ref:
      - briefs/im_a.bhrain_owl.md
      - ...
```

**is `say:` a valid section?**

yes. rhachet boot.yml supports `ref:` and `say:` levels:
- `ref:` = reference briefs (loaded always)
- `say:` = contextual briefs (loaded when relevant)

**is the blueprint consistent?**

yes. the blueprint proposes:
- add `say:` section parallel to extant `ref:` section
- follow same list format (dash-prefixed entries)
- no modification to extant entries

**verdict:** consistent. follows extant boot.yml structure.

---

## step 3: check for duplicated functionality

| new mechanism | duplicates extant? | evidence |
|---------------|-------------------|----------|
| guidance string | no | uses extant `guidance` field, no new type |
| header inline | no | matches extant inline patterns in route.ts, formatPatienceFriend.ts |
| brief file | no | new content, no extant "how to drive" brief |
| boot.yml say | no | additive section, no duplication |

---

## summary

**no mechanism inconsistencies found.**

| mechanism | extant pattern | blueprint approach | consistent? |
|-----------|----------------|-------------------|-------------|
| guidance string | multi-line strings in guidance field | multi-line string | yes |
| header inline | inline strings in route.ts, formatPatienceFriend.ts | inline string | yes |
| brief file | `howto.*.md` name convention | `howto.drive-routes.[guide].md` | yes |
| boot.yml say | `ref:` section with list entries | `say:` section with list entries | yes |

all mechanisms in the blueprint follow extant patterns. no new abstractions, no duplicated functionality.

---

## the owl reflects 🦉

> the river does not carve a new path when the old one flows true.
>
> the extant patterns serve.
> the blueprint follows them.
> consistency preserved. 🪷

