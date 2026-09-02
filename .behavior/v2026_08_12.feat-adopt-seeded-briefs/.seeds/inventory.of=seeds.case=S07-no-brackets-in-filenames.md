# seed: brackets are forbidden in filenames

**2026-08-14. reversed the `[seed]` filename settled one round earlier, and put the whole
`[kind]` marker family on notice.**

## .said

> ok so what all did we doo? also, lets forbid the [] pattern in file names

> for now

> in this pr

> but also for the librarian, they need a rule to forbid that stuff

> it makes it hard to ref the filenames

## .settled

1. **the `[]` marker pattern is forbidden in filenames.** the stated reason is the decisive one —
   *"it makes it hard to ref the filenames."* brackets are glob metacharacters, so a bracketed
   filename is unmatched by the very tools built to find it
2. **scope is "for now, in this pr"** — the files this behavior authored, not a repo-wide or
   org-wide migration. peer repos keep their convention until re-seeded
3. **the librarian owns the rule** — the role that curates document kinds is the role that governs
   how a kind is marked

## .the evidence was already in this session

a `Glob` for `dist/**/kno601*` returned no match while the file sat on disk, because its name
carried `[article]` and `[` opened a character class. the workaround was `rhx globsafe`. that is
precisely *"hard to ref"*, observed before the rule was asked for.

## .the reversal it caused

one round earlier, this same route settled the opposite: `$topic.seed.md` was renamed to
`$topic.[seed].by_human.md`, on the ground that `[seed]` was an extant org convention rather than
an invention. that rationale was **correct about precedent and wrong about ergonomics** — the
convention it conformed to was itself defective, and the evidence above was already on the record
when the rename was made.

⇒ **precedent is a reason to look, not a reason to conform.** an extant convention can be
pavement, or it can be a rut. `philosophy.pavement-saves-nature` says to check the pavement before
you lay more; it does not say to walk a rut because it is deep.

## .landed

- `src/domain.roles/librarian/briefs/rule.forbid.brackets-in-filenames.md` — the rule
- `src/domain.roles/librarian/boot.yml` — booted at say-level
- every `[kind]` file this behavior authored, renamed to the `kind=$x` coordinate form
- `src/domain.roles/driver/briefs/rule.always.archive-the-wishers-words-verbatim.md` — the seed
  filename contract updated, and the reversal recorded as evidence
