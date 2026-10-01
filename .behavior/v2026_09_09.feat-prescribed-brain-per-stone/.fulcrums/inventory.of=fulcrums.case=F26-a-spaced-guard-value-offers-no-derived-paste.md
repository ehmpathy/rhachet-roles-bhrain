# F26 — a spaced guard value offers no derived paste

**rework** = clean · **status** = open · **confidence** = 80%

## .the fork

for a `key-unreadable` value, `asGuardValueRepair` strips every refused character and, where the
remainder is a valid literal, offers it as a paste. a space takes a different arm:

| value | strip yields | what the driver reads |
|---|---|---|
| `gpt-4o@latest` | `gpt-4olatest` | `brain: gpt-4olatest` — the derived paste |
| `gpt 4o` | `gpt4o` | `brain: gpt` — the first word, with *"`/model` takes ONE argument, so pick the one you meant"* |
| `@@%%` | empty | the canned example |

## .taken, and why

**name the space as its own cause; offer the first word.**

- a strip across a space welds two tokens the driver typed on purpose into one no vocabulary holds —
  a fabricated-but-valid suggestion, the shape `rule.forbid.failhide` names
- `@`, `%` are typos inside one token; a space says two arguments where `/model` takes one

## .the counter-case

- the strip rule is uniform, and this arm breaks it without a word — `rule.forbid.surprises`
- `gpt4o` is what a driver who hit space for hyphen meant; the taken arm is wrong for that class, the
  rejected arm wrong for `claude opus` → `claudeopus`
- the refusal already prints `U+0020 (a space)` beside any paste, so a driver is not deceived

## .rework

clean — `asGuardValueRepair` returns `spaced` beside `repaired`, so a reversal is one branch flip in
`formatGuardParseWarnings.ts` plus one row in its test `[case6]`. no contract, no snapshot.

## .the verdict

open.
