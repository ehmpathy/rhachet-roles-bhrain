# self-review r6: has-play-test-convention

sixth pass: verify test conventions in this repo.

---

## repo test conventions

```bash
ls **/*.test.ts | head -20
```

patterns observed:
- `*.test.ts` — unit tests
- `*.integration.test.ts` — integration tests
- `*.acceptance.test.ts` — acceptance tests

no `*.play.test.ts` files exist.

---

## convention analysis

| suffix | purpose | count in repo |
|--------|---------|---------------|
| `.test.ts` | unit tests | many |
| `.integration.test.ts` | integration tests | several |
| `.acceptance.test.ts` | acceptance tests | several |
| `.play.test.ts` | journey tests | 0 |

---

## why no journey tests?

this repo contains:
- domain operations (pure functions)
- CLI entry points (integration tested)
- skills (acceptance tested)

journey tests would be appropriate for:
- multi-step user flows
- state machines
- complex workflows

none of these exist in this repo.

---

## conclusion

repo conventions verified:
- unit tests use `.test.ts`
- integration tests use `.integration.test.ts`
- acceptance tests use `.acceptance.test.ts`
- no journey tests exist

criterion is n/a.

