## .what

extend `src/practices/husky/best-practice/.husky/check.timestamps.sh` (and its lock, `check.timestamps.lock.sh.declapract.ts`, which stamps the new blob id) so it catches the timestamps that slip past it today.

## .why

agents copy log paths and run ids into tracked prose. told a stamp is unwelcome, an agent masks one digit (`<date>T<hh>-<m>x-<ss>-<ms>Z`) rather than drop the time. the hook passes it: each clock slot accepts only a digit. the hour and seconds still leak.

found in rhachet-roles-bhrain, branch `beav/feat-skeptic-promoted`: seeds, a goals inventory, fulcrums, fixtures, and a test that read a `.log/` file by its stamped name.

## .the gaps

1. **masked digit**: a clock slot holds `x` (`T<hh>-<m>x-<ss>`). accept `[0-9x]` per slot
2. **dash time id**: `<hh>-<mm>-<ss>-<ms>Z` with no `T` or date ahead of it. caught only after a `T` today
3. **code files skipped**: `.ts`, `.js`, `.sh` are never scanned, yet they hold stamps (fixtures, log paths, doc headers)

## .the owed tests

one case per new shape, each must fail the hook:
- a masked stamp in a `.md`
- a bare dash time id in a `.md`
- a stamp inside a `.ts`

and a negative: a date alone (`<yyyy>-<mm>-<dd>`) still passes.

## .regex sketch

- masked stamp: `[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9x]{2}[-:]?[0-9x]{2}`
- dash time id: `(^|[^0-9])[0-9x]{2}-[0-9x]{2}-[0-9x]{2}-[0-9]{3}Z`

## .the sweep

a paved strip tool exists in rhachet-roles-bhrain (`rhx timestamps.strip`, plan by default) for a consumer repo to clear what the upgraded hook will then refuse.
