# domain.term.choice.reason: state

## .etymology

the state of a toggle is the position it rests at. the term hook rests at one of three, so the
read returns a state whose `status` names the position. `status` is the human-read leaf
(`status = enabled`), `state` the whole read behind it.

rejected:
- **mode** — `--mode plan | apply` holds that word across the repo's skills
- **status** as the whole — kept for the one field, so the drift count rides beside it, not in it

## .the render — why the `status =` leaf reads `enabled` / `disabled`

the cli leaf renders the toggle's two positions in the words a human types, the verbs' own
past participles: `off` reads `disabled`; `current` and `drifted` both read `enabled`, since in
each a stop runs the term hook. what parts `drifted` from `current` is the repair owed, and the
`drift =` leaf beside it names that repair, so the leaf never folds the distinction away.

a write's leaf adds the outcome of that one call in parens (`enabled (added)`,
`disabled (removed)`, `already enabled`); the outcome words are `TermsHookToggleOutcome`.
so one leaf carries two declared vocabularies, each in its own slot: the position, rendered
from the state, and the outcome, rendered from the write. `off · current · drifted` stay the
read's own words, in code and in this glossary.

## .boundary

generic english on its own. the boundary `learn.terms.hook` pins the one read every verb shares,
so the three verbs cannot drift into three reads of one file.

## .evidence

- the declared operation `getOneTermsHookState` and its union `TermsHookStatus`
- invariant: `current` holds only when the one entry found is the declared one, whole; any other
  term hook entry makes the state `drifted`, so `enable` is a no-op only where it would write naught
