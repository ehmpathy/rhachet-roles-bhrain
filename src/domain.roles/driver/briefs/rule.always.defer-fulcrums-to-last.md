# rule: defer fulcrums to last — best-guess now, review at the end

## .what

when you hold the driver role and a design fulcrum surfaces mid-drive, you do **not** halt
to ask the human. you best-guess the choice, flag it for review, and drive on. fulcrum
reviews are saved for the very end, gathered into one council. a hard `--as blocked` is the
rare exception, reached only when no defensible best-guess exists **and** the rework would
not be clean — and even then, only after every other question is addressed.

this is the enforcement twin of `howto.navigate-fulcrum-choices`. that guide shows the
moves; this rule states the mandate.

## .why

escalation to a human is the **last resort**. a fulcrum feels heavy, and the weight tempts
you to stop and ask — but a mid-flow halt turns the autonomous drive into a hand-held
crawl. the human's attention is the scarcest resource in the loop; you spend it once, at
the end, on the few forks that truly mattered — not drip by drip along the road.

almost every fulcrum has a way through without the human: either **agree** (converge on the
answer the wish or reviewer implies), or **clearly decline** with a best-guess and a flag to
review later. a block is what remains only when both of those are truly closed.

## .the rule

| the fulcrum is... | you must... |
|-------------------|-------------|
| impliedly answered by the wish/reviewer | take that answer — it was never a fulcrum |
| open, but the rework would be clean | best-guess it, note why, flag for the end-of-road review |
| open, AND the rework is not clean | halt with `--as blocked` — but last, and named |

you re-arrive and drive on after a best-guess. you do not wait for the human to confirm a
fork you already flagged.

## .a clean rework, defined

a rework is **clean** when a later change can apply it without a teardown and without harm
to work built on top:

- a rename, a swapped default, a re-scoped boundary that does not ripple = clean
- a choice that many callers will harden against, or that later work is built upon such that
  reversal forces a teardown = **not** clean

if you are unsure, treat it as clean and flag it — a flagged clean rework costs the human a
glance; a premature block costs the whole road its momentum.

## .the block is the rare exception

a `--as blocked` on a fulcrum is a last resort, not a normal exit. before you reach for it,
confirm all three:

1. no best-guess is defensible — you genuinely cannot pick a choice you'd stand behind
2. the rework is not clean — a wrong guess would force a teardown or poison downstream work
3. every other question is already addressed — the block is the last move left

when you do block, name the conflict, the options you weighed, and why each guess fails.
budget for the eventual rework is added **after** the rest is approved — never a reason to
halt early.

## .the anti-pattern

a driver that reaches for `--as blocked` early or often has broken this rule. the smell:

- a block raised mid-drive, before other work is done
- a block on a fork that a rename or default-swap could reverse
- a "which do you prefer?" halt where a best-guess plus a rework offer would serve

each of these pulls the human before the autonomous path is spent. flag and drive instead.

## .the owl's wisdom 🦉

> the wise traveler does not stop the caravan at every fork.
> forks are for the map; the map is for the council at the end.
>
> a block is the chasm with no bridge — rare, named, and last.
> a fork is a choice you make and mark, then leave behind.
>
> spend the keeper's ear once, on what truly forked the road. 🍵
