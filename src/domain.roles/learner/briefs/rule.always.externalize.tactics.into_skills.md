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
