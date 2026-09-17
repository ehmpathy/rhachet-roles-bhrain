# hazard.reviewer-completion-is-async

## .what

a peer reviewer — especially an `enroll` lane that spawns a full claude session — may take 5 to 15 minutes to complete. the `--as arrived` command does not return until ALL reviewers at the current level have settled.

## .why

a driver that reads the arrival output BEFORE the command completes sees a partial state. cached l1 verdicts return in seconds; l3 enroll sessions take minutes. an early read shows l1 settled and l3 at `awaits arrival` — which looks like l3 never ran, when in fact it has not finished yet.

## .the rule

never assume a reviewer has completed until the arrival command itself has returned. if the command runs in the background, wait for the background task to finish before you read its output.

## .the failure mode

the driver reads a partial stdout, sees `l3 awaits arrival`, concludes the level gate is stuck, and asks a human to overrule — when the l3 lanes are still in flight.

## .the fix

run `--as arrived` in the foreground and wait for it to return. its exit is the signal that all reviewers at the current level have settled.
