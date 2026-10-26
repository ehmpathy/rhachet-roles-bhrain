# F19 — the consumer patch suite calls the real npm registry

- **the fork:** `gen.consumer-patch` downloads a published tarball and checks its sha512 against the
  registry. (a) a local fake registry and tarball · (b) the real registry and the published 0.42.1
- **taken:** (b). the skill's whole job is to fetch the real published base and prove the patch
  applies to it. a fake registry would test the fake: the url shape, the integrity format, and the
  tarball layout are the registry's, and each has drifted before. the base is pinned to 0.42.1, an
  immutable published version, so the bytes do not move. a network fault fails loud, never green
- **against:** the suite needs the network and is slower (~50s); an npm outage reds it
- **rework:** clean — a local `verdaccio` or a file url, behind the same cases
- **confidence: 85%**
- **where:** `blackbox/gen.consumer-patch.acceptance.test.ts`
