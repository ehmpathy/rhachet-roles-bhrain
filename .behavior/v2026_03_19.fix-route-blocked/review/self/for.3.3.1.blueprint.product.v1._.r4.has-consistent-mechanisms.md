# self-review r4: has-consistent-mechanisms

review for new mechanisms that duplicate extant functionality.

---

## new mechanisms in blueprint

identify what NEW mechanisms the blueprint introduces:

### 1. tea pause section (formatRouteDrive)

**what it is**: new block of lines.push() calls to render tea pause tree

**does it duplicate extant functionality?**

search codebase for similar patterns:

1. **drum nudge block** (stepRouteDrive.ts lines ~430-445):
   - also uses lines.push() with tree format
   - triggered by `state.count >= 7`
   - different content but same mechanism

2. **bottom command prompt** (stepRouteDrive.ts lines ~450-460):
   - also uses lines.push() for commands
   - similar structure to tea pause options

**r4 result**: tea pause EXTENDS the extant pattern (lines.push with tree format). it does not introduce a new mechanism. consistent with drum nudge and bottom prompt.

**verdict**: ✅ consistent with extant mechanisms

---

### 2. skill header update (route.stone.set.sh)

**what it is**: expanded bash comment block with more usage examples

**does it duplicate extant functionality?**

search codebase for header patterns:

1. **extant route.stone.set.sh header** (lines 1-15):
   - already has .what, usage, options sections
   - blueprint EXTENDS this, doesn't replace

2. **other skill headers** (e.g., route.drive.sh, route.bind.set.sh):
   - follow same .what/.why/usage/options pattern
   - blueprint matches this established style

**r4 result**: header update is an EXTENSION of extant documentation pattern. no new mechanism introduced.

**verdict**: ✅ consistent with extant header style

---

### 3. boot.yml skills.say section

**what it is**: new yaml section under `always:`

**does it duplicate extant functionality?**

search codebase for boot.yml patterns:

1. **mechanic's boot.yml** (checked in r1 assumptions):
   - has `skills: say:` section
   - exact same pattern as blueprint proposes

2. **driver's boot.yml** (current):
   - only has `briefs: ref:` section
   - blueprint ADDS skills.say as sibling

**r4 result**: skills.say is a standard rhachet feature. blueprint reuses extant mechanism from mechanic role. no duplication.

**verdict**: ✅ reuses extant boot.yml mechanism

---

### 4. test case [case7]

**what it is**: new test case for tea pause

**does it duplicate extant functionality?**

search test patterns:

1. **[case6] drum nudge tests** (stepRouteDrive.test.ts):
   - tests hook mode with count >= 7
   - uses same test structure (given/when/then)
   - uses same snapshot pattern

2. **[case4] vibecheck snapshots**:
   - tests direct mode output
   - uses snapshot for output verification

**r4 result**: [case7] follows extant test patterns exactly. reuses given/when/then structure and snapshot approach.

**verdict**: ✅ consistent with extant test patterns

---

## cross-check: utilities and operations

search for utilities that tea pause could reuse instead of inline code:

### could we use a shared tree formatter?

**search results**:
- no shared tree formatter function found
- each section (drum nudge, route tree, stone content) builds tree inline
- tea pause follows this same inline approach

**r4 result**: no extant tree formatter utility to reuse. inline approach is consistent.

### could we use a shared command builder?

**search results**:
- command strings are built inline: `rhx route.stone.set --stone ${stone} --as ${status}`
- no shared command builder function found
- tea pause builds commands same way as extant bottom prompt

**r4 result**: no extant command builder utility. inline approach is consistent.

---

## summary

| mechanism | extant pattern found? | blueprint approach |
|-----------|----------------------|-------------------|
| tea pause lines | drum nudge, bottom prompt | extends pattern ✅ |
| skill header | extant headers | extends pattern ✅ |
| boot.yml section | mechanic's boot.yml | reuses pattern ✅ |
| test case | [case6], [case4] | follows pattern ✅ |

**utilities checked**:
- tree formatter: none extant → inline is correct
- command builder: none extant → inline is correct

---

## conclusion

all new mechanisms in the blueprint are consistent with extant patterns:

1. tea pause uses same lines.push() tree format as drum nudge
2. skill header follows established .what/.why style
3. boot.yml reuses skills.say from mechanic role
4. test case follows extant BDD structure

no duplicate mechanisms found. no extant utilities bypassed.

**r4 verdict**: blueprint passes mechanism consistency review. all mechanisms align with codebase patterns.
