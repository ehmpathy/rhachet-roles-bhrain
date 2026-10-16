# rule: diagnose reviewer malfunctions — find the cause, name the fix

## .what

when a peer reviewer returns `malfunction` — a broken process, not a verdict — you do
not blindly escalate to the human. you diagnose the cause and offer a concrete
resolution, routed to whoever can act on it. only when the fix is genuinely human-only do
you surface it — and even then, you name the exact fix, never a bare "it broke."

a `malfunction` differs from a verdict: `approved`, `rejected`, and `exhausted` describe a
review that ran; `malfunction` means the review could not run or could not be read (an exit
outside the verdict set, an unreadable output, an absent supply). that is a break to
diagnose, not a verdict to answer.

## .why

escalation to a human is the last resort. a malfunction handed up as "the reviewer
broke" wastes the human's attention on a diagnosis you could have done — and often on a fix
you could have applied yourself. the human's attention is the scarcest resource in the loop;
you spend it only on breaks that are genuinely theirs to fix.

a malfunction usually has a clear cause. read it, classify it, and act: fix what is yours,
hand up what is theirs — with the fix named either way.

## .malfunction is terminal, but it still blocks passage

`malfunction` is terminal-for-unlock: a broken reviewer at l1 does not hold l3 from a
run. so the ladder still advances past a malfunction. but a malfunction does block
passage — the stone cannot pass while a reviewer is broken. this rule governs how you
respond to the break, not the unlock logic, which is unchanged.

## .the rule

diagnose first, then route by who can fix it:

| the cause is... | you must... |
|-----------------|-------------|
| driver-fixable | fix it yourself, answer its given, then re-arrive — see below |
| human-fixable | surface the exact fix command / step for the human |
| unclear | read the reviewer's stderr + logs, classify, then route |

in every case, the escalation — when needed — names the cause and the fix, never just
the symptom (see `rule.require.errors-name-the-fix`).

## .the halt reads each cause for you

the malfunction halt prints one row per broken part — a review lane or a judge — with the
first line of its cause and a class. only two classes carry a fix of their own:

| class | the cause reads like | its own fix |
|---|---|---|
| `transient` | a timeout, a dropped socket, a 429 or 5xx | none — the re-arrive re-runs it |
| `unreadable` | an output the guard could not parse | none — a re-run usually reads |
| `glob` | a bind that matched no files | narrow that lane in `$route/<stone>.guard` (needs the route's mutate grant) |
| `credential` | an absent key, a locked keyrack, a 401/403 | ask a human for the grant |
| `unknown` | aught else, or a bare exit code | none — read its given for the cause |

then ONE shared `next`, in the order the gates accept: read each given and fix what you can,
answer each broken **lane** (`--as absorbed --that <slug>`), re-arrive once. a broken
**judge** writes no given, so it owes no answer. the answer precedes the re-arrive because
the entrance gate refuses a round while a lane still owes a `.taken`. an **overflow** never lands here: it is a refusal, graded
`constraint`, and its own halt names the partition or narrow lever.

## .a malfunctioned reviewer still owes you a `.taken`

an unreadable verdict is not a clean one. `asPeerGivenVerdict` scores an undetected count as one
blocker, because `contract.reviewer-output` is flat about it: "if it finds no numeric count it
can NOT assume zero." so its given gates, exactly as a readable rejection does.

a repair alone does not re-open the door. the fix changes the code; the debt is keyed to the
reviewer, so it stands until you answer it. the halt prompt names the `.taken` path — a
malfunction is dischargeable, never a deadlock.

the reviewer is the party that malfunctioned; you are still the party that must say so. the
`.taken` is where you name the cause and the fix — the same content this rule already demands of
an escalation, written one step earlier.

## .driver-fixable causes

these are yours to fix. do not escalate them:

- a bad glob or path in the reviewer's supply — the rubric or subject glob matched no
  files, or the wrong ones
- an absent supply file the reviewer expected — a rubric, a template, a prior artifact
  you can regenerate or point at
- a malformed rubric path or a review arg you can correct
- an artifact the reviewer could not parse because of a shape you can repair
- a context overflow — the reviewer's prompt exceeded the window, so it reviewed naught. see
  below; it is the one cause with a recipe rather than a repair

fix it, answer its given, re-arrive, and let the reviewer run clean.

### the overflowed reviewer — narrow it in the GUARD

a reviewer that blew its context window rendered no verdict, so by the definitions above it is a
malfunction and it is yours. the repair is a guard edit — the reviewer is too wide, so make it
fit:

```sh
rhx route.mutate grant get     # the guard edit needs the route's mutate grant — a human grants it once
# then edit $route/<stone>.guard directly: narrow that reviewer's `--paths-with` to the subsystem
# its rubric actually grades, add a `--paths-wout`, and/or trim its `--conversation` depth.
# then re-arrive and let the GUARD run it.
```

🟡 no `rhx` command edits a guard. `route.mutate.guard` is the PreToolUse hook that seals
`*.guard` until `$route/.route/.privilege.mutate.flag` exists — a gate, never an editor. if
`grant get` reports blocked, the one ask of the human is `rhx route.mutate grant allow`; the edit
after it is yours.

the temptation this cause carries is unique to it. every other malfunction announces itself
as broken. an overflowed reviewer returns terminal and unlocks the next level, so it reads on the
ladder much like a reviewer that ran — and a driver who merely records the overflow removes a
lens from the drive, then leaves a note that only proves someone noticed.

a hand-run `rhx review` is not the remedy, however well it would read the reviewer —
`rule.forbid.hand-run-reviews` forbids it outright. it draws no budget, mints no `.given`, and
gates naught, so the lens is not restored, only simulated. a guard edit makes the reviewer fit so
the guard can run it, and that one property is the whole difference.

### the bind arithmetic — what a guard edit needs

`getAllFileChangesFromRange.ts` prefers `origin/main` over a stale local `main` (`getOneMainBranch`)
and takes `git merge-base` (`getOneBaseArgs`), so a commit `main` is ahead on cannot enter the diff. an item a
correctly-bound lane raises is yours, and the bind does not want re-derivation.

the flags a bind is written with:

| flag | what it does | repeats? |
|---|---|---|
| `--paths-with <glob>` | include files that match | yes — every occurrence accumulates |
| `--paths-wout <glob>` | exclude files that match. alias: `--paths-without` | yes |

so a wide lane narrows by exclusion as readily as by inclusion, and the commonest cut is the
test corpus a production rubric does not grade:

```
--paths-with 'src/**/*' --paths-wout '**/*.test.ts' --paths-wout '**/__snapshots__/**'
```

a brace in either slot works — `'**/*.{ts,md}'` and `'{src,blackbox}/**'` alike. to check
what a bind matched, read the scope block's `paths.with` / `paths.wout` lines and the
`joined via` count, or the run's `input.scope.debug.json`. a given older than 2026-09-26
printed `paths: (none)` for any `--paths-with` bind — that line reported only the deprecated
`--paths` flag, and twice sent a driver to blame the parser for a bind it had applied.

a flag the parser does not know refuses as a constraint and names itself, so a misspelled bind
fails loud rather than reads as applied. when a narrowed lane overflows at the same file count as
before, the glob matched what it did before — read the scope block, not the flag name.

### which lever — read it off the refusal, never off a hand census

the overflow refusal prints a `lever` branch computed from the masses the prompt actually held.
read it, and apply the row it names:

| the refusal says | the lever | why |
|---|---|---|
| the targets are mostly **edited** files | narrow the bind — `--paths-wout '<heavy>/**'` | the lane sweeps a subtree its rubric does not grade |
| the targets are mostly **additions** | declare the whole set once — `rhx route.guard.partition --for review --peer @all --partition '<slug>=<globs>' ...`, through vertical domains (`rule.forbid.horizontal-partitions`) | the mass is new work the lane MUST read; to cut it hides it |
| the targets hold **no** mass | narrow `--rules`, `--refs`, or `--conversation` | the overflow is in the supply, not the subject |
| a **partition** still overflows alone | narrow that partition, or split it in two | a partition is never split again by the tool |

each partition holds all its files need to be judged alone, and the bound route sits in every one —
a partition without it refuses. overlaps are computed as `common`, graded once. a partitioned lane
runs whole while it fits, splits only on overflow, runs its partitions at once, and the guard reads
ONE merged tally under the lane's own slug — so the budget, the `.given`, and the `.taken` debt are
unchanged. ⇒ `howto.partition-an-overflowed-review` (reviewer) for both forms.

⚠️ never cut `.behavior/**` to make a lane fit. the route spec is what every partition is graded
against; a lane that cannot see it grades against naught.

### when the guard came from a template — dispatch the cure upstream

where the guard was stamped from another repo's template, the refusal also prints a
`rhx radio.task.push --into <repo>` line. run your own guard edit **and** dispatch that task: your
edit fixes this route; the dispatch fixes every later route the template stamps.

## .human-fixable causes

these are genuinely the human's — but you still name the exact fix:

- an absent credential — surface the unlock command (e.g. `rhx keyrack unlock ...`)
- a permission gate or an unfilled keyrack the human owns
- a foreman-only grant the human alone can give

surface these with the concrete step, so the human acts in one move — not a hunt.

## .the diagnosis is bounded

one honest diagnosis pass, not a debug spiral:

1. read the reviewer's stderr and log artifacts
2. classify the cause: driver-fixable or human-fixable
3. act — fix, answer its given, and re-arrive; or surface the named fix

if the cause resists one honest pass, escalate — but escalate with what you found: the
symptom, the logs read, and your best read of the cause. a named unknown beats a bare break.

## .enforcement

- a malfunction escalated with a bare symptom and no diagnosis = blocker
- a driver-fixable cause handed to a human = blocker
- an overflowed reviewer reported upward with no guard edit attempted = blocker
- an overflowed reviewer answered with a hand-run `rhx review` = blocker
  (`rule.forbid.hand-run-reviews` — it draws no budget and its verdict gates naught)
- a malfunction repaired in code and re-arrived with no `.taken` = blocker — the given
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
