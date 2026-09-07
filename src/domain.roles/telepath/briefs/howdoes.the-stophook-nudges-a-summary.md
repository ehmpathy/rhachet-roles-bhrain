# howdoes: the stophook nudges a summary

> **you met `🦉 say it clear, say it dense` at the end of a turn. it is a REMINDER, never a verdict —
> it read no word of what you wrote.**

⇒ the four moves it asks for, and the six canon paths it cites, are in the nudge itself. **this file
answers what the nudge cannot fit: why this mechanism, why it grades naught, and where it cannot
reach.**

## .why a hook at all, when the canon already boots

the canon is a set of cues, and **a cue fires only when it is recalled**. the reflexive pass is owed
at the one moment a turn is most crowded — the end of it, once the work is done and the summary is
already written.

⇒ so the hook supplies what a brief cannot: **a moment that arrives whether or not you reached for
it.** that is its whole purpose, and it is why the mechanism is worth a held stop.

| the mechanism | when it fires | what it costs |
|---|---|---|
| a booted brief | whenever the author recalls it | zero, and it turns on recall |
| **the Stop hook** | **every turn, unskippable** | one held stop, once |
| a reviewer | after the artifact is written | a brain, per arrival |

## .why STOP, and why no earlier surface is available

| the moment | reachable? |
|---|---|
| before the words are emitted | ❌ **no shipped hook reaches it.** a `PreRender` slot is an open feature request |
| at emit — `Stop` | the last moment before rest, and the pass a brain skips there |
| at display — `MessageDisplay` | ❌ it fires after the human already read it |

🟡 **so the nudge arrives AFTER your summary was emitted, never before.** it holds the stop open so
you can say it again denser; it cannot stop the first version from reaching the page.

⇒ that is a platform limit, not a design choice, and the honest claim is bounded to match: the
message half is enforced within one turn, never before it.

## .why it grades naught, and why that is not a shortfall

the hook reads no word of your summary. it could — a regex over `last_assistant_message` would
render a number in milliseconds — and it deliberately does not.

> **"did the concept transfer?"** is a judgment. it needs the ask, the peer's prior context, and what
> they will do next. a deterministic verdict over a judgment is a **fake tool**, and a fake tool is
> worse than the brain it replaced: a brain hesitates, and a confident wrong number does not.

⇒ so the split is exact. **the hook supplies the one thing a brain cannot supply itself — the
unskippable moment. the brain supplies the judgment, which the hook cannot have.**

## .why it fires once, with no state file

the harness sets `stop_hook_active` when a stop is already a hook continuation. the hook reads that
flag and returns.

⇒ **the platform's own loop guard is the whole mechanism** — no cooldown, no clock, no file on disk
to go stale, and a session can always rest. one nudge per turn, by construction.

## 🟡 .it FAILS OPEN, on every fault

an absent payload, a malformed one, an unreadable stdin — each yields *"already a continuation"*, so
the stop is released and the nudge does not fire.

| the failure | the outcome |
|---|---|
| the hook cannot read its input | the turn ends normally. **the nudge is lost** |
| the hook holds a stop it should not | a session that cannot rest |

⇒ the second is far worse than the first, so the bias is deliberate. a lost reminder costs one
denser summary; a stuck session costs the whole turn and every turn after it.

🟡 **the cost of that choice is real and worth your knowledge: silence does not mean you passed.**
the hook renders no *"all clear"*, so a turn with no nudge is either a continuation, or a fault. do
not read its absence as a grade.

## .the two faces

| invocation | what it does | exit |
|---|---|---|
| `--when hook.onStop` | the hook face: the nudge, and it holds the stop | **2** |
| bare | the same nudge, by hand, whenever you want it | 0 |
| `--help` | usage | 0 |

⇒ **the nudge is the ARTIFACT**, so it renders on every invocation. only the hook face holds a stop —
which is what makes it safe to read by hand at any point in a turn.

## .what to do when you meet it

do the four moves the nudge lists, then stop. it is a prompt to re-read, never an accusation —
and if your summary already clears the bar, say so in a line and rest.

🟡 **do not answer it with a longer summary.** the reminder asks for denser, and a nudge about
terseness answered by more prose has been refuted by its own reply.

⇒ see also: `rule.require.reflexive-condensation` (the pass it names, and the 95% bar) ·
`rule.require.elucidation` (the root question it asks) · `rule.require.archaeology-in-notes` (the
`rehome` move) · `rule.require.answer-what-they-meant` (why a message-half mechanism is owed at all).
