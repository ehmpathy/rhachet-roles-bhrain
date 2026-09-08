# seed S12 — the overflow is the conversation, never the paths

## .said — verbatim, 2026-09-07

> why did they run out fo context?

> what possibly has grown that much?
> didnt we scope it all to just {src, blackbox} already?

## .settled

**a review lane's context is spent on two payloads, and the scope block itemizes only one.**

| payload | in the scope block? |
|---|---|
| `--rules` + `--diffs` ∩ `--paths-with` targets | ✅ yes, per-file, in `tokens.expected.md` |
| 🔴 `--conversation $conversation` | ⛔ **no line at all** |

so a driver who reads the scope block, sees a bounded target set, and concludes the lane is bounded
has read **two thirds of the bill**.

**measured, `.log/bhrain/review/2026-09-07T17-04-30-991Z/`:**

```
rules:    20 files                       12.3k
targets:  since-main 394 → intersect → 175   676.5k
          └─ src/       452.0k (65.6%)
          └─ blackbox/  224.5k (32.6%)
          └─ .agent/     12.3k  (1.8%)
tokens.expected.md total                 688.8k = 68.9%
the check reported                              105.5%
```

⇒ **~366k tokens — roughly 35% of the window — appear in no line of the scope block.** the accounted
tree holds `src`, `blackbox`, `.agent` and no fourth entry, so the residue is the conversation
payload.

## 🔴 .why it matters — the conversation grows monotonically and the paths do not

`{src,blackbox}` **held**. it is not the defect, and to narrow it further buys little.

the conversation is the union of every given, every taken, and every `.report.md` detail across every
prior round. it therefore **grows on every round, and the rounds spent to answer it are no exception**:

> a `.taken` written to discharge a debt is itself appended to the conversation the next round must
> carry.

⇒ that is the loop. **the artifact that answers a reviewer is the artifact that blinds the next one.**

## ⚠️ .what this corrected

the driver had filed the overflow as **F11 — the wisher's call**, on the belief that the target scope
was already as tight as a driver could make it. the belief was true and the conclusion did not follow:
the tight half was never the expensive half.

⚠️ **the ergonomic defect is the silence, not the size.** a lane that reports `105.5%` against a scope
block whose total is `68.9%` gives the reader no thread to pull — the same class as the `0 failed`
exit-2 already caught in
`.dream/v2026_09_04.fix.a-stray-snap-in-a-gitignored-dir-fails-the-unit-gate.md`. **a bill with an
unlabelled third of its total is a bill the payer cannot audit.**

## .landed

- the diagnosis, which unblocked S13 (the guard is the driver's own lever)
- ⏳ a bound or drop on `--conversation` in `5.3.verification.guard` — owed
- ⏳ a dream on the unitemized payload in the scope block — owed
