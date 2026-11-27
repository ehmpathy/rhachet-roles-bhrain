# rule.always.trust-but-verify.example=the-keyrack-ask-prover

> row: two guards clash. 2026-11-21, nheuron, the acceleration director seat.

## .the shape, in any life

one rule says "test the fuse box before you touch it". another says "no one may open the fuse box". each is fair alone, and together they bar the job. do my two rules, run together, still let the work be done?

the case below: a prover demanded a read of a help text that a pretool guard refused to let the seat run.

## .what happened

- a crew pane asked for one credential act: `rhx keyrack set --owner ehmpath --org nheuron --env prep --key AWS_PROFILE --vault aws.config`
- the director moved to put it on the human's queue via `fleet.asks set`
- `fleet.asks` proves each `rhx` act against its help. it read `rhx keyrack --help`, not the help of the `set` subcommand, and refused: "rhx keyrack takes no flag --org, --env, --key, --vault"
- to check the flags, the director ran `rhx keyrack set --help`. the director pretool guard refused it as a self-grant of the credential gate

## .the two claims

- claim A (ask prover): a command handed up must be proved against its help
- claim B (pretool guard): a director seat must not run `keyrack set`, in any form

each holds alone. as a pair they forbid every keyrack set ask with its exact command: A demands the read that B refuses.

## .the run that settles it

- claim A fails its own run: it read the parent verb's help, so it judged the subcommand's flags against the wrong text
- claim B over-reaches: a `--help` read grants naught, so it is no self-grant

both texts are erroneous at their edge; each needs a cure, and the pair needs a test that runs them together. this case is why the row reads "both fail → cure each at its edge", not "both go": neither guard was wrong at its core.

## .the cost

the keystone ask (rhachet-roles-nheuron#4, p0, 10 rows gated) stayed on the queue in its stale form; the current act reached the human only through a cycle report.

up: `rule.always.trust-but-verify` (the row for two guards that clash)
