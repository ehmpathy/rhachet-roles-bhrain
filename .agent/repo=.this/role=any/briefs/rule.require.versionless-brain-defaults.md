# rule.require.versionless-brain-defaults

> **a DEFAULT brain slug names a tier, never a version: `$provider/$family/$tier`.
> a version belongs only to a call that chose it on purpose, never to the constant.**

```ts
👎  export const DEFAULT_BRAIN = 'openrouter/deepseek/flash/v4.1'; // strands on retirement
👍  export const DEFAULT_BRAIN = 'openrouter/deepseek/flash';      // a tier, no version at all
```

an openrouter **tier** slug is versionless by construction: the package picks the newest live
model on the tier's line at ask time, and registers the tier slug itself. so the choice passes
straight to `genContextBrain`, with no map and no pin between them. the mark of a versionless
slug is **no version number in it**, which is what `reviewDefaultBrains.test.ts` asserts, beside
the assertion that the package registers the slug as is.

## .why — a pinned default is a date on which every lane breaks at once

- a default is read by every caller that did not choose. a version in it retires on the
  provider's clock, never ours
- a tier slug moves to the successor model on its own; the brains package owns that move
- a versionless default upgrades with a `package.json` bump; a pinned one needs a hunt
  across every constant, test, and fixture that copied it

measured 2026-09-26: a brains package bump renamed `deepseek/v4-flash` to
`deepseek/flash/v4.1`. eleven integration suites pinned the old slug, and every one failed at
setup with `BrainChoiceNotFoundError` before one assertion ran.

| when… | then… |
|---|---|
| you declare a default brain constant | a tier slug the package registers. no version |
| you call `genContextBrain` with a caller's choice | pass the choice as is; a lookup fault names the slug (`asBrainLookupFault`) |
| you want a byte-stable brain for a measurement | pin it at THAT call — a measurement is not a default |
| a test pins a brain it merely needs to run | use `DEFAULT_TEST_BRAIN` — it is versionless too |

blocker: a default brain constant that names a version · a default the brains package does not
register as is.
false positive: a pin chosen deliberately for byte-stable measurement, with the reason stated
beside it · a string fixture that is only a label (a footer, a rendered header).

see also: `reviewDefaultBrains.test.ts` (the clamp: every default is versionless and
registered) · `asBrainLookupFault` (the one render of an unregistered slug).
