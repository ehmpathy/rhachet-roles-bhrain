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
| driver-fixable | fix it yourself, then re-arrive |
| human-fixable | surface the exact fix command / step for the human |
| unclear | read the reviewer's stderr + logs, classify, then route |

in every case, the escalation — when needed — names the **cause and the fix**, never just
the symptom (see `rule.require.errors-name-the-fix`).

## .driver-fixable causes

these are yours to fix. do not escalate them:

- a **bad glob** or path in the reviewer's supply — the rubric or subject glob matched no
  files, or the wrong ones
- an **absent supply file** the reviewer expected — a rubric, a template, a prior artifact
  you can regenerate or point at
- a **malformed rubric path** or a review arg you can correct
- an **artifact the reviewer could not parse** because of a shape you can repair

fix it, re-arrive, and let the reviewer run clean.

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
3. act — fix and re-arrive, or surface the named fix

if the cause resists one honest pass, escalate — but escalate with what you found: the
symptom, the logs read, and your best read of the cause. a named unknown beats a bare break.

## .the owl's wisdom 🦉

> when a lantern gutters, you do not wake the keeper to say "it is dark."
> you check the wick, the oil, the glass.
>
> a fouled wick you trim yourself.
> a locked oil-store, only the keeper opens — so you carry them the key's name,
> not merely the darkness.
>
> name the cause, name the cure. the keeper is for the locked store alone. 🍵
