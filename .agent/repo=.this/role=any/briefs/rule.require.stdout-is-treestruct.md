# rule.require.stdout-is-treestruct

> **every stdout a human reads is a vibe line, then a tree. every fact is a leaf; no fact is a paragraph.**

```
🦉 where were we?                   # the vibe — the owl, one line
                                    # a blank
🗿 route.drive                      # the root — the role marker + the surface
   ├─ where do we go?               # a branch
   │  └─ stone = 3.plan             # a leaf — one fact
   │
   └─ ✋ halted, brain switch could not land
      ├─ fix: rhx enroll …          # a label leaf; its paste hangs beneath
      │  └─ rhx enroll claude --roles driver
      └─ or: remove `brain:` from 3.plan.guard
```

## .the shapes this forbids

| shape | 👎 as shipped | 👍 |
|---|---|---|
| flat-leaf — prose under a root, no glyph | `🗿 guard: …` then `   at: 1.guard:12` | `   ├─ at: 1.guard:12` |
| the note after a blank — prose hung beneath a `└─` | `   └─ as a driver…` · blank · `      the human will run …` | a `   │` spacer, then `   └─ the human will run …` |
| rootless-leaf — a base-indent line after the tree shut | `🦉 patience` then `   the stone prescribes = opus` | put the fact inside the tree |
| two facts on one line — `at X, fix Y` | one leaf per fact |

🟡 **a blank line never parts a tree.** a `   │` spacer does. a blank inside a tree is where prose hides, and the check reads through it.

## .why

- a tree is scannable: a reader descends only the branch they want
- one fact per leaf makes each fact greppable and each snapshot diff one line wide
- ⇒ each surface that hand-rolled its own layout drifted into prose, and no check caught it until a human read the snapshot

## .enforcement — mechanical, never a memory

- `getStdoutFormDefects` (pure) grades a text
- `getStdoutFormDefects.integration.test.ts` walks every `.snap` in `src/` and `blackbox/` through it
- a surface that renders prose where a tree was owed turns the suite red the moment it is snapped

⇒ so a new surface owes a snapshot, and the snapshot owes the form. an unsnapped surface escapes the check — that gap is `rule.require.snapshots` (mechanic), not this rule's.

## .what it does not grade

- text with no tree root at all — a prompt, a json body, a stone's markdown
- the **voice**: the vibe phrase and the mascot belong to `define.bhrain-repo-mascot`

blocker: a snapshot the sweep flags · a surface that renders a fact as prose under a root · a blank line used to part two branches.

⇒ see also: `define.bhrain-repo-mascot` · `rule.forbid.duplicate-format-tree-operations` · `rule.require.treestruct-output` (ergonomist) · `.behavior/v2026_09_09.feat-prescribed-brain-per-stone/.seeds/inventory.of=seeds.case=S13-every-stdout-is-mascot-and-treestruct.md`.
