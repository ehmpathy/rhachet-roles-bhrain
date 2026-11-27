# rule.forbid.checks-that-cry-wolf

> **a check earns a place only when its flags are rarely wrong. it grades a recorded fact, never the words of a reply, and its flag rate is measured on real sessions before it blocks or nags.**

a **check** = any hook, guard, or gate that flags, refuses, or injects a notice: a Stop hook, a PreToolUse refusal, a prompt notice.

## .why

- a check that flags honest work as often as defective work teaches its reader to skip it. once skipped, it catches none, and it still costs a turn per flag
- this holds for a notice as much as for a block: a notice that fires on every prompt is noise the same way
- words do not show whether a thought was checked: a claim that was read and one that was not can be phrased the same. so a check over the words of a reply cannot tell the two apart, by construction
- a recorded fact can: an exit code, the order of calls, a file's state. a flag that fires only when a recorded fact contradicts a claim cannot be wrong about the contradiction

## .the test

> **when this check flags, how often is the flag right — measured, on a labeled replay of real sessions?**

no measure → the check does not ship, or ships as a notice that fires only on a recorded contradiction. a flag rate below about 9 in 10 right → it does not block.

| when… | then… |
|---|---|
| you write a check that matches a pattern in reply text | it reads words. find the recorded fact the defect leaves, or keep the cue in a brief |
| a check fires on most turns | it is noise; measure it, or cut it |
| you cannot name the fact the check reads | it has none; it is a brief in a hook's clothes |
| a check passes its own tests | its tests prove it fires; only a replay proves its flags are right |

## .enforcement

blocker: a check that refuses or nags on a word pattern · a check that blocks with no flag rate measured on real sessions
nitpick: a check with no labeled replay case for each class it flags

first seen: rhachet-roles-bhrain, `.behavior/v2026_11_23.feat-skeptic-promoted/` — four Stop checks of role=skeptic that graded reply words, cut for false flags.
