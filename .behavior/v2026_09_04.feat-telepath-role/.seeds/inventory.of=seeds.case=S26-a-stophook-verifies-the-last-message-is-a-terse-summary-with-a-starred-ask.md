# seed S26 — a stophook verifies the last message is a terse summary with a starred ask

## .said

> one more question. would a stophook that asks the brain to verify that the last message was a
> terse, concice, summary - with an actionable ask starred if any - be clear? i.e., eliminate the
> chain of thought and just summarize. would that help? it could serve as a reminder to be terse
> and elucidate in general, but also help remind to summarize and give an actionable output at the
> end

## .settled

a **stop-time verifier over the emitted message** is the mechanism that reaches the message half of
the canon. it grades three properties of the last message:

1. it is a **terse summary** — the chain of thought is not in it
2. an **actionable ask is starred**, if there is one
3. it **elucidates** — the point is findable

⇒ **it is the only surface that reaches a live message.** a reviewer reads files; a brief was
measured insufficient (asks with headers, missed). so this is the one mechanism left, and it is what
closes the message-half fail-safe.

🟡 **its bound is a platform fact, not a design choice**: a stop-time hook fires **after** the
message is emitted, so it produces a *second, corrected* message — never a *first* correct one. the
correction lands within the turn; a reader has already seen the ramble.

**"eliminate the chain of thought" requires a DESTINATION, not a deletion.** the overflow instinct
is real and a bare cut fights it. the verifier and a notes valve are one mechanism in two parts:

| part | its job |
|---|---|
| the **verifier** | detects the overflow in the emitted message |
| the **notes valve** | gives the overflow a home, ref'd from the dense message |

⇒ so a verifier shipped without a valve teaches a brain to suppress rather than to rehome.

🟡 **the verifier must be CONDITIONAL, or it manufactures the defect it grades.** a turn that
answered a yes/no in one word owes no summary and has no ask to star. a hook that demands both every
turn produces a purposeless section — the exact shape the canon forbids.

## .landed

- `src/domain.roles/telepath/briefs/rule.forbid.purposeless-passages.md`
- `.behavior/v2026_09_04.feat-telepath-role/.seeds/inventory.of=seeds.case=S25-agent-notes-as-the-overflow-valve.md`
