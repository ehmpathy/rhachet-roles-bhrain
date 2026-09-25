# fulcrum F14 — the archive filename keeps its time-precision suffix

- **case** = F14
- **title** = the archive filename keeps its time-precision suffix
- **rework** = clean
- **status** = ✅ **RESOLVED by repair** — the un-tabled fourth option, taken
- **confidence** = 97%
- **raised** = 2026-09-18, by the `repo-rules` peer review (nitpick.1) on `5.1.execution.from_vision`
- **closed** = 2026-09-18, by `arch-hazards-behavior` nitpick.1 — a **second** lane, same expression,
  a different objection

## 🔴 .the resolution — a SECOND lane closed it, from the opposite direction

this fulcrum was raised to defend the timestamp suffix against a **style** objection
(`rule.forbid.timestamps-in-route-artifacts`), and the defence held: the three options tabled below
all lost records, and a lost record is worse than an un-diffable filename.

**then `arch-hazards-behavior` nitpick.1 read the same expression and found a CORRECTNESS defect the
style lane never claimed:**

> *"it uses `new Date().toJSON()` (wall-clock, ms precision), so two renames in the same millisecond
> produce identical suffixes and overwrite each other **even when the probe does see a collision**."*

⇒ **so the suffix did not deliver the one property the defence rested on.** the whole argument for
option A was *"A always keeps a second rewind's record"* — and at ms granularity it does not. the
premise was false, and the fulcrum's own table says so in its first row.

### the option that was never tabled, and it satisfies BOTH lanes

`.confidence` below named it and did not table it: *"a monotonic counter (`.1`, `.2`, `.3`) would
keep every record AND satisfy the rule."* that is what shipped, with the probe replaced by an
**atomic claim**:

```ts
    // claim the name. an EEXIST is a real collision; every other error is a fault, and a
    // fault must reach the caller rather than read as "that name is taken"
    const claimed = await fs
      .link(input.file, archivePath)
      .then(() => true)
      .catch((error: NodeJS.ErrnoException) => {
        if (error.code === 'EEXIST') return false;
        throw error;
      });
    if (!claimed) continue;
    await fs.unlink(input.file);
```

| the objection | what the ordinal + atomic claim does to it |
|---|---|
| `repo-rules` — time precision in a route artifact | ✅ **gone.** the name holds no clock at all |
| `arch-hazards-behavior` — two archives in one ms collide | ✅ **gone.** the ordinal is not a clock |
| `arch-hazards-behavior` — probe-then-rename is TOCTOU | ✅ **gone.** `fs.link` refuses an extant name atomically, so the claim IS the create |
| the drive's own reason for A — a second rewind's record survives | ✅ **kept, and now actually true** |

🔴 **clamped, and the clamp bites.** `archiveRouteFiles.integration.test.ts [case2]` archives four
sources onto one basename with `Promise.all`. swap `fs.link` back to `fs.rename` and **3 of 4 tests
go red**; restore it and 24 pass (`rule.require.clamp-edge-cases`).

## 🟡 .the lesson, and it is why this entry is kept rather than deleted

**a fulcrum defends a call against the objection it was raised by.** this one answered *"is a
timestamp allowed here?"* and answered it soundly. it could not answer *"does the timestamp do what
you claim?"* — because nobody had asked.

⇒ **two lanes, two rubrics, one expression, and neither objection alone would have produced the
repair.** the style lane named a name that read wrong; the behavior lane named the broken mechanism.
the fix that satisfies both was listed in this file's own `.confidence` section, as a reason the
drive's confidence was *only* 80%, and it was not taken until a second lane made the cost concrete.

🔴 **the transferable check: when a fulcrum's `.confidence` section names an un-tabled option, table
it.** an option good enough to lower your confidence is an option good enough to compare.

---

## .the record, as it stood when the fulcrum was raised

_preserved below, unedited. the analysis was sound on the question it was asked._

## .the fork, stated fairly

`archiveRouteFiles` suffixes an archived filename on collision:

```ts
    // suffix on collision, so a prior rewind's record survives this one
    const archivePath = archiveFound
      ? path.join(
          archiveDir,
          `${baseName}.${new Date().toJSON().replace(/[:.]/g, '-')}`,
        )
      : archivePathPlain;
```

that renders `2026-09-18T11-05-00-000Z` into a route-persisted filename.
`rule.forbid.timestamps-in-route-artifacts` allows dates (`YYYY-MM-DD`) and forbids time precision.

🔴 **the behavior is extant** — carried forward verbatim from `archiveStoneYield` — but todo 8
**re-homed** it into a new shared operation, so it is now the canonical archive shape for
self-review trigger markers as well. the blast radius grew in this round even though the code did
not change.

| | A — keep the suffix | B — the mtime | C — a date-only suffix |
|---|---|---|---|
| a second rewind's archive survives the first? | ✅ always | 🔴 **no** — not in the NAME, so both resolve to one path and the rename overwrites | 🟡 once per day |
| a rewind-repair-rewind loop inside one hour | ✅ each record kept | 🔴 the first is lost | 🔴 the first is lost |
| obeys `rule.forbid.timestamps-in-route-artifacts` | 🔴 no | ✅ yes | ✅ yes |
| files | naught | `archiveRouteFiles`, plus every archive assertion | same |
| new defect? | none | 🔴 **silent data loss** in the one operation whose job is to not lose data | 🔴 the same, at a lower rate |

## .taken, and why AT THE TIME

**A — keep the suffix, and record the call.**

the rule's purpose is to keep route artifacts **diffable and merge-clean** — a timestamp churns a
diff and conflicts on merge. a `.route/.archive/` file is:

- never diffed — it is a forensic record, read once when someone asks *"what did the prior rewind
  hold?"*
- never merged — it is gitignored under `.route/`
- never read by a human in the normal path

⇒ so the rule's two costs do not land here, and its remedy costs the one property the archive exists
to provide. **the choice is between a timestamped filename and a lost prior archive**, and the lane's
own grade — nitpick, not blocker — reflects that it saw this too.

🟡 **what is conceded inside the refusal:** the lane is right that the move made this shape
canonical for a second artifact class. that is a real growth in blast radius, and it is the reason
this earns a fulcrum rather than a shrug.

## .rework, and why

**clean.** the suffix is computed at one call site, in one operation, and no consumer downstream
parses the archived name — a reader globs `.archive/` and reads what is there. to swap the scheme is
a one-expression change plus the assertions that pin it.

## .confidence, and why it is 80% rather than higher

1. 🔴 **the rule is stated with no carve-out for un-diffed artifacts**, and I assert one here.
   a council that reads the rule literally rules against this
2. **a fourth option exists that I did not table**: a monotonic counter (`.1`, `.2`, `.3`) would keep
   every record AND satisfy the rule. it costs a read of the archive dir per collision, which is why
   it was not chosen — but it is not absurd, and a council may prefer it
3. the cost of a wrong call is small either way — a rename scheme in a forensic directory

what holds it at 80%: options B and C **lose records**, and the operation's one job is to not lose
them. that asymmetry is not a matter of taste.

## .where

- the operation: `src/domain.operations/route/stones/archiveRouteFiles.ts`
- the rule: `.agent/repo=.this/role=any/briefs/rule.forbid.timestamps-in-route-artifacts.md`
- the concern: `…r001._.given.by_peer.repo-rules.report.md` nitpick.1
- the answer: `…r001._.taken.by_self.repo-rules.md`

## .the verdict, once ruled

_unruled._

⇒ if the council rules **A**, record that the un-diffed-artifact carve-out is accepted, and consider
whether the rule itself owes that boundary on its own page.
⇒ if the council rules the **counter** (option 2 above), it is the strictly better answer and the
repair is one expression plus a dir read.
⇒ if the council rules **B** or **C**, record that a lost prior archive is accepted as the price.
