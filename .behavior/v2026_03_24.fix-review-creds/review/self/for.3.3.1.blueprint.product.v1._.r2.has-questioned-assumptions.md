# self-review: has-questioned-assumptions (r2)

## stone: 3.3.1.blueprint.product.v1

---

## second pass: deeper examination

took a breath. re-read the blueprint line by line. questioned each choice.

---

## re-examined assumptions

### 1. getKeyrackKeyGrant api

**r1 verdict**: valid, verify at implementation.

**r2 deeper look**:
- what if the api is `keyrack.get()` instead of `getKeyrackKeyGrant()`?
- what if it returns a different shape?

**action**: the blueprint uses a pattern, not a literal api. the actual api call will be discovered and adapted. the grant status discriminant pattern is the key insight — whatever the api name, we handle each status.

**holds**: yes, the pattern is sound.

---

### 2. four grant statuses

**r1 verdict**: valid with exhaustiveness check.

**r2 deeper look**:
- re-read the research on keyrack sdk
- the statuses 'granted', 'absent', 'locked', 'blocked' cover the domain:
  - granted = key available
  - absent = key not set
  - locked = session not unlocked
  - blocked = permission denied
- any new status (e.g., 'expired') would fail exhaustiveness check at compile time

**holds**: yes, the design handles future statuses safely.

---

### 3. xai/ prefix

**r1 verdict**: valid based on convention.

**r2 deeper look**:
- DEFAULT_BRAIN = 'xai/grok/code-fast-1'
- other brains: 'anthropic/claude/...', 'openai/gpt/...'
- the provider/model/variant convention is consistent
- no counterexamples found in research

**holds**: yes, prefix check is reliable.

---

### 4. ehmpath owner

**r1 verdict**: valid per wish.

**r2 deeper look**:
- wish says "ehmpath owner"
- could this cause friction for non-ehmpathy contributors?
- mitigation: keyrack.yml documents the owner
- future: could make owner configurable via env or config

**holds**: yes for initial implementation. documented for visibility.

---

### 5. process.exit(2)

**r1 verdict**: valid per convention.

**r2 deeper look**:
- rule.require.exit-code-semantics.md: 2 = constraint (user must fix)
- this is exactly the scenario: user must unlock keyrack or set key
- exit(1) would be wrong (implies malfunction)
- exit(0) would be wrong (implies success)

**holds**: yes, exit code 2 is correct.

---

### 6. console.error for errors

**r1 verdict**: valid per extant patterns.

**r2 deeper look**:
- rule.forbid.stdout-on-exit-errors: errors must go to stderr
- stepReview uses console.error for fail-fast messages
- treestruct format with owl vibe is consistent

**holds**: yes, console.error matches the codebase.

---

### 7. genContextBrain supplier parameter

**r1 verdict**: valid, verify at implementation.

**r2 deeper look**:
- what if genContextBrain doesn't accept supplier?
- fallback: could merge supplier context after genContextBrain call
- the supplier pattern is from rhachet-brains-xai — it expects `context['brain.supplier.xai']`
- we create this context shape regardless of how we pass it

**holds**: yes, the supplier context shape is the key, not how it's passed.

---

### 8. keyrack envvar passthrough

**r1 verdict**: assumption per vision, verify in test.

**r2 deeper look**:
- vision states: "keyrack handles envvar passthrough internally"
- this means: if key absent from vault but present as envvar, keyrack returns it
- what if this is wrong?
- fallback: acceptance test will reveal. can add explicit envvar check if needed.

**holds**: assumption documented. test will validate.

---

### 9. single keyrack call

**r1 verdict**: valid based on keyrack design.

**r2 deeper look**:
- keyrack.get is stateless
- unlock is a separate, prior step
- no session to establish at call time

**holds**: yes, single call is sufficient.

---

### 10. concurrent access

**r1 verdict**: valid, keyrack handles it.

**r2 deeper look**:
- each cli invocation is a separate process
- keyrack vault is read-only once unlocked
- no write contention possible from review skill

**holds**: yes, no concurrency concerns.

---

## simpler approach reconsideration

**question**: could we skip the separate file and inline keyrack logic?

**reconsidered**:
- review.ts needs keyrack for xai
- reflect.ts needs keyrack for xai (per wish: consistency)
- inlining duplicates the fail-fast logic
- separate file: write once, test once, use twice

**conclusion**: separate file is simpler in total lines and maintenance.

---

## architectural habit check

**question**: is the supplier pattern from habit or evidence?

**answer**: evidence.
- rhachet-brains-xai defines BrainSuppliesXai
- supplier pattern enables lazy credential fetch
- credentials fetched only when brain actually invokes api
- this is the intended integration point

---

## final verdict

all assumptions hold after deeper examination. no blueprint changes required.

the design is minimal and evidence-based.

