# domain.term.choice.reason: jitter

## .etymology
`jitter` = a small, rapid, random variation about a nominal value. it is the established term in
real-time / distributed-systems for a deliberate random offset added to a periodic event, so many
periodic actors decorrelate instead of fire in lockstep (the classic fleet-burst defense). the
word names WHY the offset exists (break correlation) as much as what it is (a small random delta),
which is why it beats the mechanism-flavored alternatives.

chosen over the vision's own layfolk phrase "off-minute stagger": `stagger` implies a FIXED,
assigned offset per actor (actor A at :00, actor B at :10) — an ordered schedule. what the daemon
does is a PER-TICK RANDOM offset, not a fixed slot, so `jitter` is the precise word and `stagger`
would mislead a reader into a fixed-slot model. `wobble` / `fuzz` / `noise` are too vague (they
name any perturbation, not a bounded timer offset); `skew` names a clock-drift concept, a distinct
matter.

## .disputes
none yet. the vision (Q2) resolved the cadence as "configurable, default ~20min, off-minute to
avoid fleet clusters" — `jitter` is the canonical technical word for that off-minute intent.

## .evidence
- discovery: the vision's Q2 decision ("off-minute to avoid fleet clusters") — a design-decision
  citation, distilled in `.behavior/v2026_08_07.driver-cron/1.vision.yield.md`, and named as a
  behavior-intent gap by the r11 arch-defects reviewer (i006) until it was implemented.
- the concept's attributes: a bounded ratio (`DEFAULT_REMINDER_JITTER_RATIO` = 0.1 = ±10%) applied
  as `intervalMs * (1 + offset)`, where `offset ∈ [-ratio, +ratio]` maps from an injected
  `random()` source (defaulted to `Math.random`, pinned in tests for determinism).
- forbidden-combination invariant: jitter must stay BOUNDED — an unbounded offset would break the
  reminder's cadence guarantee (a tick could be delayed arbitrarily). the ratio clamps it to ±10%.
