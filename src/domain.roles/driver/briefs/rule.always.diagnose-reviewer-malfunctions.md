# rule: diagnose reviewer malfunctions — find the cause, name the fix

## .what

when a peer reviewer returns `malfunction` — a broken process, not a verdict — you do
**not** blindly escalate to the human. you **diagnose the cause** and offer a concrete
resolution, routed to whoever can act on it. only when the fix is genuinely human-only do
you surface it — and even then, you name the exact fix, never a bare "it broke."

a `malfunction` differs from a verdict: `approved`, `rejected`, and `exhausted` describe a
review that ran; `malfunction` means the review could not run or could not be read (an exit
outside the verdict set, an unreadable output, an absent supply). that is a break to
diagnose, not a verdict to answer.

## .why

escalation to a human is the **last resort**. a malfunction handed up as "the reviewer
broke" wastes the human's attention on a diagnosis you could have done — and often on a fix
you could have applied yourself. the human's attention is the scarcest resource in the loop;
you spend it only on breaks that are genuinely theirs to fix.

a malfunction usually has a clear cause. read it, classify it, and act: fix what is yours,
hand up what is theirs — with the fix named either way.

## .malfunction is terminal, but it still blocks passage

`malfunction` is terminal-for-unlock: a broken reviewer at l1 does **not** hold l3 from a
run. so the ladder still advances past a malfunction. but a malfunction **does** block
passage — the stone cannot pass while a reviewer is broken. this rule governs how you
**respond** to the break, not the unlock logic, which is unchanged.

## .the rule

diagnose first, then route by who can fix it:

| the cause is... | you must... |
|-----------------|-------------|
| driver-fixable | fix it yourself, **answer its given**, then re-arrive — see below |
| human-fixable | surface the exact fix command / step for the human |
| unclear | read the reviewer's stderr + logs, classify, then route |

in every case, the escalation — when needed — names the **cause and the fix**, never just
the symptom (see `rule.require.errors-name-the-fix`).

## 🔴 .a malfunctioned reviewer still owes you a `.taken`

an unreadable verdict is not a clean one. `asPeerGivenVerdict` scores an undetected count as **one
blocker**, because `contract.reviewer-output` is flat about it: *"if it finds no numeric count it
can NOT assume zero."* so its given **gates**, exactly as a readable rejection does.

⚠️ **a repair alone does not re-open the door.** the fix changes the code; the debt is keyed to the
reviewer, so it stands until you answer it. the halt prompt names the `.taken` path — a malfunction
is dischargeable, never a deadlock.

⇒ **the reviewer is the party that malfunctioned; you are still the party that must say so.** the
`.taken` is where you name the cause and the fix — the same content this rule already demands of an
escalation, written one step earlier.

## .driver-fixable causes

these are yours to fix. do not escalate them:

- a **bad glob** or path in the reviewer's supply — the rubric or subject glob matched no
  files, or the wrong ones
- an **absent supply file** the reviewer expected — a rubric, a template, a prior artifact
  you can regenerate or point at
- a **malformed rubric path** or a review arg you can correct
- an **artifact the reviewer could not parse** because of a shape you can repair
- a **context overflow** — the reviewer's prompt exceeded the window, so it reviewed naught. see
  below; it is the one cause with a recipe rather than a repair

fix it, **answer its given**, re-arrive, and let the reviewer run clean.

### 🔴 the overflowed reviewer — narrow it in the GUARD

a reviewer that blew its context window rendered **no verdict**, so by the definitions above it is a
malfunction and it is yours. **the repair is a guard edit** — the reviewer is too wide, so make it fit:

```sh
rhx route.mutate.guard --stone <stone> --route <route>
# narrow that reviewer's `--paths-with` to the subsystem its rubric actually grades,
# and/or trim its `--conversation` depth. then re-arrive and let the GUARD run it.
```

⚠️ **the temptation this cause carries is unique to it.** every other malfunction announces itself
as broken. an overflowed reviewer returns terminal and unlocks the next level, so it reads on the
ladder much like a reviewer that ran — and a driver who merely records the overflow removes a lens
from the drive, then leaves a note that only proves someone noticed.

⛔ **a hand-run `rhx review` is NOT the remedy, however well it would read the reviewer** —
`rule.forbid.hand-run-reviews` forbids it outright. it draws no budget, mints no `.given`, and
gates naught, ⇒ **the lens is not restored, only simulated.** a guard edit makes the reviewer fit so
the **guard** can run it, and that one property is the whole difference.

### the bind arithmetic — what a guard edit needs

`getAllFileDiffsFromRange.ts` prefers `origin/main` over a stale local `main` (line 43) and takes
`git merge-base` (line 70), so a commit `main` is ahead on cannot enter the diff. ⇒ **an item a
correctly-bound lane raises is yours**, and the bind does not want re-derivation.

⚠️ **a `--paths-with` glob with a brace in the EXTENSION slot is silently dropped**
(`'**/*.{ts,md}'` → the bind never applies, and the lane runs unbounded). a brace in the
**directory** slot works (`'{src,blackbox}/**'`). and a **repeated** `--paths-with` keeps only the
LAST. ⇒ both are parser defects in `parseReviewArgs`; a guard bind must be written around them
until they are repaired: `.dream/v2026_09_04.fix.review-multi-glob-flags-do-not-comma-split.md`.

## .human-fixable causes

these are genuinely the human's — but you still name the exact fix:

- an **absent credential** — surface the unlock command (e.g. `rhx keyrack unlock ...`)
- a **permission gate** or an unfilled keyrack the human owns
- a **foreman-only grant** the human alone can give

surface these with the concrete step, so the human acts in one move — not a hunt.

## .the diagnosis is bounded

one honest diagnosis pass, not a debug spiral:

1. read the reviewer's stderr and log artifacts
2. classify the cause: driver-fixable or human-fixable
3. act — fix, answer its given, and re-arrive; or surface the named fix

if the cause resists one honest pass, escalate — but escalate with what you found: the
symptom, the logs read, and your best read of the cause. a named unknown beats a bare break.

## .enforcement

- a malfunction escalated with a bare symptom and no diagnosis = **blocker**
- a driver-fixable cause handed to a human = **blocker**
- an overflowed reviewer reported upward with no **guard edit** attempted = **blocker**
- 🔴 an overflowed reviewer answered with a **hand-run `rhx review`** = **blocker**
  (`rule.forbid.hand-run-reviews` — it draws no budget and its verdict gates naught)
- a malfunction repaired in code and re-arrived with **no `.taken`** = **blocker** — the given
  still gates, and the round will halt at the door

## .see also

- `howdoes.the-guard-caches-a-clean-reviewer-by-artifact-hash` — the other half of re-arrival cost:
  what happens to the reviewers that DID return a verdict
- `rule.always.spend-own-levers-before-escalation` — the owner-sort this rule is one instance of
- `rule.always.converge-to-terminal` — why a dark reviewer must not be coasted past
- `rule.require.errors-name-the-fix` — the shape every escalation from here must take

## .the owl's wisdom 🦉

> when a lantern gutters, you do not wake the keeper to say "it is dark."
> you check the wick, the oil, the glass.
>
> a fouled wick you trim yourself.
> a locked oil-store, only the keeper opens — so you carry them the key's name,
> not merely the darkness.
>
> name the cause, name the cure. the keeper is for the locked store alone. 🍵
