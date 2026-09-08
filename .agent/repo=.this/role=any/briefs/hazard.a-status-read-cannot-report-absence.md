# hazard: a status read cannot report absence

> **a command that lists what IS cannot tell you what is MISSING.** it reports the satisfied cases
> and stays silent on the rest, so its silence carries two opposite meanings at once.

## .what

`status`-shaped commands enumerate live state. they do not enumerate the **declared** set, so a row
that is absent from the output could mean either:

| the silence means | and it is |
|---|---|
| the item is **declared and unsatisfied** | 🔴 a real gap — often a human grant |
| the item is **not declared at all** | ✅ usually yours to fix, in a config file |

⇒ **only the second is a driver-owned lever**, and a status read cannot tell you which one you have.

## .the worked instance — measured 2026-09-07, on this repo

`.agent/keyrack.yml` declares **five** keys under `env.test`. the two commands disagree about how
many exist:

```
$ rhx keyrack status --owner ehmpath
   ├─ ehmpathy.test.FIREWORKS_API_KEY   └─ expires in: 492m      ← one row. that is the whole list.

$ rhx keyrack unlock --owner ehmpath --env test
   ├─ ehmpathy.test.FIREWORKS_API_KEY   └─ vault: os.secure
   ├─ ehmpathy.test.OPENAI_API_KEY      └─ status: absent 🫧
   ├─ ehmpathy.test.ANTHROPIC_API_KEY   └─ status: absent 🫧
   ├─ ehmpathy.test.TAVILY_API_KEY      └─ status: absent 🫧
   └─ ehmpathy.test.XAI_API_KEY         └─ status: absent 🫧
```

⇒ **`status` renders 1 of 5 and reports no gap.** `unlock` walks the declared set and gives each key
its own verdict, so `absent 🫧` is stated rather than inferred from a silence.

⚠️ **the cost is a misrouted diagnosis, never a wrong number.** a suite that dies on a strict
credential source reads, under `status` alone, as *"four keys not configured"* — which sounds like a
`.agent/keyrack.yml` edit, and is a driver-owned fix. under `unlock` it reads *"four keys declared and
absent"*, whose only remedy is `rhx keyrack set` with a secret value — a human grant.

## .the test

> **"does this command walk the DECLARED set, or only the LIVE one?"**

- the declared set → its silence is information
- 🔴 the live set → its silence is **not** information, and you must find the declaration yourself

⚠️ the declaration is the authority, always. here it is `.agent/keyrack.yml`; the same move applies
to any manifest — read the manifest, then diff the live list against it.

## .the general shape, past keyrack

| the surface | the trap |
|---|---|
| `status` / `list` / `ls` | renders live rows; a declared-and-absent row is simply not printed |
| a grep for a name | proves **unused**, never **unclaimed** — a reserved name greps clean forever |
| a `--help` refusal | names ONE requirement; the others stay unlisted (see `term=review.focus._.choice.reason.md`) |
| 🔴 a **pre-flight line** on a wrapper | reports that the **unlock** succeeded, never that the **keys** are present — see below |

⇒ each is the same failure: **an output shaped by what succeeded, read as though it were shaped by
what was asked for.**

### 🔴 the third surface, and it is the one a driver actually reads

**measured 2026-09-07.** the two commands above are ones you must think to run. this one prints
itself, unbidden, at the top of the command you already ran:

```
$ rhx git.repo.test --what acceptance --against local --env test --scope 'path://routeStoneJudgeTally' --mode apply
   ├─ keyrack: unlocked ehmpath/test        ← the ONLY credential line in the whole tree
   ├─ files └─ src/contract/cli/routeStoneJudgeTally.acceptance.test.ts
   ├─ status └─ ✋ failed (18s)
   └─ tip: Read the log for full test output and failure details
```

the suite never ran. it died at `jest.acceptance.env.ts:63` on a strict source, with four keys
`absent 🫧` — and **those four rows appear only in the stderr log file**, which the skill's own
design discourages a reader from a look at (*"summary output saves tokens; details in log file"*).

⇒ 🔴 **so a credential refusal and a genuine test failure are indistinguishable in the curated
output**, and `keyrack: unlocked` sits above both. the line is not false — the keyrack *was*
unlocked. it answers *"did the vault open?"* while the reader needs *"are the keys in it?"*

⚠️ **the sharpest part: the taxonomy to say this already exists and is not reached.** the same skill
grades an unmatched scope `status: constraint` — *caller must fix* — yet grades four declared,
absent, human-granted credentials as `✋ failed`. **the more human-owned of the two is the one
rendered as a test failure.**

⇒ the cost lands exactly where this brief says it does: a driver reads `failed` and looks for a
defect in the test. the remedy is a `rhx keyrack set` with a secret value, and no part of the
curated output points there. re-seeded to the tree that owns the skill.

## .see also

- `explainer.keyrack-githubactions-in-cicd` — the same credentials, in the environment that runs CI.
  ⚠️ a key absent on a host may be **present** there, which is a second scope this read must not skip
- `im_an.obsessive_learner.for.domain.glyphs` — *"a grep proves a glyph unused, never unclaimed"*, the
  same hazard on a different surface
- `rule.require.trust-but-verify` (mechanic) — verify the claim, and verify the **scope** of the claim
