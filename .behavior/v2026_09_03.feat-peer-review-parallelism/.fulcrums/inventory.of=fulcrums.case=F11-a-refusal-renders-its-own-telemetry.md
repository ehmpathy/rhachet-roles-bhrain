# fulcrum F11 — a refusal renders its own telemetry, and this feature leaves it that way

- **case** = F11
- **title** = a refusal renders its own telemetry, and this feature leaves it that way
- **rework** = **clean**
- **status** = OPEN — deferred, dream caught. 🔴 **the MECHANISM is now known — see below**
- **confidence** = **94%** — unchanged. the discovery cheapens the fix and settles no call
- **raised** = 2026-09-10, at i001 r009 (`ergo-friction-hazards`, nitpick.1)

## .the fork, stated fairly

the two concurrency refusals this feature adds print an actionable message and then, under a blank
line, the error's structured metadata as json:

```
error: BadRequestError: reviewer names a concurrency group with no bound declared: anthropic. declare it under reviews.groups, or remove the `group:` key.

{
  "undeclared": [
    "anthropic"
  ],
  "declared": []
}
```

| the option | what it costs |
|---|---|
| **A — repair the render here** | the surface is repo-wide, so it re-baselines four snapshot files this diff never opened |
| **B — leave it, catch a dream** | the two new refusals ship with a render a reviewer graded noisy |
| **C — special-case the two new refusals** | 🔴 two error renders in one repo, parted by which feature raised them |

## 🔴 .the mechanism, found 2026-09-12 — and A's cost was priced against an ABSENT one

`asGuardPositiveInt.test.ts` was written at i005, and to assert the refusal's structured record it had
to learn where `HelpfulError` keeps it. **that read turned up the repair A needs, already shipped:**

```
node_modules/helpful-errors/dist/HelpfulError.d.ts:68
  redact(parts: Array<'metadata' | 'cause'>): this;
  // const redacted = original.redact(['metadata']);  // only 'payment failed' and cause
```

| what it does | verified |
|---|---|
| returns a **clone** with metadata stripped from the message | `HelpfulError.test.js:162, :172-177` — `not.toBe(original)`, message `'payment failed'`, no `cardNumber` |
| **keeps the cause** | `:180-193` — `redacted.cause` is the root cause, still an `Error` |
| leaves `.original` intact on the source | `:77-80` — the machine-readable pair survives for a log |

⇒ 🔴 **so A is one `.redact(['metadata'])` at the cli error printer**, never a re-derivation of the
render. and it is the *right* shape rather than a trick: the human reads the redacted message, the log
reads `error.original.metadata` — **two consumers, two renders, one error object.**

### ⚠️ what this changes, and what it does NOT

| | |
|---|---|
| **changed** | A's implementation cost, from *"re-derive an error render"* to **one call at one boundary** |
| 🔴 **unchanged** | the reason for the defer. **the four untouched snapshot files still move**, and that is what failed CLEAN — never the difficulty of the code |
| 🔴 **unchanged** | the confidence. **94%**, and the 6% is still *where a surface's authorship sits*, which is the wisher's call |

⇒ **this is the F14 pattern met a second time in one round, and it came out the other way.** F14's
defer was priced against a diff that had since changed, so the re-price flipped it. **F11's defer was
priced against the SNAPSHOTS, and a cheaper implementation does not move a snapshot count.**

🟡 **worth the note precisely because the two look alike:** *"a mechanism you did not know about
exists"* cheapens a fix and only reverses a defer when the **cost that failed CLEAN** was the
implementation. here it was the blast radius.

## .taken, and why at the time

**B.** the render is not this feature's — it is what every command in the repo already writes, and
the four other snapshots that carry it are on `main` today.

⇒ **C was refused outright.** to make these two refusals render differently from every other refusal
in the repo would trade one ergonomics defect for an inconsistency, which is the worse of the two
(`rule.forbid.ambiguous-labels`: *"same word, same action, everywhere"*).

## .rework, and why it is CLEAN

one branch at one boundary — the cli error printer. no caller hardens against the current render, and
no artifact on disk depends on it except the five snapshots, which are re-cut by a `--resnap`.

⇒ **clean, and yet deferred.** that pair is the whole reason this row exists: cleanliness of the
*rework* is not the same question as cleanliness of the *fix in this diff*, and it is the second
question `rule.always.fix-forward-under-scouts-honor` asks. the fix here is **not** clean — it moves
four untouched snapshot files — so it defers even though its later undo would be cheap.

## .confidence, and why it is not higher

**94%.** the 6%: a wisher who reads the refusal render as *this feature's* output rather than as the
repo's would want it repaired in the round that surfaced it. that is a defensible read — the
snapshot the reviewer quoted **is** a file this branch adds — and it turns on where a surface's
authorship is judged to sit, which is a call the wisher owns.

## .where

- `blackbox/__snapshots__/driver.route.peer-concurrency-refusals.acceptance.test.ts.snap` — the two new refusals
- `blackbox/__snapshots__/driver.route.set.acceptance.test.ts.snap` — the same shape, on `main`
- `.dream/v2026_09_10.fix.every-cli-error-appends-a-raw-json-context-dump.md` — the caught fix
- 🔴 `node_modules/helpful-errors/dist/HelpfulError.d.ts:57-68` — `redact`, the mechanism A needs
- 🔴 `src/domain.operations/route/guard/asGuardPositiveInt.test.ts` `[case7]` — where it was found, and
  the one test that asserts the structured record survives a redacted message

## .what would overturn it

a wisher who rules that a refusal's metadata belongs off the human surface **and** that the sweep
rides this round rather than its own. that is one sentence from them and a `--resnap`; it needs no
new measurement and no discovery, which is why this row's confidence is high and its rework cheap.

🔴 **and the sweep is now cheaper than this row first priced it** — `.redact(['metadata'])` at the cli
error printer, plus the `--resnap`. ⚠️ **the snapshot count is the same**, so a wisher who defers on
blast radius should defer exactly as before; only a wisher who deferred on effort should re-read.

## .the verdict, once ruled

— unruled.
