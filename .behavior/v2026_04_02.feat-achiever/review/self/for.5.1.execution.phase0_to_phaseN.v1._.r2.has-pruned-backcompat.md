# self-review: has-pruned-backcompat (r2)

## stone
5.1.execution.phase0_to_phaseN.v1

## question
have i added backwards compatibility that was not explicitly requested?

## answer
no. this is greenfield code with no prior versions to maintain.

## fresh review of actual code

### setGoal.ts (237 lines)

read through entire file. patterns examined:

1. **line 33-39: try/catch for stat failure**
   ```typescript
   try {
     const dirStat = await fs.stat(input.scopeDir);
     offset = Math.floor((now - dirStat.mtimeMs) / 1000);
   } catch {
     // if stat fails, use 0
   }
   ```
   **verdict:** error handler for new directory creation, NOT backwards compat.

2. **line 73: optional when field**
   ```typescript
   ...(input.goal.when && { when: input.goal.when }),
   ```
   **verdict:** proper optional field per schema, NOT backwards compat.

3. **no version checks anywhere** — searched for "version", "v1", "v2", "legacy", "migrate"

### getGoals.ts (100 lines)

read through entire file. patterns examined:

1. **line 30-35: directory not found handler**
   ```typescript
   try {
     await fs.access(input.scopeDir);
   } catch {
     return { goals: [] };
   }
   ```
   **verdict:** valid edge case (no goals yet), NOT backwards compat.

2. **line 66: default status choice**
   ```typescript
   let statusChoice: GoalStatusChoice = 'enqueued';
   ```
   **verdict:** crash recovery for incomplete writes, NOT backwards compat. the status flag should always exist for valid goals. this handles partial writes, not schema evolution.

3. **line 83: optional reason with default**
   ```typescript
   reason: (parsed.status as { reason?: string })?.reason ?? '',
   ```
   **verdict:** defensive parse for malformed YAML, NOT backwards compat.

### inits/ directory (newly added for onTalk hook)

examined all three files. no backwards compat patterns:
- init.claude.sh — checks if settings.json exists, creates if absent
- init.claude.hooks.sh — checks if hook already present, skips if so
- userpromptsubmit.ontalk.sh — simple hook invocation

**verdict:** idempotent setup logic, NOT backwards compat.

## why backwards compat is not applicable

1. **greenfield role** — achiever is brand new, no prior version
2. **no consumers** — no code depends on these operations yet
3. **no files to migrate** — no `.goals/` directories exist yet
4. **no schema evolution** — this IS the first schema

## conclusion

reviewed all implementation files line by line. found only:
- error handlers for filesystem edge cases
- defensive parse logic for malformed input
- idempotent setup logic

none of these are backwards compatibility patterns. no backwards compat code added because none was needed.

---

## re-review 2026-04-07

i pause. i breathe. i am the reviewer.

---

### deeper check: YAML format choice

**question:** is YAML format a backwards compat consideration?

**answer:** no. YAML was chosen for human readability (per vision). no JSON→YAML migration path exists because there was no prior format. this is a design choice, not backwards compat.

**verdict:** NOT backwards compat — first implementation

---

### deeper check: JSONL for asks/coverage

**question:** is JSONL append-only a backwards compat consideration?

**answer:** no. JSONL was chosen for audit trail (per wish "we can see the surround context"). append-only is a design choice for auditability, not for backwards compat with prior formats.

**verdict:** NOT backwards compat — deliberate design

---

### deeper check: optional fields in Goal schema

**question:** are optional fields (why?, what?, how?) backwards compat?

**answer:** no. optional fields enable partial goals (per criteria usecase.5 "quick capture"). this is a forward design choice for user experience, not backwards compat with a prior schema.

**verdict:** NOT backwards compat — supports partial goals

---

### deeper check: meta.complete and meta.absent

**question:** is the completeness indicator backwards compat?

**answer:** no. meta fields are new functionality for triage reminders (per criteria usecase.5). no prior goal format lacked these fields. this is new capability, not backwards compat.

**verdict:** NOT backwards compat — new feature

---

## final verdict

re-review confirms: no backwards compat code added.

all patterns found are:
- error handlers for filesystem edge cases
- defensive parse for malformed input
- idempotent setup logic
- design choices for new features

greenfield code has no backwards to be compat with.

---

### deeper check: status flag file pattern

**question:** is the status=enqueued.flag pattern backwards compat?

**answer:** no. the flag file pattern was a design choice per vision:

> **why flag files?** — status.choice visible from filename alone. no file parse needed. `glob('**/*.status=inflight.flag')` finds all active goals in O(1) per file.

this pattern was chosen for ergonomics, not to support a prior status storage format.

**verdict:** NOT backwards compat — ergonomic design choice

---

### deeper check: CLI flag interface

**question:** is the dual-mode CLI (YAML stdin vs flags) backwards compat?

**answer:** no. per criteria usecase.5:

> **interface:** partial goals use CLI flags, not YAML stdin.

the dual mode supports two use cases (full goals vs quick capture), not two schema versions. both modes produce the same Goal format.

**verdict:** NOT backwards compat — dual interface for different use cases

---

### deeper check: scope detection

**question:** is the route vs repo scope detection backwards compat?

**answer:** no. per wish line 63:

> 1. into the $route/.goals/ dir, if within a route
> 2. into the reporoot/.goals/ dir, if not within a route

scope detection is core design, not migration logic between scope storage locations.

**verdict:** NOT backwards compat — scoped storage design

---

## absolute final verdict

exhaustive re-review confirms: zero backwards compat code.

**searched for and found none of:**
- version checks
- schema migration
- format conversion
- legacy path support
- deprecated field support

this is v1. there is no v0 to be compat with.
