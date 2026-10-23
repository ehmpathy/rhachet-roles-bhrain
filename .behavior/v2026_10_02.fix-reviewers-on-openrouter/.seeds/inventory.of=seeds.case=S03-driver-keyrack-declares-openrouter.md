# S03 — the driver role's keyrack declares the openrouter key

kind: specifies a contract

## .said

> i set the key

> also, add that key as ppart of the drivers keyrack right

> instead of fireworks

> oh you need it in test? one sec

## .settled

- the human grants `OPENROUTER_API_KEY` under ehmpath, in env prep and env test
- the **driver** role ships its own keyrack, which declares `OPENROUTER_API_KEY` in env.prep. a
  driver's guards run peer reviews and the tally fallback, so a repo that enrolls only the driver
  still needs that key declared
- in every manifest, the openrouter key takes the place of the fireworks key

## .landed

- `.fulcrums/inventory.of=fulcrums.case=F2-openrouter-key-is-a-human-grant.md`
- `1.vision.yield.md` §after
