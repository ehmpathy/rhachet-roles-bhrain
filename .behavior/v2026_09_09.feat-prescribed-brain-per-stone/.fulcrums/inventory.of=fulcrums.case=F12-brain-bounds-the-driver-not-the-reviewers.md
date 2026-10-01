# F12 — `brain:` bounds the driver clone, never the reviewers the same guard declares

**rework** = clean · **status** = ✅ ruled 2026-09-10 — upheld · **confidence** = settled

## .the fork

a guard already declares brains, one per peer reviewer:

```yaml
reviews:
  peer:
    - slug: primo
      run: rhx review --rules ... --brain opus
    - slug: cheapo
      run: rhx review --rules ... --brain sonnet
```

a top-level `brain:` makes two scopes in one file. what does it govern?

- **driver-only** — the clone the hook addresses; `--brain` flags untouched
- **stone-wide default** — the driver, plus any reviewer that names no brain
- **stone-wide override** — the driver and every reviewer

## .taken, and why

**driver-only.**

- the hook's lever is `clone say` into the driver's pty; a reviewer is a `run:` subprocess, and to
  govern it needs a second mechanism
- `--brain` on a `run:` line already means the brain of the clone it spawns; the top-level key means
  the same for the clone the guard governs
- a wide read makes a rich driver silently buy rich reviews, every round — `case=7`'s leak, larger

## .the counter-case

*"this stone is hard, so all of it runs rich"* is a coherent ask, and driver-only needs four edits
for it. every other brain in the file applies to a subprocess, so the name does not carry the scope.

## .the verdict

> *"only the driver"* — the wisher (`S2`)

> a declaration governs the actor it names.

- a stone-wide lever, if ever wanted, is a second feature — named as a cost, not reserved
- 🟡 the ambiguity was the defect, not the read: the scope must be documented where a guard author
  reads, because the name does not carry it

⇒ the full entry: `../appendix/.fulcrums/inventory.of=fulcrums.case=F12-brain-bounds-the-driver-not-the-reviewers.md`
