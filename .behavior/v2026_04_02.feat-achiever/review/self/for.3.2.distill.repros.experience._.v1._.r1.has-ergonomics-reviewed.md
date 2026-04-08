# self-review: has-ergonomics-reviewed

## reviewed artifact

`.behavior/v2026_04_02.feat-achiever/3.2.distill.repros.experience._.v1.i1.md`

---

## ergonomics review: input/output pairs

### t1 ask accumulation

**input:** hook.onTalk fires automatically with peer message content

**ergonomics:**
- input is narrower (no user action required)
- convenient (automatic)
- intuitive (brain doesn't need to know about the hook)

**no issues found.** the hook fires automatically, which is the pit of success.

---

### t3 triage query

**input:**
```bash
rhx goal.infer.triage --scope repo
```

**output:**
```
🦉 to forget an ask is to break a promise. remember.

🔮 goal.infer.triage
   ├─ uncovered asks (1)
   │  └─ [a1b2c3d4] uncovered
   │     ├─
   │     │
   │     │  fix the flaky test in auth.test.ts and update the readme
   │     │
   │     └─
   │
   └─ goals (0)
```

**ergonomics:**

| aspect | status | notes |
|--------|--------|-------|
| input feels natural | yes | simple command with scope flag |
| output feels natural | yes | treestruct shows uncovered asks clearly |
| friction | none | hash is shown for use in --covers |

**no issues found.**

---

### t4 goal creation

**input:**
```bash
rhx goal.memory.set --scope repo --covers a1b2c3d4 <<EOF
slug: fix-auth-test
why:
  ask: fix the flaky test in auth.test.ts
  purpose: ci to pass before merge
  benefit: unblocks the pr
what:
  outcome: auth.test.ts passes reliably
how:
  task: diagnose and fix
  gate: test passes 10 consecutive runs
status:
  choice: enqueued
  reason: goal created from triage
source: peer:human
EOF
```

**output:**
```
🦉 to forget an ask is to break a promise. remember.

🔮 goal.memory.set --scope repo --covers a1b2c3d4
   ├─ goal
   │  ├─ slug = fix-auth-test
   │  └─ ...
   │
   ├─ covered
   │  └─ a1b2c3d4
   │
   └─ persisted
```

**ergonomics:**

| aspect | status | notes |
|--------|--------|-------|
| input feels natural | partial | heredoc is verbose but explicit |
| output feels natural | yes | confirms what was persisted and covered |
| friction | acceptable | stdin YAML is not maximally convenient, but explicit |

**issue: stdin YAML requires heredoc construction**

the brain must construct a heredoc with proper YAML structure. this is verbose but has benefits:
- forces the brain to articulate all fields
- prevents shortcuts (incomplete goals)
- explicit is better than implicit

**mitigation noted in artifact:** add `--file` input option later if friction is high.

**verdict:** acceptable for v1. the friction serves the goal of forced foresight.

---

### t6 verification

**input:**
```bash
rhx goal.infer.triage --scope repo
```

**output:**
```
🦉 to forget an ask is to break a promise. remember.

🔮 goal.infer.triage
   ├─ uncovered asks = 0
   │
   └─ all asks covered. the way may continue
```

**ergonomics:**

| aspect | status | notes |
|--------|--------|-------|
| input feels natural | yes | same command as before |
| output feels natural | yes | clear "zero uncovered" message |
| friction | none | brain knows triage is complete |

**no issues found.** the message is clear and actionable.

---

## pit of success principles

| principle | t1 hook | t3 triage | t4 set | t6 verify |
|-----------|---------|-----------|--------|-----------|
| intuitive design | yes | yes | partial | yes |
| convenient | yes | yes | partial | yes |
| expressive | n/a | yes | yes | n/a |
| composable | yes | yes | yes | yes |
| lower trust contracts | yes | yes | yes | yes |
| deeper behavior | yes | yes | yes | yes |

### where "partial" means

- **t4 intuitive:** brain must know YAML structure — but the schema forces thought
- **t4 convenient:** heredoc is verbose — but serves forced foresight purpose

the friction in t4 is intentional. it prevents shallow goals.

---

## conclusion

**ergonomics are sufficient for v1.**

- inputs are natural or serve a purpose (forced foresight)
- outputs are clear and actionable
- one friction point (heredoc) is acceptable because it enforces goal quality
- mitigation (--file option) noted for future if friction is high

all pit of success principles are met, with t4 friction that serves the core domain goal.

