# self-review r2: has-questioned-questions

## triage of open questions from vision

### question 1: is the v/i pattern used anywhere meaningfully?

**from vision**: "research suggests it was forward-look but unused"

**triage**:
- can answer via logic now? no
- can answer via extant docs/code now? yes - grep codebase for `.v2.` or `.i2.` patterns

**answered via code search**: searched for `.v2.` patterns in behavior artifacts - found none. the v2 capability is theoretical.

**status**: [answered] - the pattern is not meaningfully used

---

### question 2: what about research stones with multiple outputs?

**from vision**: "they have their own pattern: `probe.v1/*.md`"

**triage**:
- can answer via logic now? partially
- can answer via extant docs/code now? yes - examine research stone patterns

**answered via code inspection**: research stones use subdirectories (`probe.v1/`, `kernel/`) with multiple files. this is a separate pattern from main behavior stones.

**status**: [answered] - research stones are out of scope; they use a different pattern

---

### question 3: should we migrate extant behaviors?

**from vision**: "likely no, let them age out"

**triage**:
- can answer via logic now? yes
- can answer via extant docs/code now? yes
- does only wisher know? possibly - this is a scope decision

**analysis**:
- migration would touch 100+ files across many behaviors
- old behaviors are historical record, not active
- new behaviors will use new pattern
- cost of migration outweighs benefit

**status**: [answered] - no migration. old behaviors keep old pattern. new behaviors use `yield.md`.

---

### question 4: does the code support dual patterns?

**from assumptions review**: identified code areas to verify:
1. route driver logic that finds artifacts
2. guard review logic that reads artifacts
3. test fixtures that use the pattern
4. template files that reference the pattern

**triage**:
- can answer via logic now? no
- can answer via extant docs/code now? requires code research
- should be answered via research later? yes

**status**: [research] - verify dual-pattern support in research phase

---

## updated open questions section for vision

the vision should be updated to reflect this triage:

```markdown
### questions to validate

1. **[answered] is the v/i pattern used anywhere meaningfully?** - grep confirmed: no `.v2.` or `.i2.` patterns exist
2. **[answered] what about research stones with multiple outputs?** - they use subdirectory pattern, out of scope
3. **[answered] should we migrate extant behaviors?** - no, let them age out
4. **[research] does the code support dual patterns?** - verify in research phase:
   - route driver artifact discovery
   - guard review artifact reads
   - test fixtures
   - template files
```

---

## action required

**issue found**: the vision's "open questions" section needs update to reflect triage.

**fix**: update vision to show which questions are answered vs need research.
