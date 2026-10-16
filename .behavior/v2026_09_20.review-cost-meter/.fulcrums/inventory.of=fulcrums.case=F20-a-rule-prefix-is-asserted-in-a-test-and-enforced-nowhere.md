# F20 — a `rule.` prefix is asserted in a test and enforced nowhere

- rework = 🔴 **dirty**
- status = OPEN — best-guessed *defer, catch a dream*
- confidence = 🔴 **60%**

## .the fork, stated fairly

a full local integration run surfaced `stepReflect.caseTypescriptQuality` failed on **1 of 3
attempts**, at:

```ts
expect(pureFiles.some((f) => f.startsWith('rule.'))).toBe(true);
```

and the schema that governs those filenames constrains them **not at all**:

```ts
rules: z.array(z.object({ name: z.string(), content: z.string() }))
```

⇒ so the fork is: **is the `rule.` prefix a CONTRACT this repo enforces, or a HABIT the prompt
steers?** the test says contract. the code says habit. they cannot both be right, and today
neither is written down.

| the fork | what it costs |
|---|---|
| **A — a contract.** tighten to `z.string().regex(/^rule\./)` | a brain that names one file badly now **throws** where it used to write. correct for a contract, and a real behavior change in `reflect/` |
| **B — a habit.** drop the prefix assertion, keep `pureFiles.length > 0` | the suite stops to flake, and the repo's own `rules101.structure` grammar loses its only check |
| 🟡 **C — repair at the write.** keep `z.string()`; prefix, or quarantine and count | the convention holds with no hard refusal, and it **yields the measurement A needs** |

## .taken, and why at the time

**deferred**, with a dream that specifies all three options and names C as the likely first move.

the reason at the time is the SAFE/CLEAN test, and both legs fail:

- **SAFE? no.** every option changes production behavior in `src/domain.operations/reflect/` — a
  domain this branch touches in **zero** files. verified rather than assumed:
  `git diff origin/main --stat -- 'src/domain.operations/reflect'` returns **empty**
- **CLEAN? no.** A throws where today it writes; C changes what lands on disk. both ripple into
  `executeManifestOperations` and the step-2 prompt, which reads `pureDir` back

## .rework, and why

🔴 **dirty.** this is the one grade I would most like to be wrong about, and it is why the row
exists. the *edit* is small — one zod line, or one branch at the write. the **ripple** is not: the
step-2 prompt is re-compiled from what step 1 put on disk, so a change to which files land there
changes a prompt, which changes a brain's answer, which changes the manifest step 2 executes.

⇒ **a small diff with a long blast radius is exactly the case a fulcrum exists to surface**, since
the diff size is what a reviewer sees and the radius is what they do not.

## .confidence, and why it is low — 🔴 60%

three distinct soft spots, and the last is the one that would flip the grade:

1. **the ripple estimate is unmeasured.** I read the call chain; I did not run C and watch what
   step 2 does differently. the dirty grade rests on a read
2. **the frequency is unmeasured.** one miss in three attempts, in one run. that could be a 33%
   rate or a one-off — and the two imply different fixes (33% argues C loudly; a one-off argues B)
3. 🔴 **I did not check whether a downstream reader PARSES the `rule.` prefix.** if step 2 or
   `executeManifestOperations` keys off it, the prefix is already a contract in fact and option B
   is off the table — which would make this a much easier call and a much more urgent one

⇒ point 3 is a ten-minute read I chose not to take, because the deferral holds either way. **that
is a reason to defer, and not a reason to be confident** — a call whose evidence you declined to
gather is a call at 60%, however clean the argument above it.

## .where

- `src/domain.operations/reflect/stepReflect.ts:25-32` — the unconstrained schema
- `src/domain.operations/reflect/stepReflect.ts:253-258` — the write, under the brain's name
- `src/domain.operations/reflect/stepReflect.caseTypescriptQuality.integration.test.ts:65` — the
  assertion that grades it
- `.dream/v2026_09_23.fix.stepreflect-asserts-a-rule-prefix-its-schema-does-not-enforce.md`

## .the verdict, once ruled

_unruled._

## .see also

- **R12**, `5.3.verification.yield.md` — the same discriminator, one domain over: *"is this figure
  the code's contract, or the brain's output?"*. F20 exists because R12's question was asked of
  `review.by.guard-peer` and had never been asked of `reflect`
- `rules101.structure` — the `rule.$directive.$topic.md` grammar this prefix belongs to
