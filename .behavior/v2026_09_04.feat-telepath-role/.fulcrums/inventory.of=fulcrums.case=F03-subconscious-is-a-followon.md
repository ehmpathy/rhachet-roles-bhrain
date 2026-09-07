# F03 · #414 SPLITS — the message-half nudge is in scope; the broader watcher is a follow-on

- **rework** = clean · **status** = open · **confidence** = 85%

## .the call CHANGED — a peer review forced it, and the change is recorded rather than swapped in

this fulcrum read *"the subconscious is a follow-on, not this scope"* at 65%, then 75%. the `experience-coverage` peer reviewer rejected the vision on it (`r002`, 1 blocker):

> *"case=6 is a sharp critipath with no fail-safe demonstrated … a declared gap is still a gap under the rule … the only mechanism that could close it (subconscious, #414) is deferred under F03, which does not discharge the fail-safe obligation."*

⇒ **the reviewer is right, and the deferral was never severable from the coverage obligation.** what makes the repair possible is a fact that arrived after the original call: the mechanism is paved.

| what F03 originally priced | what is measured |
|---|---|
| #414 is a whole mechanism — background dispatch, budget, cry-wolf guard, carve-out taxonomy | the message-half nudge is a rubric and a hook line. the slot, the budget convention, and a nudge precedent all exist |

⇒ so the fork was never *"ship #414 or defer it."* it was: which HALF of #414 does coverage force?

## .the fork, restated

| option | what it means |
|---|---|
| **in scope, whole** | ship the full watcher — the file grader, the cry-wolf guard, the carve-out taxonomy |
| **follow-on, whole** | **rejected by the peer reviewer.** it leaves `case=6` a sharp critipath with no fail-safe |
| **split** | ship the **message-half nudge** (coverage-forced); defer the rest |

## .taken, and why

**split.**

- `rule.require.experience-coverage` grades a sharp critipath with no fail-safe a **blocker**, and `case=6` is the only cell in the inventory in that state. the nudge is its **only** reachable mechanism, so coverage forces it
- the **file** half is already covered by the reviewer, so no coverage rule forces the broader watcher. it stays a follow-on on its own merits — #414's four unanswered design questions are all in that half
- ⇒ the split is what the coverage rule actually demands. it does not demand the cry-wolf guard or the carve-out taxonomy

## .what the in-scope half costs

| piece | state |
|---|---|
| the `Stop` slot | live, two users, `timeout: 5` (`.claude/settings.json:253-271`) |
| the message payload | `last_assistant_message` (`code.claude.com/docs/en/hooks.md`) |
| a nudge precedent | `learn.domain.terms --when hook.onStop` |
| **the rubric** | new — *"does this message carry an unstarred ask?"* |
| **the hook line** | new — one entry beside the extant two |

## .and the obligation it discharges is TWO of three — the third is a platform limit

| obligation | met | why |
|---|---|---|
| **loud** | | the stop is blocked; the turn does not end quietly |
| **teaches the fix** | | the nudge names the rule |
| **fast** | ❌ | `Stop` fires **after** emit. `MessageDisplay` fires at display. a `PreRender` hook is an open feature request (`anthropics/claude-code#61152`), never a shipped surface |

⇒ **an unreachable obligation is not an undischarged one.** no mechanism reaches a message before a human reads it, so two-of-three is the strongest fail-safe that exists for this cell — and it is strictly better than the none this fulcrum previously shipped.

## .confidence

**85%.**

- the coverage rule forces the in-scope half and the mechanism is verified paved, so the *floor* is firm
- the residual is the **boundary** — whether the message-half nudge can ship with no cry-wolf guard
  - the broader watcher was to supply that guard
  - a nudge that fires on every message is worse than none, and this vision has not sized it

---

_the original entry follows, unedited, so the reversal is auditable._

🟡 it is **not** bulletized, and deliberately: a preserved record whose whole contract is *unedited* cannot be reformatted, since the reformat voids the claim it exists to make. `rule.require.bulletize`'s verbatim exemption is the same ground.

---

- **rework** = clean · **status** = superseded above · **confidence** = **65%** (was 75%; lowered by the fail-safe ledger, below)

## .the fork, stated fairly

the wish states the call is mine: *"whether the subconscious in #414 is in scope or a follow-on"*.

| option | what it means |
|---|---|
| **in scope** | this behavior ships a cheap background brain that nudges via `rhx clone say` |
| **follow-on** | this behavior ships the briefs + the reviewer; the watcher is caught as a dream |

## .taken, and why at the time

**follow-on.**

- the wish's acceptance lines are satisfiable without it — the role, its briefs, a reviewer, and a cheap reviewer are all four, and none names a watcher
- #414 itself lists **four open questions** it does not answer: what it reads, how it avoids a false interrupt, what the carve-outs are, and whether it nudges or blocks
- ⇒ a mechanism with four unanswered design questions inside a behavior that already carries ten issues is how a route grows the 35x yield this wish exists to prevent
- it needs machinery this behavior does not touch: a background dispatch, a cheap-brain budget, a cry-wolf guard, and the measurement-vs-changelog carve-out taxonomy

## .what this defers, stated honestly rather than minimized

the decomposition surfaced that **a reviewer reads files and cannot read a live message** (D5, `1.vision.experience.dimensions.md`).

⇒ so for the **message** half — #407 and #411 — the only two mechanisms are a `brief` at authorship and a `subconscious` in flight. deferral of the watcher leaves the message half with **exactly one** enforcement surface, and #414's own measured argument is that a booted brief demonstrably fails under load:

> *"a rule that is loaded is not a rule that is read."*

**that is the strongest case against this call, and it is real.** the inventory records every `subconscious` cell as `itemized, deferred` rather than as an oversight, and `author × subconscious × sharp × complete × message` is labelled *the deferral that costs the most*.

## .rework, and why

**clean.** the watcher is additive. it wires onto a role that already boots telepath's briefs, and it changes no rule, no rubric, and no guard.

## .the counter-evidence that lowered this to 65%

the first pass rated this 75% on the read that the deferral is a scope tradeoff the wisher may weigh either way. the experience-coverage grade shows it is stronger than that.

`case=6` is a sharp critipath. per `define.experience._.axis=feel.path=happy-vs-sharp`, a sharp critipath carries an obligation — it must be shown to fail fast, to fail loud, and to name the fix. `case=6` discharges none of the three, and its failure mode is *inverted*: the defect IS silence.

| the rule | what it says about this cell |
|---|---|
| `define.experience._.axis=feel.path=happy-vs-sharp` | *"a sharp path demonstrated as unhandled — the edge exists, no fail-safe shown — is a gap"* |
| `rule.require.experience-coverage` | a sharp critipath shown unhandled is a blocker |

⇒ **so the deferral does not merely leave a thinner half — it leaves a sharp critipath with no fail-safe mechanism at all**, which the coverage rule grades as a blocker rather than a tradeoff.

🟡 what keeps this at 65% and not lower: the obligation is discharged by *a* mechanism, and #414 is not provably the only candidate — a lint at message-compose time, or a structural check in the harness, might reach a live message too. this vision found none, but it did not exhaust the space.

⇒ this is the fulcrum most likely to invert, and the yield says so directly.

## .the mechanism this fulcrum priced as absent ALREADY EXISTS — measured 2026-09-04

the paragraph above admits the space was not exhausted. it now has been, at least one rung, by a read of `.claude/settings.json`:

```json
"Stop": [{ "matcher": "*", "hooks": [
  { "command": "rhx route.drive --when hook.onStop",        "timeout": 5 },
  { "command": "rhx learn.domain.terms --when hook.onStop", "timeout": 5 }
]}]
```

⇒ **the `Stop` slot is live, it fires once per assistant turn, its budget is 5s, and it already carries two users** — one from `bhrain/role=driver`, one from `bhrain/role=learner`. `learn.domain.terms` is a **nudge** in exactly #414's sense.

| what F03 priced as new | what actually exists |
|---|---|
| a background dispatch | the `Stop` hook block |
| a cheap-brain budget | a `timeout: 5` convention, already honored twice |
| a precedent for a nudge | `learn.domain.terms --when hook.onStop` |

⇒ so the work left for #414 is **a rubric and a nudge**, never a mechanism. **that is a materially smaller bill than this fulcrum assumed**, and it is the strongest argument yet for `in scope`.

### .the question that settles it is now ANSWERED — and the answer cuts both ways

> **does a `Stop` hook receive the assistant's message?** — **yes, directly.**

verified 2026-09-04 against the Claude Code hooks reference (`code.claude.com/docs/en/hooks.md`, Stop Hook Reference):

| field | what it carries |
|---|---|
| **`last_assistant_message`** | *"the complete text of Claude's final response message in this turn"* |
| `assistant_message_tokens` | the turn's token count |
| `stop_reason` | `end_turn` · `max_tokens` · `tool_use` · `stop_sequence` |
| `transcript_path` · `session_id` · `cwd` · `permission_mode` | the common fields |

⇒ **#414's mechanism is fully paved.** the slot is live, the budget convention exists, a nudge precedent exists, and the payload hands the prose over with no transcript parse.

### .but the SAME read exposed a limit that no mechanism escapes — and it reframes the coverage gap

**`Stop` fires AFTER the message is emitted.** so a watcher on that slot cannot prevent a bad message; it can only grade one the reader has already seen, and then either block the stop to force a correction turn, or inject `additionalContext` into the next one.

🟡 **and no pre-emission hook exists.** `MessageDisplay` fires *as* the message displays — also too late to block. a `PreRender`/`PreMessage` hook is an **open feature request** (`anthropics/claude-code#61152`), not a shipped surface.

| the obligation `case=6` owes | discharged by #414? |
|---|---|
| **loud** | the stop is blocked; the turn does not end quietly |
| **teaches the fix** | the nudge names the rule |
| **fast** | ❌ **unreachable by any available mechanism** — the human has already read the message |

⇒ **so `case=6`'s `fast` obligation is not a scope choice this behavior declined. it is a platform limit.** the ask is buried, the reader prices it as analysis, and every hook in the catalog fires after that has happened.

## .confidence — raised to 75%, and now on measured ground

the two facts pull opposite ways, and the net is a better-grounded call rather than a moved one:

| the fact | which way it pushes |
|---|---|
| the mechanism is paved and cheap — a rubric and a nudge | 🔻 toward `in scope`. the bill is small |
| `fast` is unreachable, so #414 cannot fully close `case=6` | 🔺 toward `follow-on`. the deferral forfeits less than the ledger assumed |

⇒ 65% → 75%. the strongest argument against this call was *"the subconscious is the only mechanism that closes the gap."* **it is now measured that it closes two thirds of it and that no mechanism closes the rest** — so the deferral costs a partial fail-safe, never a whole one.

🟡 what still holds this below 90%: `rule.require.experience-coverage` grades a sharp critipath with NO fail-safe a blocker, and `follow-on` leaves `case=6` at exactly that today. a two-of-three fail-safe is strictly better than none, and this behavior ships none. the wisher may reasonably require the two reachable thirds now.

## .where

- `1.vision.experience.dimensions.md` — D5, the axis that exposed the gap
- `1.vision.experience.case=_.md` — blocks 3, 6, 9: every deferred cell
- `.dream/v2026_08_30.amend.telepath-owns-an-accretion-review-lane.md` — the prior art #414 asks be read first

## .the verdict

_unruled._
