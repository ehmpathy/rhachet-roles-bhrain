# fulcrum F3: migrate the retired cache wrapper

## .the fork
- migrate `genStitchStreamToDisk.ts` from `with-simple-caching` to `with-simple-cache@0.17.3`, per the practice's `@declapract:review` marker
- or pin `simple-in-memory-cache` back to 0.4.0, which the old wrapper's types still fit

## .taken
migrate. the marker names it, the api is the same shape (`withSimpleCache(fn, { cache: createCache() })`), and 0.17.3 is the version rhachet already pulls in. the old wrapper is removed; it had no other user

## .rework
clean: one file, two deps

## .confidence
90%. types pass; the call site is a log-once guard with no async cache
