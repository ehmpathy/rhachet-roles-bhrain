# self-review r3: has-questioned-assumptions

tea first. then we proceed 🍵

---

## what this review checks

surface all technical assumptions in the blueprint. question each one.

---

## assumption #1: archive location `.route/.archive/`

**the assumption:** yields should archive to `.route/.archive/`

**what if the opposite were true?**
- archive to route root? → pollutes work directory
- archive to home dir? → not portable, lose context
- archive to `.archive/` without `.route/`? → different convention

**evidence:**
- delStoneGuardArtifacts archives to `.route/.archive/`
- `.route/` is the standard location for route metadata
- pattern is established in codebase

**verdict:** ✅ assumption holds — follows extant pattern

---

## assumption #2: archive instead of delete

**the assumption:** yields should be archived, not deleted

**what if the opposite were true?**
- delete saves disk space
- no collision logic needed
- simpler implementation

**evidence:**
- wish says "remove" but criteria says "archive"
- archive enables recovery if rewind was premature
- delStoneGuardArtifacts uses archive pattern

**verdict:** ✅ assumption holds — safer, recoverable

---

## assumption #3: timestamp suffix for collision

**the assumption:** collision uses ISO timestamp suffix

**what if the opposite were true?**
- numeric suffix (1, 2, 3)? → requires scan of extant files
- uuid suffix? → not human-readable
- overwrite? → loses history

**evidence:**
- ISO timestamp is sortable, human-readable
- no need to scan for next number
- delStoneGuardArtifacts uses timestamp pattern

**verdict:** ✅ assumption holds — follows extant pattern

---

## assumption #4: `fs.rename` for archive move

**the assumption:** use `fs.rename` to move file to archive

**what if the opposite were true?**
- copy + delete? → not atomic, leaves orphan on failure
- symlink? → not a real archive

**evidence:**
- `fs.rename` is atomic on same filesystem
- route and `.route/.archive/` are same filesystem
- pattern works for delStoneGuardArtifacts

**verdict:** ✅ assumption holds — atomic operation

---

## assumption #5: default is `keep` (soft)

**the assumption:** if no flag provided, yield is preserved

**what if the opposite were true?**
- default to `drop`? → destructive default, violates least surprise
- require explicit flag? → breaks backwards compat

**evidence:**
- wish says "soft should just do the current rewind"
- "current rewind" preserves yields
- backwards compat: old commands should not suddenly delete yields

**verdict:** ✅ assumption holds — safe default

---

## assumption #6: cascade applies to yield archival

**the assumption:** if stone N is rewound, yields for N and all stones > N are archived

**what if the opposite were true?**
- archive only the target stone's yield? → inconsistent with guard artifact cascade
- archive all yields in route? → too aggressive

**evidence:**
- wish: "for all the stones that got rewound when hard mode"
- cascade is explicit in wish
- matches guard artifact cascade behavior

**verdict:** ✅ assumption holds — explicit in wish

---

## assumption #7: `parseArgs` for flag handle

**the assumption:** use node's `parseArgs` for CLI flag parse

**what if the opposite were true?**
- yargs? → heavier dependency
- custom parser? → reinvent wheel
- positional args? → less clear

**evidence:**
- route.ts already uses parseArgs
- built-in, no extra dependency
- supports both string and boolean flags

**verdict:** ✅ assumption holds — follows extant pattern

---

## assumption #8: separate archiveStoneYield.ts file

**the assumption:** archive logic is a separate file, not inline

**what if the opposite were true?**
- inline in setStoneAsRewound? → harder to unit test
- inline in stepRouteStoneSet? → wrong layer

**evidence:**
- delStoneGuardArtifacts is separate file
- single-responsibility principle
- enables isolated unit tests

**verdict:** ✅ assumption holds — testability, consistency

---

## assumption #9: error on contradiction flags

**the assumption:** `--hard` + `--soft` throws error

**what if the opposite were true?**
- last flag wins? → unclear, order-dependent
- ignore one? → silent behavior, may surprise user

**evidence:**
- explicit error is clearer
- other CLIs error on contradiction (e.g., git)
- pit of success: fail fast on user error

**verdict:** ✅ assumption holds — fail fast

---

## assumption #10: yield file pattern is `$stone.yield.md`

**the assumption:** yields match pattern `$stone.yield.md`

**what if the opposite were true?**
- yields in `.route/`? → would be `$stone.yield.md` in route, not `.route/`
- different extension? → not markdown

**evidence:**
- wish: "the $stone.yield.md file"
- wish explicitly names this pattern
- consistent across route stones

**verdict:** ✅ assumption holds — explicit in wish

---

## hidden assumptions surfaced

| # | assumption | evidence | holds? |
|---|------------|----------|--------|
| 1 | archive to `.route/.archive/` | extant pattern | ✅ |
| 2 | archive, not delete | criteria, safety | ✅ |
| 3 | timestamp suffix | extant pattern | ✅ |
| 4 | fs.rename for move | atomicity | ✅ |
| 5 | default is keep | backwards compat | ✅ |
| 6 | cascade archival | explicit in wish | ✅ |
| 7 | parseArgs | extant pattern | ✅ |
| 8 | separate file | testability | ✅ |
| 9 | error on contradiction | fail fast | ✅ |
| 10 | $stone.yield.md pattern | explicit in wish | ✅ |

---

## conclusion

10 technical assumptions were surfaced and questioned. all hold based on:
- explicit wish requirements (3)
- extant codebase patterns (5)
- safety and correctness principles (2)

no assumption is based on habit without evidence.

🦉 all assumptions questioned. all hold. so it is.

