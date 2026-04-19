# self-review r5: has-pruned-backcompat

tea first. then we proceed 🍵

---

## what this review checks

identify backwards-compat concerns in the blueprint. question each one.

---

## backwards-compat concern #1: default is `keep` (soft)

**the concern:** if no yield flag is provided, behavior matches current (yields preserved)

**was this explicitly requested?**
- wish line 5: "soft should just do the current rewind"
- wish implies current behavior is the baseline

**evidence this is needed?**
- extant users of `--as rewound` expect current behavior
- sudden yield deletion would be destructive surprise

**verdict:** ✅ this is explicit per wish — keep

---

## backwards-compat concern #2: `--soft` alias mirrors `--yield keep`

**the concern:** `--soft` is an alias so old muscle memory (think in hard/soft) works

**was this explicitly requested?**
- wish line 3: "--mode hard | soft"
- wish uses "soft" terminology

**evidence this is needed?**
- wish terminology uses soft
- alias lets users think in wish terms

**verdict:** ✅ this is explicit per wish — keep

---

## backwards-compat concern #3: extant rewound stones remain valid

**the concern:** stones rewound before this feature still work

**was this explicitly requested?** not explicitly, but implicit in "additive feature"

**evidence this is needed?**
- feature adds new flags, doesn't change schema
- passage.jsonl format unchanged
- no migration needed

**verdict:** ✅ no actual backcompat code — feature is purely additive

---

## hidden backcompat scan

searched blueprint for backcompat patterns:

| pattern | found? | needed? |
|---------|--------|---------|
| version check | no | no — feature is additive |
| migration | no | no — no schema change |
| deprecated alias | no | no — no old API to deprecate |
| fallback behavior | no | no — default handles extant usage |
| feature flag | no | no — feature is always available |

**result:** no hidden backcompat code. feature is purely additive.

---

## the "to be safe" scan

did we add backcompat "to be safe" without evidence?

| item | "to be safe"? | evidence? |
|------|---------------|-----------|
| default = keep | no | wish explicit |
| `--soft` alias | no | wish explicit |
| no migration | n/a | schema unchanged |

**result:** no "to be safe" backcompat. all traced to requirements.

---

## open questions for wisher

**none.** all backcompat concerns are either:
1. explicitly requested per wish
2. n/a because feature is additive

---

## conclusion

backcompat review complete:

| concern | explicitly requested? | action |
|---------|----------------------|--------|
| default = keep | yes (wish line 5) | keep |
| `--soft` alias | yes (wish line 3) | keep |
| extant stones | n/a (additive) | no action |

zero unnecessary backcompat. zero open questions for wisher.

🦉 backwards compat reviewed. all explicit. so it is.

