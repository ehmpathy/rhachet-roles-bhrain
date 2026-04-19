# self-review r6: has-pruned-backcompat

tea first. then we proceed 🍵

---

## fresh eyes: what is backwards-compat in this context?

backwards-compat means: extant users who run `--as rewound` should not be surprised.

specifically:
1. commands without new flags should behave as before
2. no data format changes that break extant routes
3. no behavior changes that affect extant workflows

---

## why this feature is purely additive

the feature adds:
- `--yield drop|keep` flag (new)
- `--hard` boolean flag (new)
- `--soft` boolean flag (new)

the feature changes:
- **none** — all extant behavior preserved

### proof of additive nature

| extant command | behavior before | behavior after |
|----------------|-----------------|----------------|
| `--as rewound` | yields preserved | yields preserved (default = keep) |
| `--as rewound --yield ???` | n/a (flag didn't exist) | depends on flag value |

the only backcompat concern is the default. and the default is `keep` which matches "before".

---

## why default = keep is the right default

**evidence from wish:**
- line 5: "soft should just do the current rewind"
- "current rewind" = extant behavior = yields preserved

**principle:** least surprise — destructive behavior should be opt-in, not default

**test:** if we defaulted to `drop`, what would happen?
- extant scripts would suddenly delete yields
- extant users would lose artifacts
- this would be a backwards-incompat change

**conclusion:** default = keep is required, not "to be safe"

---

## why `--soft` is not unnecessary backcompat

one could argue: if `keep` is the default, why have `--soft` at all?

**answer:** `--soft` is not backcompat — it's explicit intent.

| command | intent |
|---------|--------|
| `--as rewound` | "rewind, I don't care about yields" |
| `--as rewound --soft` | "rewind, explicitly preserve yields" |
| `--as rewound --hard` | "rewind, explicitly archive yields" |

`--soft` makes the choice conscious. it's not backcompat — it's clarity.

---

## why no migration code is needed

**schema unchanged:** passage.jsonl format is identical
- before: `{"stone": "...", "status": "rewound"}`
- after: `{"stone": "...", "status": "rewound"}`

the yield archive is a side effect, not a schema change.

**no migration needed** because:
1. feature only affects *future* rewinds
2. extant rewinds have no yield info to migrate
3. `.route/.archive/` is created on demand

---

## open questions for wisher

**none identified.**

all backcompat concerns trace to explicit requirements:
- default = keep → wish line 5
- `--soft` alias → wish line 3
- no migration → feature is additive

---

## conclusion

the feature is purely additive. no backcompat code was added "to be safe."

| concern | status |
|---------|--------|
| default = keep | explicit per wish |
| `--soft` alias | explicit per wish |
| migration | not needed (additive) |
| schema change | none |

zero unnecessary backcompat. zero hidden assumptions.

🦉 backcompat verified clean. so it is.

