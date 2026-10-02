# domain.term: route.guard.brain.dispatch

term.chosen   = dispatch
term.kind     = verb
term.boundary = route.guard.brain   # to put a brain switch on the wire, of a live clone
term.synonyms.forbidden:
- send
- apply
- deliver
- push
- invoke

## .what

to **dispatch** a brain switch is to put it on the wire toward one live clone, and to return once
the submit is verified — never once the brain has acted on it.

- the act ends at submit, never at accept — its whole return is `{ submitted: boolean }`
- it composes rhachet's wire verb `say`; it does not compete with it

| layer | verb | subject |
|---|---|---|
| rhachet | `say` | a message, into a pty |
| this repo | `dispatch` | a brain switch, on behalf of a stone |
| this repo | `apply` | the stone-entry orchestration that composes a dispatch |

- it is convergent: it fires whenever a `brain:` key is present and reads no live state first
  (`F14`)

## .refs

- src/domain.operations/route/brain/dispatchBrainSwitch.ts          # the operation it names
- src/domain.operations/route/brain/genBrainDispatchClaim.ts        # reserves one dispatch
- src/domain.operations/route/brain/delBrainDispatchClaim.ts        # releases it
- src/domain.operations/route/brain/formatStoneBrainUndispatched.ts # renders a dispatch that did not go

## .reason

- `term=route.guard.brain.dispatch._.choice.reason.md` — why it stops at submit (`delivered: true`
  overclaims), the `say` and `apply` disputes, the convergent premise
