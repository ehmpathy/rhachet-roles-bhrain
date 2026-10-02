# F5 — `clone whoami` grows a `brain` field

**rework** = 🔴 dirty · **status** = ✅ ruled 2026-09-13 — accept the silent corner; the ask stands
upstream, never as a dependency · **confidence** = settled

## .the fork

`clone say` proves submit, never accept. `case=3` wants the driver to know whether the brain took
the `/model`. `clone whoami` returns serial, slug, reach state, and actor hash — no brain
(`invokeCloneWhoami.js:74-80`).

| candidate | observes | cost | defeated by |
|---|---|---|---|
| `whoami` grows a `brain` field | the brain's **state** | a cross-repo ask; a `/model`-argument ↔ brainslug bridge with no shipped instrument (`F10`) | a hand-typed `/model` — a launch-time record goes stale |
| `clone get` reads the reply | the brain's **own reply** | none — shipped, same vocabulary as the dispatch | a silent refusal, or a changed refusal text |
| declare — label it `requested` | naught | none | — it claims no confirmation |
| the driver self-reports | a guess | none | — the fact under question |

⇒ neither read is a superset of the other.

## .what narrowed the ask

- `F14` made the applier convergent, so **apply** reads no live brain; a hand-typed `/model` is
  repaired at the next boundary with no read at all
- ⇒ the ask serves one act — **verify** — and one corner of it: a silent refusal

## .measured 2026-09-16 — `clone get` observes naught on this host

| probe | result |
|---|---|
| `rhx clone whoami --output json` | `{ serial: afb89825…, slug: null, reachState: "LIVE" }`, exit 0 |
| `rhx clone get @:afb89825… --tail all --output json` | `{ total: 0 }` |
| `rhx clone list --output json` | `exid: null` on all 29 clones |

`clone get` keys its read on `exid`, and no clone here carries one — so neither half of verify is
covered today. (`5.4.dogfood.brain-switch.yield.md` names the cause: serial and exid are joined by
no map.)

⇒ a contract read tells you what a surface promises; only a run tells you what it returns.

## .the verdict

> *"silent failure is fine for now. lets leave a todo to fix that once rhx whoami includes brain. it
> totally should."* — the wisher, 2026-09-13

- **this route does not wait** on a live-brain field — the render says `requested`, an honest label
- **rhachet should have one** — dispatched as `ehmpathy/rhachet#528`, 2026-09-13, from
  `.dream/v2026_09_09.reseed.clone-whoami-cannot-report-the-live-brain.md`
- the accepted cost is the status quo: an undetected refusal leaves the stone on the inherited brain,
  which is what every drive did before this feature
- 🟡 the silent refusal is inferred, never observed — the upstream ask must say so
- 🟡 the ask must settle **launch-time vs live** first: a launch-time field goes stale on the first
  hand-typed `/model`

no code here is written against the absent field, so the upgrade is an addition, never a rework.

⇒ the full entry, with the five candidates and every re-grade (70% → 45% → 40%):
`../appendix/.fulcrums/inventory.of=fulcrums.case=F5-whoami-grows-a-brain-field.md`
