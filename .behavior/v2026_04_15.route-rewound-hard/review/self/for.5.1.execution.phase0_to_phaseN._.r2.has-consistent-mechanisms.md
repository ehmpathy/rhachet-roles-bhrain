# self-review: has-consistent-mechanisms (r2)

## question: do new mechanisms duplicate extant functionality?

### mechanisms examined

#### 1. archiveStoneYield vs delStoneGuardArtifacts

| aspect | archiveStoneYield (new) | delStoneGuardArtifacts (extant) |
|--------|-------------------------|--------------------------------|
| action | moves to `.route/.archive/` | deletes via `fs.rm` |
| target | yield files (`*.yield*`) | guard artifacts (review, judge, promise) |
| recoverable | yes | no |

**why different mechanics?**
- guard artifacts are validation state - ephemeral, transient
- yield files are work products - represent effort, may want recovery

**is this inconsistent?**
no. the semantics differ:
- validation state can be regenerated (re-run review)
- work products cannot be regenerated (represent prior effort)

**is this duplication?**
no. `delStoneGuardArtifacts` deletes. `archiveStoneYield` archives. different operations for different purposes.

#### 2. glob pattern for yield files

the glob `${stone}.yield*` matches all yield variations:
- `1.vision.yield.md`
- `1.vision.yield.json`
- `1.vision.yield.draft.md`

**is there an extant enum pattern?**
yes, I used `enumFilesFromGlob` which is the standard file enumeration utility in this codebase.

**verdict**: reused extant utility, no duplication.

#### 3. archive directory pattern

I created `.route/.archive/` as the archive destination.

**is there an extant archive pattern?**
no. this is a new pattern. guard artifacts are deleted, not archived.

**why introduce a new pattern?**
the wish said "remove" which could mean delete or archive. archive is safer:
- preserves history
- allows recovery
- aligns with "remove" semantics (gone from view, not destroyed)

**verdict**: new pattern, but intentional and justified.

### conclusion

no duplication of extant mechanisms. the differences between `archiveStoneYield` and `delStoneGuardArtifacts` are intentional - different semantics for different artifact types. the archive pattern is new but serves a distinct purpose (recoverable removal vs permanent deletion).
