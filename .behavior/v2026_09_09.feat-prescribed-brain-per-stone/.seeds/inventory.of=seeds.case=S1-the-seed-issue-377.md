# S1 — the seed issue: a prescribed brain per stone

- **source** = `ehmpathy/rhachet-roles-bhrain#377`, author `ehm-a-beaver`
- **archived** = 2026-09-09
- **why archived** = it lives outside this repo, it is editable, and the vision's whole design traces
  to its four open questions

## .said — verbatim

> 🦫🎙️   dispatch to foreman
> ```
> 💧 task enqueued
>    ├─ priority = ?
>    ├─ yieldage = ?
>    └─ leverage = ?
> ```
> **title**
> feat(route): support a prescribed brain per stone in the .guard file
> **description**
> ## what
>
> add a **prescribed brain per stone** to the `.guard` schema — a top-level field (e.g. `brain:`) whose
> value is a brainslug (e.g. `claude-opus-5[1m]`), so a stone can declare which brain the driver should run
> under while it works that stone.
>
> ## why
>
> different stones want different brains:
>
> - cheap + fast stones (routine execution steps) want a **Sonnet** driver — lower cost, higher speed on
>   the always-on driver seat.
> - hard-thought stones (blueprint, execution, verification) want an **Opus** driver — the ~11-point
>   SWE-bench-Verified lead earns its premium where the work is ambiguous and multi-file.
>
> today the only per-brain lever is `--model` on the L3 peer-review **enroll** commands (see the
> `5.1.execution.phase0_to_phaseN.guard` L3 reviews: `$rhx enroll claude --model 'claude-sonnet-5[1m]'
> ...`). the **driver itself** has no declarative way to switch — it stays on whatever brain launched it.
> we want the stone to declare its brain, and have it applied reliably + automatically, not by hand.
>
> ## how it would be used
>
> when the driver enters (or picks up) a stone, the **driver role's hooks** read the stone's guard
> `brain:` and dispatch the switch into the live driver clone via the `enroll-with-interface` surface:
>
> ```
> rhx clone say @:driver --what '/model <brainslug>'
> ```
>
> that lands the `/model` switch on the live driver clone reliably (the `clone say` contract proves
> delivery, so the switch is never silently dropped). so a stone declares its brain, the hook applies it,
> and the driver runs the rest of that stone under the prescribed brain — no manual `/model` entry.
>
> ## precedent to mirror
>
> the guard already prescribes a model per L3 peer review. this extends the exact same idea one level up —
> to the stone + driver, not only the spawned reviewer.
>
> ## suggested shape
>
> - a top-level `brain:` key in the `.guard` YAML (value = a brainslug), parsed alongside
>   `judges` / `reviews` / `artifacts`.
> - surfaced by the route engine (bhrain's `route.stone.*`) — e.g. a `route.stone.get --field brain`
>   accessor — so the driver-role hook can read the prescribed brain for the current stone.
>
> ## open design questions (for the maintainers)
>
> - **field name:** `brain:` (rhachet's domain term for an inference provider) whose value is a brainslug,
>   vs `model:`. the slash command is `/model`, but the rhachet concept is "brain" — lean `brain:` field
>   applied via `/model <slug>`.
> - **who applies it:** the route engine EXPOSES the field; the driver-role hook APPLIES it via
>   `clone say`. keeps the "say into the live clone" concern on the driver / enroll surface, not the judge.
> - **reliability + fallback:** the switch needs the driver clone reachable (LIVE). if the driver is
>   DEAF / DEAD, or the brain does not support `/model`, fail loud + name the fix (per the ergonomist
>   errors-name-the-fix rule), never a silent no-op.
> - **default + stickiness:** a stone with no `brain:` keeps the inherited brain (no switch). decide
>   whether to restore the prior brain on stone-exit or leave it sticky into the next stone.
>
> ## cross-repo touchpoints
>
> - **bhuild** owns the guard TEMPLATES (`src/domain.operations/behavior/init/templates/*.guard`) — the
>   `brain:` field would be stamped there (e.g. an Opus on `3.3.1.blueprint.product.guard.*` +
>   `5.3.verification.guard`, a Sonnet on routine execution). a paired bhuild task may be warranted.
> - **enroll-with-interface** (in flight in the `rhachet` repo) delivers `rhx clone say @:<slug>` — the
>   delivery mechanism this switch rides on. best to sequence after it ships, or at least pin to its
>   `clone say` contract.

## .settled

what now holds, stripped of this route's machinery:

1. **a stone declares its brain.** a `.guard` carries a top-level field whose value is a brainslug
2. **the route engine exposes; the driver-role hook applies.** the switch rides `clone say`, not the
   judge
3. **a stone with no field keeps the inherited brain.** no guard is forced to declare one
4. **an unreachable driver fails loud and names the fix.** never a silent no-op
5. **the reason is cost against quality** — a cheap brain on routine stones, a rich brain where the
   work is ambiguous. 🔴 **which stones those are is corrected below** — the issue's own list is wrong

## 🔴 .the four questions it left open, and where each was answered

the issue names them itself. each was best-guessed rather than blocked on
(`rule.always.defer-fulcrums-to-last`):

| the issue's question | answered at |
|---|---|
| field name — `brain:` vs `model:` | `F2` — `brain:` canonical, `model:` a warned alias |
| who applies it | taken as stated: the driver-role hook. `F7` settles *which* hook |
| reliability + fallback | `F1` (halt vs warn) · `F5` (how a refusal is even detected) |
| default + stickiness | `F6` — sticky, with attribution |

## 🟡 .where the vision had to go past the issue

five facts the issue could not have known, each measured rather than assumed:

| the issue assumed | what holds |
|---|---|
| *"the `clone say` contract proves delivery, so the switch is never silently dropped"* | it proves **submit**, never **accept**. a refused slug returns `delivered: true` — the sharp seam of `case=3` |
| the hook reads the guard and dispatches | a hook that awaits a say into **its own** clone deadlocks — `case=5` |
| a new `brain:` key is parsed alongside the extant keys | a misspelled key is **dropped in silence** today — `case=4` |
| 🔴 *"the only per-brain lever is `--model` on the L3 peer-review **enroll** commands"* | `rhx enroll` ships **no `--model`**. the live lever is `rhx review --brain <slug>`, whose value is a brainslug. the cited guard lines sit in archived routes and invoke a flag that is gone |
| 🔴 *"hard-thought stones (**blueprint, execution, verification**)"* — amended 2026-09-13 | **wrong, and the wisher corrected it.** the hard stones are **vision and blueprint**; every stone from the roadmap onward is mechanical. execution stamps what the blueprint settled; verification checks what the criteria named. ⇒ `S7` |

⇒ the issue's own words hold everywhere except at these five seams, and each is a measured fact
rather than a difference of opinion.

### 🔴 the fifth row is a different KIND, and it is why this archive earns its place

the first four were caught **before** they reached the distillate. the fifth was not:

| | rows 1–4 | 🔴 row 5 |
|---|---|---|
| caught | at the groundwork read, against the shipped code | **not caught.** it propagated into the yield's own day-in-the-life |
| survived | zero review rounds | 🔴 **five self-review rounds** |
| how it closed | a measurement | the wisher, by hand |

⇒ **every self-review checked the distillate against the seed, where the seed was the source of the
error.** a fidelity check cannot catch an inherited premise — it grades the copy, and the copy was
faithful.

🔴 **so the archive discharged its purpose in reverse.** `rule.always.archive-the-wishers-words-verbatim`
justifies a seed as *"what the next traveler checks the distillate against."* here the distillate was
right to check against and **the source was wrong** — which is a use the rule does not name and this
row now records.

⚠️ **the durable form: a seed's claims are ARCHIVED, never RATIFIED.** an inherited premise carries no
more warrant than an authored one, and it gets less scrutiny precisely because it arrived with
authority. ⇒ the four rows above were checked because they touched **code**; row 5 was a claim about
**the work**, and nothing in the loop was pointed at it.

🟡 **the `.said` block is untouched, and must stay so.** the issue's words are verbatim by contract —
a correction lands in this table, never in the quote.

🟡 **the fourth helps the issue rather than corrects it.** the issue framed `brain:` as a choice
against an extant `model` convention. there is no live `model` convention — rhachet already ships a
`--brain` flag whose value is a brainslug, so the issue's preferred field name is the one that
**conforms**, and it was under-argued in its own text.

## .landed

- `1.vision.yield.md`
- `1.vision.experience.dimensions.md` · `1.vision.experience.case=_.md`
- `1.vision.experience.case=1..10.*.md`
- `.fulcrums/inventory.of=fulcrums._.md`
