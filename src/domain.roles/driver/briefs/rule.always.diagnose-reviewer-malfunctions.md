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
- a **context overflow** — the lane's prompt exceeded the window, so it reviewed naught. see
  below; it is the one cause with a recipe rather than a repair

fix it, re-arrive, and let the reviewer run clean.

### 🔴 the overflowed lane — re-run the rubric scoped

a lane that blew its context window rendered **no verdict**, so by the definitions above it is a
malfunction and it is yours. the repair is not a fix to a supply — it is a **narrower invocation**:
the guard hardcodes `--diffs since-main`, and `rhx review` is not so bound.

```sh
rhx review --rules '<the lane rubric path>' \
           --paths-with 'src/<subsystem>/**/*.ts' --paths-wout '**/*.test.ts' \
           --output '.review/<iter>.<lane>.scoped.<slug>.md' --goal exhaustive
```

then report the **verdict**, never the overflow alone.

⚠️ **the temptation this cause carries is unique to it.** every other malfunction announces itself
as broken. an overflowed lane returns terminal and unlocks the next level, so it reads on the
ladder much like a lane that ran — and a driver who merely files the overflow removes a lens from
the drive, then leaves a record that only proves someone noticed.

✅ **the inherited `--diffs since-main` scope is already correct — do NOT re-derive it.**
`getAllFileDiffsFromRange.ts` prefers `origin/main` over a stale local `main` (line 43) and takes
`git merge-base` (line 70), so a commit `main` is ahead on cannot enter the diff. an item the
scoped run raises is yours.

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

## .enforcement

- a malfunction escalated with a bare symptom and no diagnosis = **blocker**
- a driver-fixable cause handed to a human = **blocker**
- an overflowed lane reported upward with no scoped re-run attempt = **blocker**

## .see also

- `howdoes.the-guard-caches-a-clean-lane-by-artifact-hash` — the other half of re-arrival cost:
  what happens to the lanes that DID return a verdict
- `rule.always.spend-own-levers-before-escalation` — the owner-sort this rule is one instance of
- `rule.always.converge-to-terminal` — why a dark lane must not be coasted past
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
