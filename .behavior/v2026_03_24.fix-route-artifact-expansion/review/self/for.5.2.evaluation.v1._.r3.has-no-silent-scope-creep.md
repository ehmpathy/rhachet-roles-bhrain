# self-review: has-no-silent-scope-creep (r3)

## question

did any scope creep into the implementation?

---

## method

I compared the wish and blueprint against the actual changes to identify any work done outside the defined scope.

---

## scope boundaries

### wish scope

the wish specified:
1. expand `$route` in artifact globs
2. fix `getAllStoneArtifacts` to not use literal `$route` directory

### blueprint scope

the blueprint specified three changes:
1. expand `$route` to `input.route` in custom artifact patterns
2. remove `cwd: input.route` — glob runs from repo root
3. prefix default pattern with route path

files in scope per blueprint:
- `getAllStoneArtifacts.ts`
- `getAllStoneArtifacts.test.ts`

---

## changes made (from git diff)

### file 1: getAllStoneArtifacts.ts

changes:
- added `hasCustomArtifacts` variable extraction
- changed default pattern from `${input.stone.name}*.md` to `${input.route}/${input.stone.name}*.md`
- added `$route` expansion via `.replace(/\$route/g, input.route)`
- changed `cwd: input.route` to `cwd: process.cwd()`

**scope creep check:**
- hasCustomArtifacts extraction: documented as divergence, backup accepted (enables type-safe `!`)
- all other changes: within blueprint scope

**verdict**: no silent scope creep. all deviations documented.

### file 2: getAllStoneArtifacts.test.ts

no changes made. documented as divergence with backup rationale (acceptance test covers).

**verdict**: no scope creep (removal, not addition).

### file 3: parseStoneGuard.ts

changes:
- added quote strip for artifact values: `.replace(/^["'](.*)["']$/, '$1')`

**scope creep check:**
this file was NOT in the blueprint. however:
1. the change was required for the fix to work
2. without quote strip, artifact patterns contain literal `"` characters
3. the glob would never match

**verdict**: this is scope expansion, but it was documented as divergence with backup rationale. the YAML parser bug was discovered at implementation time.

---

## silent scope creep checklist

| question | answer | evidence |
|----------|--------|----------|
| did I add features not in the blueprint? | yes, quote strip | documented in divergence table |
| did I change things "while I was in there"? | no | only changed what was necessary |
| did I refactor unrelated code? | no | no changes outside the three files |
| are all deviations documented? | yes | evaluation artifact lists 4 divergences |

---

## potential scope creep items

### 1. parseStoneGuard.ts quote strip

**is this scope creep?**
yes, technically — it was not in the blueprint.

**is it silent?**
no — it is documented in the evaluation artifact as "quote strip added" with backup rationale.

**should it be repaired or backed up?**
backup is correct because:
1. the fix would not work without it
2. it was discovered at implementation time, not foreseeable at blueprint time
3. it is minimal and targeted (one regex, two lines)

### 2. hasCustomArtifacts variable extraction

**is this scope creep?**
no — this is implementation detail, not feature scope.

**is it silent?**
no — documented in divergence table.

---

## found issues: none

all changes are either:
1. within blueprint scope, or
2. documented divergences with valid backup rationales

no silent scope creep detected.

---

## conclusion

the implementation stayed within scope. two items expanded scope (quote strip, hasCustomArtifacts extraction), but both are documented divergences with backup resolutions. no repairs needed.

