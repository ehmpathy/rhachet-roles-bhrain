# domain.term.choice.reason: route.guard.level.wave

## .etymology

**wave** names the shape of the release: a level's reviewers are poured together, but their blocks
come down **as a wave** — each crests only once every earlier-declared slot has broken. the render
never shows block 3 before blocks 1 and 2, even where 3 settled first, so the results arrive in
declared order like a wave rolls to shore in one direction.

it pairs with **pour** by the same water metaphor the wisher's **bottleneck** set: the level pours,
and its results return as a wave. one word for the act, one for the ordered return.

## .the enumeration

the word must cover every state-shape the buffer holds:

| # | the instance |
|---|---|
| i1 | a member settles **in order** — released at once |
| i2 | a member settles **early** — held until its predecessors land |
| i3 | a member settles a **second time** — the repeat converges to a no-op |
| i4 | a member index **outside the roster** — a throw, not a silent drop |
| i5 | the **live counters** a status line reads: `inflight`, `done`, `left` |

| candidate | verdict | the row it breaks on |
|---|---|---|
| `batch` | **too rigid** | asserts all-or-nothing; breaks i1/i2, where blocks release one at a time as predecessors land |
| `queue` | **forbidden metaphor** | the vision's model explicitly rejects the queue — order among members must NOT read as significant. a wave orders only the render |
| `buffer` | **the genus** | true but undifferentiated — the wave is a buffer with an ordered-release rule; `buffer` names the box, `wave` names the rule |
| `cohort` | **wrong axis** | shares a start time; a wave's members settle at different moments (i2) |
| ✅ `wave` | **covers all five** | an ordered swell that holds early arrivals and breaks in sequence — the exact settle discipline |

## .disputes

none raised. `wave` fell out of the water metaphor that `pour` and `bottleneck` established; no fork
was argued at the vision. recorded so a later dispute has a seat.

## .evidence

- discovery: the water metaphor — `bottleneck` (S1) → `pour` (the act) → `wave` (the ordered return)
- precedent: `genReviewWaveBuffer`, `ReviewWaveBuffer`, `ReviewWaveStatus` — one word across the
  object, its factory, and its status shape
- invariants:
  - a wave orders the **render** only, never the run — members execute concurrently; only their
    blocks are held to declared order (this is why `queue` is the forbidden reading)
  - `done + left = members` at every tick, where `left = inflight + queued` — the counter invariant a
    status line depends on
  - a repeat settle is a **no-op**, and an off-roster index is a **throw** — the buffer fails loud on
    a real defect and converges on a benign repeat
