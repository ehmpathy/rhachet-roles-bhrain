# rule.forbid.oughts-from-an-is

> **no "should" is drawn from a fact alone. name the goal that turns the fact into an ought.**

razor: `razor=hume-is-ought`. peer: `rule.forbid.requirements-kept-with-no-why`.

## .the shape

| 👎 | 👍 |
|---|---|
| "the test is slow, so we should delete it" | "the test is slow; if the goal is a sub-5-minute suite, it should move to nightly" |
| "most repos use X, so we should too" | "most repos use X; we should too if the goal is easy onboard of their devs" |
| "the user asked for it, so we must build it" | "the user asked for it to unblock Y; Y is the goal, it may have a cheaper path" |

## .the test

> **which goal makes this fact a reason to act? is it stated?**

## .enforcement

blocker: a mechanism built on an ought whose goal no one stated
nitpick: a "should" in a review with no goal named
