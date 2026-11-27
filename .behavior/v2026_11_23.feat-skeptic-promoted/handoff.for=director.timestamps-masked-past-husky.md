# handoff: timestamps masked past the husky hook

## .what happened

times of day landed in tracked files, and the husky timestamp hook let them through. two shapes slipped past:

- **masked digit**: one digit swapped for `x`, e.g. `inbox: <date>T<hh>-<m>x-<ss>-<ms>Z`. a mask hides a digit, not the time; the hour and seconds still show
- **dash time id**: a time with dashes, no colons: `<date>T<hh>-<mm>-<ss>-<ms>Z`, or the bare tail `<hh>-<mm>-<ss>-<ms>Z`

## .why the hook missed them

- `.husky/check.timestamps.sh` matches only digits in each clock slot (`[01][0-9]`, `[0-5][0-9]`), so an `x` breaks the match
- it catches the dash form only after a `T`, and only when the tail fits its zone pattern
- it skips `.ts` and `.sh` files. on this branch, stamps sat in a test file and in a skill header

## .where they come from

agents copy log paths and run ids into prose: seeds, goals inventories, fulcrums, fixtures, and tests that read a local `.log/` file by its stamped name. told a stamp is unwelcome, an agent masks one digit rather than drop the time. the masked form is the pattern to hunt.

## .ask 1 — find other cases across the org

search every repo, tracked files and git history, for:

| shape | regex |
|---|---|
| masked stamp | `[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9x]{2}[-:]?[0-9x]{2}`, where the match holds an `x` |
| dash time id | `(^\|[^0-9])[0-9x]{2}-[0-9x]{2}-[0-9x]{2}-[0-9]{3}Z` |
| any stamp in code | the usual stamp regex, run on `.ts`, `.js`, `.sh` too |

likeliest homes:
- `.behavior/**/.seeds/`, `.behavior/**/.fulcrums/`, `.goals/**/asks.inventory.jsonl`
- test fixtures, and any test that picks a `.log/` file by its stamped name

the fix per case:
- keep the date, drop the time
- a test that picks a log by a stamped name picks it by date plus content instead

paved tool (rhachet-roles-bhrain): `rhx timestamps.strip` — plan by default, `--mode apply` writes; code files are listed for a hand fix, never written.

## .ask 2 — upgrade the husky hook upstream, in the declapract practice

the hook is locked: `.husky/check.timestamps.lock.sh` halts any commit where the hook differs from the practice copy. so the fix lands in the practice, which rewrites both files at once; each consumer repo takes it on its next upgrade.

the hook owes:
1. every clock slot accepts `[0-9x]`, so a masked digit still matches
2. the dash time id is caught with or without a `T` or a date ahead of it
3. no skip of `.ts`, `.js`, `.sh` — code holds stamps too (fixtures, log paths, doc headers)
4. a test case per new shape (a masked stamp, a bare dash id, a stamp inside a `.ts`), each one fails the hook

## .status

- rhachet-roles-bhrain, branch `beav/feat-skeptic-promoted`: `rhx timestamps.strip` reports 0 files left to strip
- ask 2 is dispatched: ehmpathy/declapract-typescript-ehmpathy#845 — `feat(husky): check.timestamps catches masked digits, dash time ids, and stamps in code files`. its body: `dispatch.for=declapract.husky-timestamps-masked.md`, beside this file
