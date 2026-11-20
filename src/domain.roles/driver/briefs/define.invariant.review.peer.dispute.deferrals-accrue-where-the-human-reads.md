# define.invariant.review.peer.dispute.deferrals-accrue-where-the-human-reads

## .what

> **a deferral is a named line in the halt the human reads, never an entry in a list the gate counts
> as answered.** a disputed or held concern shows by name at the gate, with its case, its confidence,
> and the driver's lean.

## .kind

**nurture.** the team chose it, to protect the human's attention at the one moment it is spent in
full. a different team could trust the driver's summary. this one has the incident that shows what
a summary hid.

## .invariant

```
F is a deferral (a disputed concern, or a held fulcrum)
    ⟹  the gate's halt holds one line that names F
        the line is derived from F's frontmatter, never from the driver's prose

a list the gate counts as answered  ⟹  holds no deferral that the human has not seen named
```

## .why

a human at a gate reads what the halt shows. a deferral that sits in a list the gate counts as
answered is invisible by construction: the tally reads clean, the halt reads clean, and the human
approves what is shown. the incident held a table of rows at 55 to 90 percent confidence in exactly
such a list, and two of the three defects the human then found by hand sat in it.

⇒ the line must exist because the halt derives it, so the driver's care is not what decides whether
the human sees the deferral. a driver cannot hide a line the halt writes.

## .scope

- it governs every deferral a gate summarizes: a dispute, a held fulcrum, an unreadable fulcrum
- it is the contract half of `define.invariant.review.peer.dispute.reconciled-at-the-human-gate`:
  that invariant fixes the halt and the refusal, this one fixes the duty the halt serves
- the driver pair states the duty as an act: `rule.require.deferrals-accrue-in-the-blocker-list`
  and `rule.forbid.deferrals-hidden-from-the-human`

## .the litigation

the first fix reads as "tell the driver to list every deferral in the yield". that leaves the list
in the driver's prose, where the driver's judgment of "worth a line" decides what the human sees. the
incident was exactly that judgment, applied in good faith. so the fix moves the line out of the
driver's hands: the halt reads structured data and writes the line itself.

the same data makes the line cheap for the driver. one frontmatter block per fulcrum is the whole
cost, and it is owed anyway (`the-fulcrum-is-the-one-home`).

## .the counter-argument

*"a halt that lists every deferral grows long, and a long halt is not read."* stated fairly. the
line is short and fixed in shape: case, concerns held, confidence, lean. a reflect-owed dispute shows
apart as information and never blocks. and a long list is the honest picture of a long deferral
debt: a driver that wants a shorter halt repairs the concerns, which is the point.

## .what would overturn it

- a gate that carries too many deferrals for one read, measured. that would argue for a mid-route
  checkpoint that drains the list earlier, never for a hidden line
- a verdict that a human gives from the line alone, with no need to open the fulcrum, at a high rate.
  that would argue for fewer fields on the line, not for fewer lines

## .enforcement

- a deferral held in a list the gate counts as answered, with no named line at the gate = **blocker**
- a halt line built from the driver's prose where frontmatter exists = **blocker**
- a deferral shown to the driver and withheld from the human's refusal = **blocker**
- enforcer: the halt of `define.invariant.review.peer.dispute.reconciled-at-the-human-gate`. the line
  exists because the halt derives it from frontmatter. one clamp serves both invariants: a human gate
  with a dispute at 70% names it, and with the halt reverted the halt is silent

## .see also

- `define.invariant.review.peer.dispute.reconciled-at-the-human-gate` — the halt this rides on
- `define.invariant.review.peer.dispute.the-fulcrum-is-the-one-home` — the data the line derives from
- `rule.require.deferrals-accrue-in-the-blocker-list` · `rule.forbid.deferrals-hidden-from-the-human`
- `rule.always.defer-fulcrums-to-last` — the park the human reads from
