# F6 — a tool-enforced rule moves to ref only where the tool prints the cue at the act

## the fork
the wish allows *"a rule a tool already enforces at that moment may move to ref, with the tool named"*.
- (a) move a rule to ref only when the tool's own halt carries the rule's cue: the claim plus the fix
- (b) move every rule that a tool gates in any way

## taken: (a), and why at the time
- a gate that refuses without the judgment leaves the cue unfired. measured:
  `setStoneAsConcernAbsorbed.ts:106` refuses with *"--severity is required for --as conceded"*,
  but the harm test that picks `urgent` vs `better` is not in that message. so
  `rule.always.concede-with-a-severity` stays at say
- verified candidate: learner `rule.forbid.native-memory` (663 tokens). its own text says the
  `memory.guard` PreToolUse hook *"halts writes to native memory and prints this redirect — so you
  need not recall the rule mid-flow"*. the wire is real: `getLearnerRole.ts:29` registers
  `rhx memory.guard --mode hook` as an onTool hook, and `getLearnerRole.test.ts:27` asserts it.
  it moves to ref, and the boot.yml comment names `memory.guard`
- unverified candidates, each checked at execution against the tool's actual message:
  `howto.run-self-reviews` (the guard prints each review's guide), `rule.always.absorb-every-concern`
  (the `.taken` is refused until each concern is absorbed)

## checked at execution
- `howto.run-self-reviews` → **moves to ref.** the self-review guard printed, at each ask this
  stone, the review's guide, its exact `--into` path, and the promise command; and on each refusal
  it printed the fix (`no ask on record` → ask with `--as passed`; the haste cue → pause). the
  mandate that no review is waived stays at say in `rule.always.bear-every-self-review`, since no
  halt carries that. driver 20,742 → 20,167
- `rule.always.absorb-every-concern` → **stays at say.** `setStoneAsFeedbackAbsorbed.ts:172-191`
  refuses with the per-concern commands, but not the judgment: that a code fix is not an
  absorption, and when to concede vs dispute. the same shape as `concede-with-a-severity`

## rework: clean
a tier move in boot.yml.

## confidence: 80%, low because
"the tool prints the cue" is judged per message, and a halt that prints a command without the why
may still leave a driver unable to choose between `disputed` and `conceded`.
