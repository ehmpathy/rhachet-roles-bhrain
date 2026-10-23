# S51 — enable append of partitions, or guide them to match better by default

- said 2026-10-07, in reply to the report that one unclaimed file cost a ~3,000-char re-declaration
  of all seven partitions

## .said

> yeah why wouldnt we just enable append of partitions? - Adding one file means re-declaring every
> partition. To claim biome.jsonc I had to run a printed repair command about 3,000 characters long
> that re-declares all seven partitions. … or guide to make the partitions match better by default

## .settled

- a partition set may be **appended to** by slug: one glob added to one partition, while the
  stored set stays whole. the CLI reads the declared set, merges the addition, and writes the whole
  set back, so S46's guarantees hold: the stored declaration still names the whole set, and
  coverage still fails fast at the declaration
- this supersedes S46's "no `--set`/`--del`" clause for **addition** only. there is still no
  partial removal
- a printed repair names the **smallest** command that closes the gap (one append), never a
  re-declaration of the whole set
- partitions should **match better by default**: the tool guides an unclaimed file to the named
  domain partition it belongs in. how that default is shaped is settled by S52 — never a catch-all

## .landed

- `.fulcrums/inventory.of=fulcrums.case=F172-a-repeated-partition-slug-merges-and-plus-equals-is-refused.md`
  (verdict: overruled toward append)
