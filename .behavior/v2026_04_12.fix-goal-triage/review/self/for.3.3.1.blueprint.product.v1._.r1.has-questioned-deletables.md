# self-review r1: has-questioned-deletables

## what could be removed?

### 1. negative tests for `--mode` flag

**the question**: do we need a test that `--mode hook.onStop` errors or is ignored?

**answer**: yes, keep it. hard break means the old flag should fail cleanly. without this test, we might accept `--mode` silently and confuse users who reference old docs.

### 2. negative test for old skill name

**the question**: do we need a test that `goal.infer.triage` (old name) fails?

**answer**: yes, keep it. confirms the rename is complete. if the old entrypoint still exists, this test catches it.

### 3. `status=blocked` test case

**the question**: is testing `blocked` status redundant with `enqueued` and `inflight`?

**answer**: no. `blocked` is a distinct branch in the lifecycle. it should be in goalsComplete (past triage). worth keeping to prove the partition logic handles all non-incomplete statuses.

### 4. `status=fulfilled` test case

**the question**: same question — is `fulfilled` redundant?

**answer**: no. `fulfilled` is the terminal state. confirms goals don't get stuck in "incomplete" even at the end of lifecycle.

### 5. implementation order section

**the question**: is specifying implementation order necessary in a blueprint?

**answer**: yes. the order matters: getTriageState fix must come before goal.ts changes because goal.ts depends on correct triage state. tests should accompany each change. order prevents broken intermediate states.

---

## do all features trace to wisher requirements?

| blueprint feature | traces to |
|-------------------|-----------|
| actionable command per goal | 0.wish.md: "it should tell them how to complete the goals" |
| `--mode` → `--when` | 0.wish.md: "its a new convention we've adopted" |
| skill rename `goal.infer.triage` → `goal.triage.infer` | 0.wish.md: "they should be symmetric" |
| fix status.choice partition | 0.wish.md: "how is it possible that goal.triage.infer can consider a goal with status=incomplete as complete?" |
| per-goal tip in goal.triage.next | 0.wish.md: "just have a subbranch under each (1), (2)..." |
| field flags syntax | wisher feedback in vision session: corrected to `--why.purpose "..."` |
| thorough test coverage | wisher feedback in vision session: "ensure thorough positive and negative test coverage" |

all features in the blueprint trace directly to:
- the original wish (0.wish.md)
- wisher feedback in the vision session

no orphan features found.

---

## conclusion

no features to delete. all are load-bearing and trace to wisher requirements.

