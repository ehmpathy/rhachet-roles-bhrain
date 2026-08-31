# seed: the fulcrum record is an inventory, and every itemization takes the inventory filename form

**2026-08-28. overruled a driver's conclusion that fulcrums are a catalog, and settled the filename
convention for every enumerable itemization in the repo.**

## .said

> you're right, so it should be a catalog. with the same inventory filename pattern though

> i.e., catalogs reuse the inventory file patterns ; $key=$value combos / knawmean?

> we should enbrief that whenever theres an enumerable itemization, whether its a catalog or an
> inventory, it should use that inventory filename convention

> no. keep the .fulcrums/ dir and also enumerate into inventory.of=fulcrums._.md and
> inventory.of=fulcrums.case=$case.md

> thats the inventory pattern

> always the inventory manfiest file itself, along with each entry of each case in the inventory.

> also, librarian should know that when there are many subscopes or zooms, we use a ._.md to
> describe the summary

> and that the inventory pattern just leverages that

## .settled

**1. the artifact kind does not choose the filename.** an inventory and a catalog take the same
name. the kind decides what each entry *carries*; the coordinates decide where each entry *sits*.

**2. the inventory pattern is a flat cluster, never a directory.**

```
$kind.of=$concept._.md                      # the summary
$kind.of=$concept.$dimension=$position.md   # one entry per member
```

⚠️ the driver had modeled an inventory as a **directory** — `inventory.of=$concept/` with entry
files inside. that was wrong, and the correction is the whole reason this seed exists.

**3. both files are always owed** — *"always the inventory manifest file itself, along with each
entry of each case."* a summary alone is a list; entries alone have no place to declare their axes.

**4. `._.md` is a general convention, not an inventory detail.** whenever a subject splits into
many subscopes or zooms, `$subject._.md` is the summary. **the inventory pattern leverages that
convention; it does not declare it** — which is why the librarian owns it as its own rule.

**5. the fulcrum record is an inventory over the `case` axis**, and `.fulcrums/` stays. the
driver's argument that an occurrence set cannot be an inventory was overruled.

## .landed

- `src/domain.roles/librarian/briefs/rule.require.summary-at-the-cluster-root.md` — new; the `._.`
  convention, stated generally
- `src/domain.roles/librarian/briefs/rule.forbid.itemization-without-coordinates.md` — rewritten to
  the flat `._.` + entries form; composes the rule above and does not restate it
- `src/domain.roles/driver/briefs/rule.always.itemize-the-fulcrums-you-best-guess.md` — renamed
  from `…catalog-the-fulcrums…`; declares `.fulcrums/inventory.of=fulcrums._.md` + `.case=$id.md`
- `.behavior/v2026_08_12.feat-adopt-seeded-briefs/.fulcrums/` — the artifact itself, conformed
- `src/domain.roles/{driver,librarian}/boot.yml` — the boot lines
