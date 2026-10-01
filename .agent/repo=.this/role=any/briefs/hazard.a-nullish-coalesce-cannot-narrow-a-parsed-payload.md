# hazard: a nullish-coalesce cannot narrow a parsed payload

> **`JSON.parse` yields `any`. `??` rejects `null` and `undefined` and admits every other
> value — so `parsed.x ?? parsed.y ?? null` through a `string | null` signature is a type
> that lies.**

```ts
// 👎 the signature promises a string; the body cannot keep that promise
const read = (raw: string): string | null => {
  const parsed = JSON.parse(raw);
  return parsed.slug ?? parsed.serial ?? null;   // admits 42, {}, [], true, ''
};
```

## .why it survives review

it reads as a guard, and it is one — against exactly two values. so every reviewer who
asks *"is this value checked?"* gets a true yes, and moves on.

⇒ **the question that catches it is narrower: *what does this guard admit that its
declared type forbids?*** that is the gap `rule.require.shapefit` actually names, and a
`??` chain over a parse result is that gap by construction, every time — a shape to
grep for rather than a judgment to re-derive.

## .why the harm is worse than a wrong value

a narrow that is absent does not merely pass a bad value — it **walks past the loud
branch that exists to catch it**. measured here: a non-string clone address produced
`@:[object Object]`, which was then reported as a *confirmed* address, so the
`unreachable` halt never fired and the driver was told a switch was requested.

⇒ **an absent narrow converts a loud failure into a silent one**, which is the shape
`rule.forbid.failhide` forbids.

## .the boundary — not every parse owes a narrow

| owes a narrow | does not |
|---|---|
| another repo's cli, on its own release cadence | a file **this** repo wrote and reads back |
| an http response, an sdk payload | an internal contract between two of our own operations |
| a value a human hand-edits | a value a declared type already guarantees |

🔴 **this is the distinction that matters, and it is easy to get backwards.** the repo's
extant shape (`getGoalBlockerState.ts:17-20`) is a bare `??` with no narrow, and it is
**correct** — it reads what `setGoalBlockerState` wrote. to copy that shape to a
subprocess read is `rule.always.reuse-pavement-before-improvise` misapplied: the pavement
is real, and it is for a different road.

## .the repair — and put it in a transformer, not in the callback

a payload narrow is **translation**, and `define.domain-operation-grains` puts a
communicator at *"raw i/o boundary… minimal translation"*. so it belongs in an `as*`
transformer beside the communicator, never inline in the spawn or fetch callback.

⇒ reach for the grain rule as the reason, never testability. the transformer does
become unit-testable, and that is a consequence rather than the justification — a file
extracted *to* be tested invites a reviewer to ask which rule actually earned it.

```ts
// 👍 one narrow, one home, and the communicator keeps only its i/o
export const asCloneAddress = (input: { payload: unknown }): string | null => {
  if (typeof input.payload !== 'object' || input.payload === null) return null;
  ...
};
```

🟡 take `unknown` as the input, never a declared payload type. a type declared here
would assert a guarantee this repo cannot keep — which is the same lie one level up.

## .clamp the CLASS

`rule.require.clamp-edge-cases`: the arms are empty-string, non-string (number,
object, boolean, array), absent field, and non-object document — a bare `42` or
`null` is a valid JSON document, and a property read on it yields undefined rather than a
throw. ⇒ **a clamp on the one input that was tried leaves the rest open and looks
complete.**

## .see also

- `rule.require.shapefit` — the rule this hazard is one repeated instance of
- `rule.require.named-transformers` · `define.domain-operation-grains` — where the narrow lives
- `rule.require.clamp-edge-cases` — the arms above
- the worked example: `.behavior/v2026_09_09.feat-prescribed-brain-per-stone/review/self/for.5.1.execution.from_vision._.r8.role-standards-coverage.md` §3.5
