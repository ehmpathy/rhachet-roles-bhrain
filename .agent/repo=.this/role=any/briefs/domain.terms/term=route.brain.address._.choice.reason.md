# domain.term.choice.reason: route.brain.address

## .etymology

rhachet's own docs name a live clone informally as `@:<slug|serial>`, but rhachet declares no
formal noun for that string — `clone whoami`'s payload carries `slug` and `serial` as two
separate fields, never a unified one. this repo's `asCloneAddress` coins the umbrella noun for
"whichever of the two names this clone."

`address` was chosen for its network sense — a value read once, used to reach a target, and
discarded — over the two closer alternatives:

- `id` / `identifier` — already claimed by `slug` and `serial` themselves, the two candidate
  values `address` picks between. to reuse either word for the DERIVED result would overload it
- `handle` — reads as a live reference held open (a socket, a file descriptor). a clone address
  is read fresh on each dispatch attempt, never held

## .disputes

none raised yet.

## .evidence

`asCloneAddress.ts`'s own precedence logic, measured: `payload.slug` preferred when a non-empty
trimmed string; `payload.serial` as fallback under the same test; `null` when neither qualifies.

## .invariants

- an address is never an empty or whitespace-only string
- an address prefers `slug` over `serial` when both are present and valid
- an absent address always pairs with a `route.brain.halt.cause`
