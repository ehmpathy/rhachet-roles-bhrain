# self-review: has-questioned-assumptions

## reviewed artifact

`.behavior/v2026_04_02.feat-achiever/3.3.1.blueprint.product.v1.i1.md`

---

## technical assumptions found

### assumption 1: file-based persistence is sufficient

**what we assume:** goals can be persisted as YAML files, asks as JSONL.

**what if opposite?** if we needed a database (SQL, KV store), the design would change.

**evidence:** the wish says "persist goals" and ".goals/ dir" — explicitly file-based.

**verdict:** holds. the wish prescribes file-based persistence.

### assumption 2: content hash is stable for ask dedup

**what we assume:** sha256(content) is deterministic and stable.

**what if opposite?** if content has variable parts (timestamps, random IDs), hash would differ.

**evidence:** asks are raw peer input. content should not have variable parts.

**verdict:** holds. peer input content is stable.

### assumption 3: JSONL append is safe for concurrent writes

**what we assume:** appends to asks.inventory.jsonl and asks.coverage.jsonl are atomic.

**what if opposite?** concurrent hook invocations could corrupt the file.

**evidence:** hooks are single-threaded per session. no concurrent writes within a session.

**simpler approach?** could use separate files per ask. but JSONL is simpler and works for single-writer.

**verdict:** holds. single-threaded sessions mean no concurrent writes.

### assumption 4: offset from mtime is unique

**what we assume:** seconds offset from parent dir mtime gives unique prefix for goals.

**what if opposite?** if two goals created in same second, offset would collide.

**evidence:** vision shows 7-digit offset (supports weeks). collision would need sub-second creation.

**simpler approach?** could use UUID prefix. but offset preserves temporal order and is human-readable.

**verdict:** acceptable risk. sub-second collision is unlikely. if it occurs, slug uniqueness handles it.

### assumption 5: DomainLiteral is correct base class

**what we assume:** Goal, Ask, Coverage extend DomainLiteral not DomainEntity.

**what if opposite?** if goals had mutable identity, DomainEntity would be needed.

**evidence:** goals are identified by slug (immutable). no identity lifecycle beyond create/update.

**verdict:** holds. DomainLiteral is correct — goals are value objects with identity by all fields.

### assumption 6: nested schema is necessary

**what we assume:** Goal schema must have nested why/what/how structure.

**what if opposite?** a flat schema (ask, purpose, benefit, outcome, task, gate) would be simpler.

**evidence:** the wish says "shape of a goal has ask, task, gate, root" — flat list. the vision evolved this to nested why/what/how for clarity.

**verdict:** holds. nested structure groups related concerns and matches vision.

---

## counterexamples considered

| assumption | counterexample | impact |
|------------|----------------|--------|
| file-based | distributed system needs db | not in scope — wish is file-based |
| content hash | user edits and re-sends | still different content, different hash |
| JSONL append | parallel sessions | not in scope — sessions are single-threaded |
| mtime offset | rapid goal creation | slug uniqueness handles collision |

---

## conclusion

**all assumptions hold.**

six technical assumptions were surfaced and questioned:
1. file-based persistence — wish prescribes it
2. content hash stability — peer input is stable
3. JSONL append safety — single-threaded sessions
4. mtime offset uniqueness — acceptable risk, slug handles collision
5. DomainLiteral base — goals are value objects
6. nested schema — matches vision

no changes needed to the blueprint.

---

## re-reviewed 2026-04-07

i pause. i question my prior analysis.

### additional assumption surfaced: scope auto-detection

**what we assume:** scope (route vs repo) can be auto-detected.

**evidence:** playtest shows `--scope route` auto-detected when bound. this is tested in manual.1.

**what if opposite?** if detection fails, brain must always specify scope.

**verdict:** holds. the implementation auto-detects based on route.bind state. explicit `--scope` overrides.

---

### re-examination: DomainLiteral vs DomainEntity

**deeper question:** do goals have identity lifecycle?

**analysis:**
- goals are created, updated (status changes), never deleted
- identity is by slug (immutable)
- DomainEntity tracks `.unique` keys — but goals use slug directly

**verdict:** DomainLiteral is correct. goals are identified by slug content, not by database ID.

---

## final verdict

all 7 assumptions (original 6 + scope auto-detection) hold.

no changes needed to the blueprint.

