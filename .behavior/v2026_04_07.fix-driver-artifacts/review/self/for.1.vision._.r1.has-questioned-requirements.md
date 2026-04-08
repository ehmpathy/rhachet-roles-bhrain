# self-review: has-questioned-requirements

## questioned: the alpha-order claim

**the wish claims**: "this better alphaorders"

**questioned**:
- `v` comes before `y` alphabetically
- both `v1.i1.md` and `yield.md` sort after `guard` and `stone`
- the alpha-order benefit is minimal

**verdict**: the claim is weak, but not wrong. the real benefit is CLARITY, not order. the vision correctly emphasizes clarity over order in the evaluation section.

**holds**: yes, with clarification that clarity is the primary driver, not order.

---

## questioned: one yield per stone

**the assumption**: stones produce exactly one primary artifact

**questioned**:
- what about research stones with multiple probe outputs?
- codebase search shows: `probe.v1/*.probe.research.response.v1.i1.md`
- research stones use a different pattern: subdirectories with multiple files

**verdict**: research stones are an exception that already uses a different pattern. main behavior stones (vision, criteria, blueprint) do produce one primary output.

**holds**: yes, for non-research stones.

---

## questioned: no version tracking needed

**the assumption**: git handles version history

**questioned**:
- what if someone wants to compare v1 vs v2 of a spec side-by-side?
- current pattern allows `1.vision.v1.i1.md` and `1.vision.v2.i1.md` to coexist
- is this actually used anywhere?

**research**: searched codebase for `.v2.` patterns - found none in behavior artifacts. the v2 capability is theoretical, not practical.

**verdict**: unused flexibility. git history is sufficient.

**holds**: yes.

---

## questioned: could we achieve the goal simpler?

**questioned**:
- this is already a simple rename
- no new features, no new complexity
- just clearer names

**verdict**: this is already the simplest solution.

**holds**: yes.

---

## questioned: what if we didn't do this?

**questioned**:
- the system continues to work
- newcomers continue to wonder "what's v1.i1?"
- cognitive overhead persists but isn't a blocker

**verdict**: this is a quality-of-life improvement, not a necessity. but small improvements compound.

**holds**: yes, worth the effort despite not critical.

---

## summary

all requirements hold. the vision is sound.

primary benefit is **clarity**, not alpha-order (despite what the wish emphasized).
secondary benefit is **simplicity** - fewer tokens, no unused version complexity.

no changes needed to the vision.
