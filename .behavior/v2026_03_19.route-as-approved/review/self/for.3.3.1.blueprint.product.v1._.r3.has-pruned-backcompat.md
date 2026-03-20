# self-review: has-pruned-backcompat (round 3)

## backward compatibility analysis

---

## what the blueprint changes

| component | before | after | change type |
|-----------|--------|-------|-------------|
| guidance string | "please ask a human..." | structured alternatives | output string |
| header (blocked) | "🦉 the way speaks for itself" | "🦉 patience, friend." | output string |
| boot.yml | no `say` section | `say` section with one entry | additive |
| brief | file absent | new file | additive |

---

## backward compatibility concerns: examination

### concern.1: guidance string change

**what changes:**
- old: `"please ask a human to run this command"`
- new: multi-line structured guidance with `--as passed`, `--as arrived`, `--as blocked`

**is backward compatibility needed?**

**no.** examination:

1. **is this output parsed by machines?**
   - the `guidance` field is a string rendered to stdout
   - no JSON API, no machine parses this
   - consumers are humans and agents who read terminal output
   - the output is for humans, not machines

2. **did the wisher request to preserve the old message?**
   - no. the wisher explicitly requested the *change*:
   > "clarifies that --as arrived and --as passed is what it should run instead"

3. **does the old message provide value?**
   - "please ask a human" is less actionable than the new guidance
   - the new guidance tells drivers exactly what to do
   - the old message is a dead end; the new message is a signpost

**verdict:** no backward compat needed. intentional improvement, explicitly requested.

---

### concern.2: header change for blocked action

**what changes:**
- old: `HEADER_SET` = "🦉 the way speaks for itself"
- new: inline `"🦉 patience, friend."`

**is backward compatibility needed?**

**no.** examination:

1. **is this output parsed by machines?**
   - headers are visual, emojis for human readers
   - no machine parses this
   - no tests assert the specific header text for blocked action

2. **did the wisher request to preserve the old header?**
   - no. the vision shows the new header explicitly:
   > `🦉 patience, friend.`

3. **does the old header fit the context?**
   - "the way speaks for itself" implies success or completion
   - "patience, friend" fits a blocked/wait scenario better
   - semantic alignment improved

**verdict:** no backward compat needed. better semantic fit, shown in vision.

---

### concern.3: boot.yml `say` section

**what changes:**
- new `say:` section under `briefs:`
- one entry: `briefs/howto.drive-routes.[guide].md`

**is backward compatibility needed?**

**no.** examination:

1. **is this additive or a break?**
   - purely additive
   - extant `ref:` section unchanged
   - no removal, no modification of extant behavior

2. **does this affect consumers who lack the new brief?**
   - not applicable — we create the brief
   - the section and file are created together

**verdict:** no backward compat needed. additive change.

---

### concern.4: new brief file

**what changes:**
- new file: `briefs/howto.drive-routes.[guide].md`

**is backward compatibility needed?**

**no.** examination:

1. **is this additive or a break?**
   - purely additive
   - new file, new content
   - does not replace or modify any extant file

**verdict:** no backward compat needed. additive change.

---

## backward compatibility shims in blueprint: zero

the blueprint proposes:
- no deprecation warnings
- no version flags
- no fallback behavior
- no migration path

**is this correct?**

**yes.** because:

1. **all changes are either additive or output improvements**
   - additive: boot.yml section, brief file
   - output improvements: guidance string, header

2. **no API surface changes**
   - `setStoneAsApproved` signature unchanged
   - `formatRouteStoneEmit` signature unchanged
   - return types unchanged
   - behavior unchanged: blocked still returns `approved: false`

3. **no callers depend on specific output strings**
   - tests assert presence of key phrases, not exact format
   - consumers are humans/agents who read terminal output
   - no JSON APIs, no machine parses output

---

## summary

| potential backcompat concern | needed? | rationale |
|------------------------------|---------|-----------|
| guidance string change | no | intentional improvement, explicitly requested |
| header change | no | semantic fit, shown in vision |
| boot.yml say section | no | additive change |
| new brief file | no | additive change |

**no backward compatibility concerns found in blueprint.**

the blueprint correctly omits backward compatibility shims because all changes are either additive or output improvements that do not break any API contracts.

---

## the owl reflects 🦉

> backward compatibility is a burden carried only when needed.
> when the path improves, do not chain yourself to the old stones.
> move forward with clarity.
>
> the wisher asked for clearer guidance.
> the old message served its time.
> the new message serves better.
>
> so it is. 🪷

