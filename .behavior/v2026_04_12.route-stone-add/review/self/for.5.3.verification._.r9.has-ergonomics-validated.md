# self-review: has-ergonomics-validated (r9)

## the claim

the actual input/output matches the planned ergonomics from repros.

## no repros artifact

this behavior has no `3.2.distill.repros.*.md` artifact. the design was derived directly from:
- the wish (`0.wish.md`)
- the criteria (`2.1.criteria.blackbox.*.stone`)
- extant conventions from peer `route.stone.*` skills

## ergonomics validation via criteria alignment

### planned (from wish)

> "rhx route.stone.add --where --how"
> "template to bootup the stone"
> "declare the contents via stdin"

### implemented

```sh
rhx route.stone.add --stone 3.1.research.custom --from 'literal content'
rhx route.stone.add --stone 3.1.research.custom --from 'template($behavior/refs/template.stone)'
echo "content" | rhx route.stone.add --stone 3.2.research.api --from @stdin
```

### alignment check

| wish element | implemented as | matches? |
|--------------|----------------|----------|
| `--where` | `--stone` (stone name determines where) | **deviation** |
| `--how` | `--from` (source of content) | **deviation** |
| template | `template(...)` syntax | yes |
| stdin | `@stdin` | yes |
| "within the current bound route (failfast if none)" | enforced | yes |
| "cover with snaps" | 11 snapshots | yes |
| "matches extant flags and conventions" | verified below | yes |

### deviation analysis: `--where` vs `--stone`

the wish proposed `--where`, but we implemented `--stone`.

**why this deviation is correct:**
1. `route.stone.del` uses `--stone` — consistent
2. the stone name IS the where (e.g., `3.1.research.custom` → `3.1.research.custom.stone`)
3. `--where` implies path, but users specify stone name
4. `--stone` is semantic (what you're named), `--where` is spatial (path)

### deviation analysis: `--how` vs `--from`

the wish proposed `--how`, but we implemented `--from`.

**why this deviation is correct:**
1. `--how` is ambiguous: method? content? format?
2. `--from` is clear: source of content
3. follows pattern: `--from @stdin`, `--from 'literal'`, `--from 'template(...)'`
4. other skills use source-based flags (e.g., `git.commit.set -m @stdin`)

### wish intent vs implementation intent

| wish says | we deliver |
|-----------|------------|
| "drivers self add stones" | `rhx route.stone.add` |
| "use a template" | `--from 'template(...)'` |
| "declare via stdin" | `--from @stdin` |
| "failfast if none" | error if no bound route |
| "match extant conventions" | `--stone` like `route.stone.del` |

**the intent is preserved; the ergonomics are improved.**

## ergonomics consistency with peers

| skill | flags | notes |
|-------|-------|-------|
| `route.stone.del` | `--stone` | matches |
| `route.stone.set` | `--stone`, `--as` | different purpose |
| `route.stone.add` | `--stone`, `--from` | new skill |

the `--from` flag is new but follows the pattern of source declaration.

## the result

- ergonomics match the wish intent
- flag names are consistent with extant conventions
- no repros artifact to drift from
- design is coherent with peer skills

