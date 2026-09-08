# domain.term.choice.reason: bind

## .etymology

`bind` is a **bookbinder's word before it is a programmer's** — to fasten separate leaves into one
volume that thereafter travels together. that is the exact relation the flag creates: a route and a
branch are separate artifacts until the flag makes them move as one, and `--route` stops to be an
argument you carry.

it beat four candidates, each rejected for a stated reason:

| candidate | why it lost |
|---|---|
| `attach` | one-directional and detachable-by-default. a route is not hung off a branch; the two travel as a pair, and the engine **refuses** a second attachment (`setRouteBind.ts:55`) |
| `link` | already spent on the filesystem sense — `rhx symlink` is a paved skill in this tree, so `link` in a path context reads as a symlink |
| `pin` | borrowed from dependency management, where it fixes a **version**. a bind fixes no version; it fixes an association |
| `associate` | names the relation and not the act, so it composes badly — `setRouteAssociation` reads as a noun phrase where `setRouteBind` reads as a verb |
| ✅ `bind` | the tightness is the point, and the tightness is **enforced** rather than merely intended |

⚠️ **`bind` was adopted, never coined here.** `setRouteBind.ts` and the `route.bind.*` skills
predate this cluster; what this cluster settles is its **boundary**, which the overload below made
necessary.

## .disputes

### dispute: `bind` for a reviewer lane's arguments — raised 2026-09-06 — status: RESOLVED (forbidden; the sense is `run`)

- raised.by = driver, on `v2026_09_03.fix-contemplation-gate-on-entrance`, stone `5.3.verification`
- claim = a guard's `run:` line *binds* flags to a lane much as a flag file binds a route to a
  branch. both fasten a configuration to a subject, so one word serves both.
- counter = they share a metaphor and share no **behavior**, and the glossary keys on behavior. a
  route bind is **stateful, persisted, exclusive, and idempotently removable** — one flag on disk,
  one route per branch, `delRouteBind` to undo. a lane's `run:` line is **declarative, in-file,
  repeatable, and has no lifecycle at all**. an operation named `delGuardBind` would name no act
  that exists.
- ⚠️ counter, the sharper half = **the word for it was already declared.** the guard yaml's own key
  is `run:`, and the file set it selects is already `scope` (`term=review.scope`, closed
  2026-09-06). so the overload did not fill a gap — **it reached past two extant terms.**
- resolution = `bind` is reserved to the route↔branch fastener. a lane's arguments are its **`run`**;
  the files they select are its **`scope`**. `bind` is recorded as a **forbidden qualifier on a
  reviewer lane**, never as a forbidden word.

## .evidence

### the measured spread — 2026-09-06

the overload was not a slip; it propagated into durable artifacts across five rounds, and its
clearest instance is a **fulcrum title**:

| artifact | the phrase |
|---|---|
| `.fulcrums/…case=F11-the-guard-binds-are-blind-and-i-did-not-edit-them.md` | the filename itself |
| the same entry's first table | *"the bind, as written \| what the lane received"* |
| the driver's own turn report | *"the rebind did not clear the overflow"* |

⇒ 🔴 **the filename is the sharpest evidence, because a filename is an address.** a reader who
greps `bind` to find the route fastener now gets a fulcrum about reviewer scope, and the two are
indistinguishable by the word alone.

### 🔴 the overload hid an absent distinction, and the distinction was the defect

`rule.forbid.domain-term-ambiguity` states the harm as *the overload hides an ABSENT DISTINCTION*.
this case is a clean instance, and the hidden distinction is **exactly the defect the round was
after**:

| what a lane **declares** | what a lane **receives** | what the diagnostic **prints** |
|---|---|---|
| `run: … --paths-with '{src,blackbox}/**'` | `targetFilesFromPaths` — 168 files | `paths: (none)` |

with one word for all three, *"the binds are blind"* reads as a single claim. with three words it
parts into three checkable ones — and **only the third was false**. the entry asserted the lanes
received no scope; they received it in full, and the *display* lied
(`stepReview.ts:668,697` branch on `input.paths`, never `pathsWith`).

⇒ **a fulcrum row survived five rounds on a false premise that one word made unaskable.** the cost
of the overload here is not a misnamed file; it is a **measurement nobody could challenge**, on the
one page whose subject is whether the measurement can be trusted.

### why the boundary is `route` and not `guard`

`rule.require.boundary-qualified-terms` asks *"$word, of WHAT?"* — and the answer is one word,
`route`, because the flag fastens a **route**. it is emphatically not `driver`: a role is not a
boundary, and the bind outlives any one driver's session (it is one of two route-state files kept
under version control, `findsertRouteGitignore.ts:18`).

⚠️ the overloaded sense would have wanted the boundary `guard` — which is itself the tell. **two
senses that want two different boundaries are two terms**, and the boundary question surfaces that
before any argument about taste.
