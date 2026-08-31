# rule.require.catalog-is-an-index

## .what

**a catalog is an index. one row per member, and no narrative about any one of them.**

a catalog's whole claim is that a reader can walk the **set** at a glance. the moment a `###`
section about one member lands in it, the index it advertises becomes a preamble to a logbook.

it takes the itemization form every itemized set takes —
`catalog.of=$concept._.md` plus one `$dimension=$position.md` per member
(`rule.forbid.itemization-without-coordinates`). the kind decides what each entry **carries**; the
coordinates decide where each entry **sits**.

## .why — a catalog does not rot by one bad edit; it rots by fifty good ones

the accretion path is mechanical, and every step of it is correct:

1. a review round finds an instance of an extant class
2. the author amends **the row** — rightly, since a recurrence is a fact about the row
3. **the row lives in the catalog**, so the occurrence record lands there too
4. nobody sweeps it

⇒ every author was right, and the artifact still became unusable.

**the cost compounds because a catalog boots into every session.** each line of narrative is a
permanent token charge on every reader, to carry a record that at most one reader that day needs —
and the table a reviewer actually walks ends up buried beneath it.

> 🔴 **the artifact gets harder to use as it gets more complete.** that is the signature of the
> defect, and it is the opposite of what a catalog promises.

## .the three grains — the model every clustered artifact shares

| artifact | grain | holds |
|---|---|---|
| the **catalog** | the **SET** | one row per member: the pattern, its rule, its detect question |
| the **rule** | the **CLASS** | the mechanism, the detect question, ONE worked case, the fix, the enforcement |
| the **example** (`.example=$id.md`) | **ONE OCCURRENCE** | the date, the id, the sweep table, the results, the residual |

⚠️ **an occurrence spans two of those grains and belongs to exactly one:** its own example file.
that ambiguity is why it drifts into the catalog by default — the row it amends is real, so the
record feels at home beside it.

## .the test — asked BEFORE a paragraph lands

> **"is this about the CLASS, about the SET, or about ONE OCCURRENCE?"**

| the answer | the home |
|---|---|
| the **class** — what the pattern is, how it fails, how to fix it | the **rule** |
| the **set** — a classification, a through-line, a named gap | the **catalog** |
| an **occurrence** — a date, a result id, an outcome, a sweep table | `example=$id.md` |

⇒ prose about the SET is **allowed** in a catalog and is what a catalog is for. prose about one
MEMBER is the violation, however true it is.

## .the repair is an ejection, never a trim

when a catalog's narrative exceeds its index, the fix is **not** to compress the prose. compressed
prose about one member is still prose about one member, and it re-grows on the next round.

**eject it** — move each occurrence record to its own `example=$id.md`, and leave the row.

## .enforcement

- a `###` narrative section about ONE member, added to a catalog = **blocker**
- an occurrence record with no `example=$id.md` home = **blocker**
- a catalog whose narrative exceeds its index = **blocker**, and the repair is an **ejection**,
  never a trim
- prose about the SET — a classification, a through-line, a named gap = **false positive**, that
  is what a catalog is for

## .see also

- `rule.require.catalog-is-an-index.example=declastruct-aws-security-catalog.md` — the measured
  case: ~2,950 lines wrapped around a 28-row index
- `rule.require.rules-are-clusters` — the same three grains, applied to a rule file
- `rule.require.inventory-for-enumerable-concepts` — when the set is generable, the artifact is an
  inventory rather than a catalog
- `rule.forbid.itemization-without-coordinates` — the filename contract this obeys
- `kno201.documents._.[catalog]` — the archetype this constrains
- `rule.always.yield-the-output-not-the-archaeology` (driver) — the same claim for a route yield:
  the answer stays, the history moves
