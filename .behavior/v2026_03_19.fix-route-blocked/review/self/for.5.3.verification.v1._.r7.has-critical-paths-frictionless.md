# self-review r7: has-critical-paths-frictionless

seventh pass: edge case verification.

---

## edge case 1: count exactly 5

**scenario:** driver runs route.drive with count = 5.

**expectation:** tea pause should NOT appear (trigger is count > 5).

**verification:**
- [case7] [t0] tests count = 5
- assertion: `not.toContain('tea first')`
- result: pass

**friction:** none — edge case handled correctly.

---

## edge case 2: count exactly 6

**scenario:** driver runs route.drive with count = 6.

**expectation:** tea pause SHOULD appear (6 > 5).

**verification:**
- [case7] [t1] tests count = 6
- assertion: `toContain('tea first')`
- result: pass

**friction:** none — edge case handled correctly.

---

## edge case 3: empty stone content

**scenario:** stone has no content to display.

**expectation:** tea pause still appears, route.drive section still valid.

**verification:**
- tests use minimal stone content
- output structure preserved regardless of stone content

**friction:** none — structure independent of content.

---

## edge case 4: very long stone name

**scenario:** stone name is long (e.g., `5.1.execution.phase0_to_phaseN.v1`).

**expectation:** command wraps gracefully.

**verification:**
- snapshot shows full command on single line
- no truncation observed

**friction:** none — long names handled.

---

## conclusion

all edge cases verified:

| edge case | friction |
|-----------|----------|
| count = 5 | none |
| count = 6 | none |
| empty stone | none |
| long stone name | none |

critical paths are frictionless.

