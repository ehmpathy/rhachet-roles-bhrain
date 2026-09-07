# F12 · the stophook's flag value is `onStop`, not `hook.onStop`

**rework** = clean
**status** = **settled 2026-09-06 — REVERSED. `hook.onStop` holds.**
**confidence** = **60%**
**where** = `src/domain.roles/telepath/getTelepathRole.ts` · `src/contract/cli/telepath.ts` · `src/domain.roles/telepath/skills/elucidate.summary.sh`

## .the fork, stated fairly

the telepath stophook fires as:

```
rhx elucidate.summary --when onStop
```

**every other onStop hook in this repo fires as `--when hook.onStop`:**

| hook | its flag value | source |
|---|---|---|
| driver · `route.drive` | `hook.onStop` | `.claude/settings.json:265` |
| learner · `learn.domain.terms` | `hook.onStop` | `.claude/settings.json:271` |
| telepath · `elucidate.summary` | **`onStop`** | `getTelepathRole.ts` |

⇒ two words for one concept, and only one of them is used twice. that is
`rule.forbid.domain-term-inconsistency`, whose repair is *choose the canonical word and
conform the rest* — never *declare the second one*.

## .taken, and why at the time

**the wisher typed the string.** verbatim, mid-drive, when they named the skill:

> *"rhx elucidate.summary --when onStop"*

and again in the same breath about the exit contract:

> *"it should emit the reminder even when when != onStop; exit = 2 only onstop"*

⇒ so `onStop` is not a name I improvised past the pavement. it is the wisher's own word,
said twice, and to silently rewrite an explicit string is worse than to carry it and ask.

## .why the confidence is only 60%

the counter is real and it is why this is a fulcrum rather than a settled call:

- **the wisher named the SKILL; they did not rule on the FLAG FORMAT.** both utterances
  are about *what the command is called* and *when it exits 2*. neither weighs `onStop`
  against `hook.onStop`, because the alternative was never put in front of them
- ⇒ so this may be a genuine preference, or it may be an **incidental** string that
  inherits the pavement the moment anyone looks

## .why the rework is clean

three literals, one repo, no consumer has adopted it yet:

| file | the change |
|---|---|
| `getTelepathRole.ts` | one string in the `onStop` hook command |
| `telepath.ts` | one comparison in `elucidateSummary`, plus two help lines |
| `elucidate.summary.sh` | two match arms in the stdin-capture guard, plus the usage block |

🟡 **and it is clean only while it stays unshipped.** the moment a consumer repo runs
`rhachet init --hooks` against telepath, the flag string is written into that repo's
`.claude/settings.json`, and the rework grows a coordination step per adopter.

## .the ask

> **`onStop` or `hook.onStop`?** — a one-word answer.

⇒ the recommendation is **`hook.onStop`**, to match the two extant hooks. it is the
pavement (`rule.always.reuse-pavement-before-improvise`), and this route has already spent
a fulcrum (F11) on exactly this class of defect.

## .the verdict — 2026-09-06

> the wisher, verbatim: *"hook.onStop"*

**taken, and the recommendation held.** all three live hooks now agree on `hook.onStop`.

| where | what changed |
|---|---|
| `.claude/settings.json` | the telepath hook line |
| `src/domain.roles/telepath/skills/elucidate.summary.sh` | the usage block, and the stdin guard that matches on the flag |
| `src/contract/cli/telepath.ts` | the accepted value, the help text, and the fall-through below |

### 🟡 the repair went past the string, because the silent fall-through was the real defect

the cli read an unrecognized `--when` as **absent** and dropped to the by-hand face: exit 0, no
stop held. so a stale `--when onStop` in an adopter's settings would have been **a hook that no
longer fires and reports success** — `rule.forbid.failhide`, and invisible precisely because the
by-hand face is a legitimate mode.

⇒ a wrong value now raises a `BadRequestError` and exits **2** with the valid set named. the
one-word rename was cheap; the fall-through it exposed is what made the fulcrum worth its file.

## .see also

- `inventory.of=fulcrums.case=F11-lane-is-an-undeclared-synonym-for-reviewer.md` — the same
  defect class, at a larger scale
- `.seeds/inventory.of=seeds.case=S26-*.md` — the wisher's words that seeded the hook
