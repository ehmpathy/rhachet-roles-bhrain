# self-review: has-critical-paths-identified

## reviewed artifact

`.behavior/v2026_04_02.feat-achiever/3.2.distill.repros.experience._.v1.i1.md`

---

## critical paths identified

three critical paths were identified:

1. **triage on session end** — brain is halted until all asks covered
2. **goal creation with full schema** — brain must articulate why/what/how
3. **coverage verification** — brain sees zero uncovered → may continue

---

## review: are happy paths marked as critical?

**yes.** the three critical paths are the happy paths:
- user sends multi-part request → triage captures all asks → goals created → coverage verified
- this is the "day-in-the-life" from the vision

**no issues found.**

---

## review: why must each be frictionless?

| critical path | why frictionless | what happens if fails |
|---------------|------------------|----------------------|
| triage on session end | core promise is "no ask lost" — if the halt is unclear, brain may give up | asks escape, trust erodes |
| goal creation | forced foresight is the differentiation — if schema is too hard, brain shortcuts | shallow goals, no clarity |
| coverage verification | proof that triage worked — if verification is unclear, brain doesn't know if done | triage never completes |

**no issues found.** each critical path has clear why and failure consequence.

---

## review: pit of success for each critical path

### critical path 1: triage on session end

| pit of success | status | notes |
|----------------|--------|-------|
| narrower inputs | ✓ | no inputs — hook fires automatically |
| convenient | ✓ | brain doesn't invoke manually, hook does |
| expressive | n/a | hook behavior is fixed |
| failsafes | ✓ | if hook fails, session continues (no worse than today) |
| failfasts | ✓ | hook fails fast if inventory file is corrupted |
| idempotency | ✓ | can run triage multiple times safely |

### critical path 2: goal creation with full schema

| pit of success | status | notes |
|----------------|--------|-------|
| narrower inputs | ✓ | schema validation rejects incomplete goals |
| convenient | ⚠️ | stdin YAML is not maximally convenient |
| expressive | ✓ | full schema allows expression of differences |
| failsafes | ✓ | if write fails, error shown, can retry |
| failfasts | ✓ | schema validation fails fast on incomplete |
| idempotency | ✓ | same goal slug → update, not duplicate |

**issue: convenience could be better**

stdin YAML requires brain to construct heredoc. this is not maximally convenient, but is acceptable for v1. brain is capable. mitigation: add `--file` input option later if friction is high.

**verdict:** acceptable for v1. issue noted for future improvement.

### critical path 3: coverage verification

| pit of success | status | notes |
|----------------|--------|-------|
| narrower inputs | ✓ | no inputs beyond scope |
| convenient | ✓ | just run `goal.infer.triage` |
| expressive | ✓ | shows both uncovered asks and extant goals |
| failsafes | ✓ | if read fails, error shown |
| failfasts | ✓ | fails fast if files corrupted |
| idempotency | ✓ | read-only operation, always safe |

**no issues found.**

---

## conclusion

**critical paths are identified and hold.**

three critical paths cover the golden path:
1. triage on session end (auto, convenient)
2. goal creation (requires full schema, validates)
3. coverage verification (read-only, safe)

one minor issue noted: goal creation via stdin YAML could be more convenient. acceptable for v1; future improvement candidate.

all critical paths have pit of success coverage.
