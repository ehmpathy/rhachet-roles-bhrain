# example — the security catalog that grew to 2,950 lines around a 28-row index

a demo of `rule.require.catalog-is-an-index`.

## .the case

**2026 · `ehmpathy/declastruct-aws` · the security catalog.**

the artifact reached **~2,950 lines wrapped around a 28-row index.** not one edit was wrong: each
review round found an instance of an extant class, and each author recorded the occurrence beside
the row it amended — which is where the row lives.

## .the cost

| what | measured |
|---|---|
| the index a reviewer walks | **28 rows** |
| the file a reader boots | **~2,950 lines** |
| ratio of narrative to index | **>100:1** |

the catalog boots into every session, so every one of those lines was a permanent token charge on
every reader — to carry occurrence records that at most one reader that day needed.

⇒ **the artifact got harder to use as it got more complete.** a reviewer who wanted the 28-row
scan had to find it under the log of every instance the 28 classes had ever produced.

## .the repair

an **ejection**, never a trim: each occurrence record moves to its own `example=$id.md`, and the
row stays. compressed prose about one member is still prose about one member, and it re-grows on
the next round.

## .the concept this demonstrates

`rule.require.catalog-is-an-index` — a catalog is an index; one row per member, and no narrative
about any one of them.
