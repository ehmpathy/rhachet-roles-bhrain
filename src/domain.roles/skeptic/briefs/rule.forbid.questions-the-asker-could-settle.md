# rule.forbid.questions-the-asker-could-settle

> **no question goes to a peer that a read, logic, or the rivals weighed could have settled, with no try shown.**

twin of `rule.always.skeptic-questions-all-questions`.

## .the shape

| 👎 | 👍 |
|---|---|
| "who owns this branch?" | `read:` the branch log, last author X · `open:` whether X still owns it |
| "does this design contradict the spec?" | `follows:` the spec says P; the design says not-P. contradiction; which wins? |
| "which of these two should I pick?" | `rivals:` A fits the stated goal, B fits only if latency matters · `open:` does latency matter? |
| "what does this flag do?" | `read:` `--help` says … |

## .the test

> **could a read, a line of logic, or a weigh of the options have answered this, and is the try shown?**

## .enforcement

blocker: a question a peer answered with a lookup or a deduction the asker could have run
nitpick: an `open:` that names no reason the try did not settle it
false positive: a taste call, a risk call, an intent no record holds, a goal unstated
