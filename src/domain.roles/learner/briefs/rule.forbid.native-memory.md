# rule.forbid.native-memory

## .what

never persist knowledge into claude's **native memory** (the machine-local
`~/.claude/**/memory/` store, e.g. `MEMORY.md`). capture it durably in this repo instead:

- **lessons** → briefs in `.agent/repo=.this/role=any/briefs/`
- **tactics** → skills in `.agent/repo=.this/role=any/skills/`

## .why

the instinct to persist a lesson is **good** — keep it. the problem is only *where* it lands.

native memory is:

- **machine-local** — lives in `~/.claude/...`, never leaves this laptop
- **invisible in git** — no diff, no review, no history
- **not reusable** — the next traveler (human or clone, any machine) never sees it
- **not durable** — one machine wipe and the lesson is lost

durable capture in `.agent/` is the opposite: git-visible, reviewed in PRs, and booted into
every future session — so a lesson hardwon once is never won twice.

## .when

redirect to durable capture whenever you would reach for native memory:

- a concept surprised you or was hard to discover
- an action took multiple steps or was hard to find
- you learned a rule, gotcha, or fix worth a note
- you built a repeatable command or workflow (→ a skill)

## .how

1. notice the urge to "remember this"
2. decide the shape:
   - prose insight → write a **brief** (`.agent/repo=.this/role=any/briefs/<name>.md`)
   - repeatable command → write a **skill** (`.agent/repo=.this/role=any/skills/<name>.sh`)
3. write it there, commit it, and it boots for every future traveler

a PreToolUse hook (`memory.guard`, owned by the learner role) halts writes to native memory
and prints this redirect — so you do not have to recall the rule mid-flow.

## .the exception — generalize machine-local secrets or paths

some notes carry machine-specific literals that must **not** enter a shared git repo verbatim:

- local absolute paths (e.g. `/home/vlad/.rhachet/keyrack/...`)
- secrets, secret-hints, credential locations
- per-clone ephemeral scratch

the lesson is still worth capture — the *literal* is the only problem. so **generalize** it:
replace the machine-specific value with a placeholder, keep the reusable insight, and keep the
raw secret or path out of durable memory.

- 👎 `keyrack for this host lives at /home/vlad/.rhachet/keyrack/ehmpath.json`
- 👍 `keyrack lives at ~/.rhachet/keyrack/<owner>.json` — path generalized, no host specifics

for a true **secret** (a credential value, token, key), do not even generalize the value —
capture only the *shape* of the lesson (e.g. "unlock the keyrack before integration tests"),
never the secret itself. the durable store is for **shared, reusable knowledge**, not
machine-local state.

## .what is allowed

the guard is precise — it targets only the native-memory store, so these remain fine:

- `~/.claude/settings.json` and other config (not memory)
- `CLAUDE.md` (already durable + git-visible)
- reads of native memory (only *writes* are halted)

## .the boundary — the guard is a safety net, not a seal

a guard halts the common ways knowledge lands in native memory, but it cannot catch every path.
so do not read the guard's silence as "this was fine": the discipline is yours. when you mean to
persist a lesson, redirect it to `.agent/` by hand, whether or not a guard stops you.

## .enforcement

write to `~/.claude/**/memory/**` or `~/.claude/**/MEMORY.md` = **blocker** (halted by the
`memory.guard` hook; redirect to `.agent/` instead)

## .mantra

> the diary fades; the noticeboard endures. write where the next traveler will read. 🦉📜
