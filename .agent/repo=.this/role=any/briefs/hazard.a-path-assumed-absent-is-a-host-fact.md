# hazard.a-path-assumed-absent-is-a-host-fact

> **a test that names a fixed path it expects to be absent asserts a fact about the host, not
> the code. pick a name no host owns.**

`/nonexistent` reads as a placeholder, yet it is the home dir of debian's `nobody` user, and a
shared box may hold it. there, `mkdir -p /nonexistent/path` fails one segment deeper, the error
text names a different dir, and a snapshot of it goes red with no code change.

| when… | then… |
|---|---|
| a fixture needs a path that cannot be made | a root-level name with a repo prefix: `/rhachet-test-root-never-made/…` |
| a fixture needs a path that does not exist | a fresh `genTempDir` plus a child never written — hermetic on every host |
| a snapshot holds an fs error message | it holds a path; ask whether that path is the code's or the host's |
| a test fails on one box and passes in ci | check the host before the code: `file <path>` |

⇒ worked example: `findsertReview{Peer,Self}Gitignore` `[case5]` and their integration twins, 2026-10-24.
⇒ see also: `rule.require.hermetic-tests` (ehmpathy/mechanic).
