# diagnosis — both l1 lanes malfunction on one absent credential

**stone** — `1.vision` · **iteration** — `i001` · **hash** — `95f003d28fd02e81bb`
**verdict** — both l1 reviewers `malfunction 💥`, budget `0/3` consumed (correctly — a malfunction
spends no round)

## .the cause, verified

both lanes failed identically, before either reached a brain:

```
ConstraintError: ✋ ConstraintError:
🔐 keyrack
   └─ ehmpathy.prep.FIREWORKS_API_KEY
      ├─ status: absent 🫧
      └─ tip: rhx keyrack set --owner ehmpath --key FIREWORKS_API_KEY --env prep
```

thrown at `getKeyrackKeySecrets.js:56`, reached via
`getSdkCredsFromBrainSupplies` → `BrainAtom.ask` → `stepReview.js:621`.

⇒ **the credential is fetched before the review runs**, so neither lane read the artifact. this is a
broken process, never a verdict on the vision (`rule.always.diagnose-reviewer-malfunctions`).

## .the triage — driver-fixable, or human-fixable?

**human-fixable.** established from two independent sources rather than one:

| source | what it says |
|---|---|
| the error itself | `status: absent 🫧` — and keyrack's vocabulary parts *absent* from *locked*. its printed tip is `keyrack set`, never `keyrack unlock` |
| `rhx keyrack status --owner ehmpath` | the rack holds `@all.camp.GITHUB_TOKEN` and `ahbode.camp/test/prep.AWS_PROFILE` — **no `ehmpathy` org keys at all, and no `FIREWORKS_API_KEY` in any env** |

⇒ **`unlock` cannot help**: there is no such credential in the rack to unlock. `set` needs the secret
value, which the driver does not hold and must not hold.

## .the levers spent before escalation

per `rule.always.spend-own-levers-before-escalation`, the test is *"is there a command i could run
right now that would move this stone?"*

| lever | owner | verdict |
|---|---|---|
| `rhx keyrack unlock --owner ehmpath --env prep` | driver | ❌ **useless** — absent, not locked |
| `rhx route.guard.budget --for review --add N` | driver | ❌ **not the constraint.** both lanes read `0/3` — a malfunction consumed no budget, so more budget buys naught |
| fix a bad glob / absent supply / malformed rubric | driver | ❌ **not the cause** — the lanes resolved their scope fine (12 targets, ~70k tokens, logs written) and died at the credential fetch |
| `rhx keyrack set --owner ehmpath --key FIREWORKS_API_KEY --env prep` | 🔴 **human** | the fix |

⚠️ **no second opinion sought, and the carve-out is explicit.**
`rule.always.get-a-second-opinion-before-foreman` names *"a credential or a grant"* as one of its
three narrow exceptions. a peer cannot supply a secret either.

## 🔴 .the human's exact command

```sh
rhx keyrack set --owner ehmpath --key FIREWORKS_API_KEY --env prep
```

then re-arrive:

```sh
rhx route.stone.set --stone 1.vision --as arrived
```

⚠️ **do NOT reach for `--as overruled`.** the guard offers it and it is the wrong lever here: it
would waive two reviews that never ran, on an artifact no peer lens has yet read. the malfunction is
a broken process to repair, never a verdict to forgive.

## .what the judges said, and why the stone needs a human regardless

| judge | outcome |
|---|---|
| `j1` — `reviewed?` (`--allow-blockers 0 --allow-nitpicks 7`) | ✅ **allowed** |
| `j2` — `approved?` | ✗ **blocked** — *"wait for human approval"* |

⇒ **even with both lanes green, this stone terminates in `--as approved`, which a driver cannot
grant** (`howto.drive-routes`). so the credential is the blocker for the *reviews*; the human is the
gate for the *stone* either way.

## .the state left behind

- **five self-reviews promised** — `has-grounded-in-reality`, `has-experience-coverage`,
  `has-questioned-requirements`, `has-questioned-assumptions`, `has-questioned-questions`
- **7 fulcrums open, none dirty** (F1 72 · F2 78 · F3 88 · F4 91 · F5 95 · F6 93 · F7 78) — counted
  by glob
- **F6 wants a verdict ahead of the council** — the one fulcrum that turns dirty at execution
- **4 dreams caught and symlinked**
- ⚠️ **not one thing was overruled, waived, or lowered** to reach this point
