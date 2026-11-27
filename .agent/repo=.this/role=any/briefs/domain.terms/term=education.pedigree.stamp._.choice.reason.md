# domain.term.reason: education.pedigree.stamp

## .etymology

a stamp is the mark an authority sets on a document to certify it: a diploma is stamped at
graduation, never handwritten by the graduate. the pedigree entry is derived from proof (yields
and passages) at `4.graduate`, so stamp names both the act and its authority. the verb stays
`set` on the cli (`rule.require.get-set-gen-verbs`); stamp is the domain word for what that set
does, and for the state it leaves.

rejected:
- `record`, `log` — an append of an event; a stamp converges (a re-stamp yields the same entry)
- `commit` — overloaded with git in this repo
- `write` — names the mechanism, not the certification; a stamp is three facts, not one file

## .evidence

- `getOnePedigreeStamp` returns the three facts; the `pedigree-stamped` judge passes only when all
  three hold, and names the re-stamp when one is absent (journey `[case7][t2]`)
- the acceptance journey's `4.graduate` holds before the stamp (`[t5.2]`) and passes after (`[t7]`)

## .invariants

- stamped ⟺ entry written ∧ index row present ∧ boot spec names both
- a stamp is idempotent: same pursuit, same entry, same index
