# fulcrum F15 — the `model:` warn writes to the process, over the engine's emit

**raised** 2026-09-14, at self-review `has-consistent-conventions` on `5.1.execution.from_vision`
**rework** = 🔴 dirty · **status** = ✅ **resolved 2026-09-14** · **confidence** = ✅ **settled**

## .the fork, stated fairly

the `model:` alias needs a signal. two mechanisms exist, and this round took the first:

| | the mechanism |
|---|---|
| **taken** | `console.warn` from inside `parseStoneGuard`, straight to process stderr |
| **rejected** | a **structured warn** returned beside the guard, rendered by the caller — the repo's own convention |

## .what was taken, and why at the time

`console.warn`, because the parser has no warn channel and the caller has no renderer for one.
`parseStoneGuard` returns a `RouteStoneGuard` and a diagnostic has nowhere on it to sit.

⇒ the warn works in the sense that matters least: it is **called**, and a test proves that
(`parseStoneGuard.brain.integration.test.ts` `case5`).

## 🔴 .the counter-case, and it is stronger than the taken answer

the repo has a stated convention and this is its only exception in `src`:

```
$ rhx grepsafe --pattern 'console\.warn' --path src --glob '*.ts'
   └─ parseStoneGuard.ts:246      ← the only non-test hit, added this round
```

```
getBudgetClobberWarnings.ts:15-16
  .note = pure — takes two already-parsed guards and yields structured warnings; the
          renderer owns the prose.
```

⚠️ **and it is a BYPASS, not a style choice.** every other output in the route engine flows through
`{ emit: { stdout, stderr: { reason, code } } }`. a raw `console.warn` writes outside that structure,
so the signal is delivered by a channel the engine does not own.

🔴 **the `F4` verdict is what makes this carry load.** with the key set permissive, this warn is the
**entire** fail-safe `case=4` has. if hook stderr on a zero exit is suppressed by the consumer, the
fail-safe is not degraded — it is **absent**, and no test would catch it.

## .why it is dirty

candidate #1 changes `parseStoneGuard`'s return shape, read across the guard, drive, judge, and
upgrade subsystems. candidate #2 puts a parse side effect onto a domain object whose subject is the
guard's declared contents.

⇒ **so a reversal is a teardown rather than a rename**, which is what `dirty` means here — and per
`F5`'s own re-grade, the test is *what would we tear down*, never *how far does it reach*.

## .where

- ~~`src/domain.operations/route/guard/parseStoneGuard.ts:245-252` — the warn~~ 🔴 **gone.** the
  parser emits no prose at all; see `.the verdict` below for what stands in its place
- `src/domain.operations/route/guard/upgrade/getBudgetClobberWarnings.ts` — the convention to mirror
- `.dream/v2026_09_14.fix.a-parser-warn-bypasses-the-route-emit-contract.md` — the work, with its clamp

## .confidence, and why it is low

**60%.** the *convention* claim is measured and certain. what is **unmeasured** is whether the warn
reaches a human at all — hook stderr on a zero exit may or may not surface.

⇒ **that one observation swings the grade from a nitpick to a defect**, and it is one run away. the
dream names it as the first item to measure rather than the one to assume.

## ✅ .the verdict

🔴 **the REJECTED mechanism was built, in this same round. the fork is closed by construction —
no council verdict is owed.**

| the fork | what shipped |
|---|---|
| **taken** — `console.warn` from inside the parser | 🔴 **withdrawn.** zero call sites in `src` |
| **rejected** — a structured warn, rendered by the caller | ✅ **this is the build** |

```
GuardParseWarning          the type — three kinds: key-unknown, key-alias, key-empty
getGuardParseWarnings      the collector — pure, yields structured advisories
formatGuardParseWarnings   the renderer — owns the prose
stepRouteDrive             prepends it to `{ emit: { stdout } }`, on all three surfaces
```

⇒ **the convention this fulcrum measured against is now the convention the code follows**, and the
`.counter-case` above needs no further argument: it won.

### 🔴 what overturned the `dirty` grade, and it was not a re-estimate of ripple

the `.confidence` section named the observation that decides it, and deferred it:

> *"what is **unmeasured** is whether the warn reaches a human at all … **that one observation swings
> the grade from a nitpick to a defect**, and it is one run away."*

**it was run.** a raw `console.warn` writes outside `{ emit: { stdout, stderr } }`, so the answer was
the bad one: with `F4` permissive, the fail-safe was not degraded but **absent**.

⇒ **an absent fail-safe is not deferrable at any ripple cost.** the `dirty` grade was correct and
stopped to matter — `dirty` prices a reversal, and there was no longer a defensible remnant to keep.

🟡 **and the ripple was smaller than estimated, for a reason worth a record.** the `.why it is dirty`
section assumed a fix must change `parseStoneGuard`'s return shape (candidate #1) or put a diagnostic
on `RouteStoneGuard` (candidate #2). the build took **neither**: `getGuardParseWarnings` reads the
guard file a **second time**, as its own pure operation, so `parseStoneGuard`'s signature is untouched
and its callers never knew.

⇒ **the durable lesson: a `dirty` grade is computed over the candidates you enumerated.** a third
candidate outside that set can be clean, and here it was — which is `rule.require.enumerate-before-you-name`
applied to a rework estimate rather than to a word.
