# rule.always.externalize.tactics.into_skills

## .what

when an action takes multiple steps, encode it as a skill. externalize tactics into reusable mechanisms.

## .when

externalize when:
- an action took multiple steps
- an action was hard to discover
- you had to chain commands or tools
- you'll likely do this again

## .why

- multi-step actions are error-prone when repeated manually
- skills compound — each one makes future work faster
- skills are testable, improvable, shareable
- the cost to encode is low; the cost to rediscover is high

## .how

1. notice the tactic (multi-step, non-obvious, repeatable)
2. pause — don't wait until later
3. write a skill in `.agent/repo=.this/role=*/skills/`
4. make it idempotent — safe to run twice

## .the test

ask: "would i want a button for this?"

yes → write the skill
no → move on

## .mantra

> pave the path for the next traveler 🪶

## .enforcement

tactic repeated but not externalized = violation of learner purpose

## 🔴 .this is the PARENT — reach for a specialization first

⚠️ **this rule is named for the genus.** `externalize` is the family
(`term=externalize._.choice._.md`); the act you are about to perform is one of its members. so a
reader who arrives here is nearly always one dereference short of the rule that fires on their
actual cue.

| you are about to | reach for |
|---|---|
| write a repeated **sequence** down as a runnable artifact | `rule.always.enskill-the-tactics-you-discover` — the DISCOVER half |
| notice a skill you called and **still finished by hand** | `rule.always.entool-the-skills-you-touch` — the UPGRADE half |
| lay a sequence of **judgments** rather than commands | a 🗿 **route**, per the enskill rule's route section |

⇒ **the two are a loop, not alternatives:** discover a repeat → ENSKILL → notice the leftover brain
work → ENTOOL. each carries a when-then cue table this rule does not, which is the sharper shape by
a wide margin (`research.selfreview-effectiveness`: a when-then cue scores **d = 0.65**, a bare
principle **d = 0.05**).

## .see also

- `rule.always.enskill-the-tactics-you-discover` — the DISCOVER specialization, with its cue table
- `rule.always.entool-the-skills-you-touch` — the UPGRADE specialization
- `philosophy.entoolment-is-the-pinnacle._.md` — the ladder both climb, and why
- `term=externalize._.choice._.md` — the family this rule is named for, and its five members
