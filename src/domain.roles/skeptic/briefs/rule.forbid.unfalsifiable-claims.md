# rule.forbid.unfalsifiable-claims

> **no claim about the world is offered that no outcome could refute.**

razors: `razor=popper` · `razor=alder` · `razor=duhem-quine`.

## .the shape

| 👎 | 👍 |
|---|---|
| "the new design will be more robust" | "the new design survives a broker restart; test: kill the broker mid-write" |
| "if it fails, the env was flaky; if it passes, the fix worked" | "the fix works if 50 runs pass; one fail refutes it" |
| "it should help in some cases" | "it cuts p95 latency on cold starts; measure: p95 before and after" |

## .the test

> **what outcome would show this claim wrong? is it named?**

none → it says naught a reader can check.

## .enforcement

blocker: a claim used to justify work, with no outcome that would refute it
nitpick: a claim hedged until no outcome can touch it
false positive: a definition, or a claim marked `guess:` with its refuter named later
