# F9 — `define.routes-are-gardened.[philosophy].md` stays at say whole, with no min

## the fork

- **A** — write `define.routes-are-gardened.[philosophy].md.min`, as the vision proposed
- **B** — leave the `.md` at say, whole, with no min
- **C** — rename the pair out of the bracket form, then write the min

## taken: B, and why

a min must share its `.md`'s stem for the boot to pair them, so A adds a new filename with
`[` and `]`, which `rule.forbid.brackets-in-filenames` names a blocker. that same rule cites this
exact file as its bad example. C fixes it, but a rename ripples into six citations across three
roles and into the brackets rule's own example block, which is out of this pr's scope.

the cost of B is small: the file is 591 tokens, and nearly all its lines are cue (bullets and
blockquotes), so a min would save ~100–150 tokens.

## rework: clean

C is a rename of two files plus six citation edits, in a later pr. no other work builds on B.
it is deferred, not dropped: `dreams/v2026_10_21.fix.rename-routes-are-gardened-out-of-the-bracket-form.md`
carries the rename and the min, and F2's kernel for this philosophy lands with it.

the precedent a peer cited, `learner/briefs/howto.domain-term-disputes.[guide].md.min`, is an
extant bracketed min on main. the brackets rule binds new and renamed files; an extant one is left
until disturbed, so it does not license a new one.

## confidence: 85%, and why it is not higher

the wisher may prefer C now, since the brackets rule calls its own example out as a defect.

## where

`src/domain.roles/driver/boot.yml` (the say entry is unchanged).
