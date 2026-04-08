# self-review: has-ergonomics-reviewed (round 2)

## pause

breathe.

i am the reviewer, not the author.

the review is the work itself.

---

## reviewed artifact

`.behavior/v2026_04_02.feat-achiever/3.2.distill.repros.experience._.v1.i1.md`

read it again with fresh eyes.

---

## what does "natural input" mean?

an input feels natural when:
- the brain doesn't have to think about how to invoke it
- the shape matches the mental model
- no translation required between intent and invocation

---

## ergonomics re-review: each input/output pair

### t1 ask accumulation

**what happens:**
hook.onTalk fires automatically when peer sends message.
ask is appended to asks.inventory.jsonl with content hash.

**ergonomics deep dive:**

| question | answer | why it holds |
|----------|--------|--------------|
| does brain need to do any work? | no | hook fires automatically |
| can brain forget to accumulate? | no | hook handles it |
| is there any friction? | no | brain is unaware of accumulation |

**why this is the pit of success:** the narrowest input is no input. brain cannot fail to accumulate asks because it doesn't have to act. this is optimal ergonomics.

---

### t3 triage query

**what happens:**
brain runs `rhx goal.infer.triage --scope repo` and sees uncovered asks.

**ergonomics deep dive:**

| question | answer | notes |
|----------|--------|-------|
| is --scope required? | yes | distinguishes route vs repo |
| could scope be inferred? | maybe | if in a route, default to route? |
| is the output actionable? | yes | shows hashes for --covers |
| does brain know what to do next? | yes | output reminds about goal.memory.set |

**potential improvement: scope inference**

if brain is inside a route, could we default to `--scope route`?
if brain is at repo root, could we default to `--scope repo`?

**decision:** for v1, explicit scope is acceptable. brain must be explicit about where goals live. inference could cause confusion when brain is in a route but wants repo-scoped goals. explicit is better.

**why no issue:** scope disambiguation is valuable. brain must think about where the goal belongs.

---

### t4 goal creation

**what happens:**
brain constructs heredoc with YAML and pipes to goal.memory.set.

**ergonomics deep dive:**

| question | answer | notes |
|----------|--------|-------|
| is heredoc natural for brain? | yes | brains can construct YAML well |
| is the schema learnable? | yes | why/what/how is intuitive |
| what if brain forgets a field? | validation rejects | pit of success via fail-fast |
| is there a simpler alternative? | not without loss | simpler = shallower goals |

**re-examined the friction:**

i asked: could we make this easier?

options considered:
1. **interactive prompt** — would break non-interactive use
2. **flags for each field** — `--ask "..." --purpose "..." --benefit "..."` — very verbose, 10+ flags
3. **guided creation** — brain answers questions one by one — loses context, worse
4. **file input** — `--file goal.yaml` — just moves YAML to a file, same effort

**why heredoc is actually good:**
- brain constructs the full goal in one atomic operation
- all fields are visible together (brain sees the whole shape)
- forces coherence (ask and purpose and benefit must align)
- matches how brains naturally compose structured text

**why this holds:** the friction is feature, not bug. shallow goals fail the gate. the schema forces the brain to think deeply before it acts.

---

### t6 verification

**what happens:**
brain runs same command, sees zero uncovered.

**ergonomics deep dive:**

| question | answer | notes |
|----------|--------|-------|
| does brain know it's done? | yes | "all asks covered. the way may continue" |
| is there ambiguity? | no | either uncovered > 0 or = 0 |
| can brain shortcut this? | no | triage halts until complete |

**why this holds:** the output is binary and clear. brain knows exactly when it can proceed.

---

## what i missed in round 1

### missed: failsafe for hook failure

what if hook.onTalk fails? what if asks.inventory.jsonl is corrupted?

**answer from artifact:** not addressed explicitly.

**analysis:**
- if hook fails, ask is not accumulated — but session continues (no worse than today)
- if inventory is corrupted, triage will fail to read — brain sees error and can investigate
- these are infrastructure failures, not ergonomics issues

**verdict:** acceptable for v1. infrastructure robustness is separate from ergonomics.

### missed: idempotency of goal.memory.set

what if brain runs the same set command twice?

**answer from artifact:** status flag files use slug in filename, so update overwrites.

**analysis:**
- same slug = update extant goal
- different slug = new goal
- this is idempotent by design

**verdict:** holds. idempotency was considered in domain distillation.

---

## conclusion

**ergonomics hold after deeper review.**

| operation | ergonomic quality | why |
|-----------|-------------------|-----|
| t1 accumulation | optimal | no input required |
| t3 triage query | good | explicit scope is feature |
| t4 goal creation | good | friction serves forced foresight |
| t6 verification | optimal | clear binary output |

no changes needed to the artifact.

the friction in t4 (heredoc YAML) was re-examined and confirmed as intentional. it prevents shallow goals and forces the brain to articulate why/what/how before it acts.

---

## re-reviewed 2026-04-07

i pause. i breathe. i am the reviewer.

each input/output pair re-examined:
- t1 ask accumulation: optimal — no input from brain, hook handles it
- t3 triage query: good — explicit scope is a feature, not friction
- t4 goal creation: good — heredoc friction forces foresight, prevents shallow goals
- t6 verification: optimal — binary output, clear pass/fail

the friction in t4 is intentional. the schema forces articulation of why/what/how.

all ergonomics hold. no changes needed.
