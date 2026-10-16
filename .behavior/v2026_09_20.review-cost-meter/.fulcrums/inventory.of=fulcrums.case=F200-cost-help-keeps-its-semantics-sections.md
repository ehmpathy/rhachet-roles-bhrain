# F200 — `review._.cost --help` keeps its semantics sections

- raised 2026-10-09, from i034 r028 nitpick.2 `[nitpick][better]`: the help runs ~115 lines and
  buries `usage` / `inputs` / `examples` under eight sections of semantics
- rework: clean
- status: 🟡 **BEST-GUESSED — disputed; overrule it to split the help**
- confidence: **65%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — usage first, one pointer per section** | the semantics move to a brief or a `--help all`; `--help` shrinks to what a flag recall needs |
| **B — keep it whole** | every section answers a question a reader of the report meets (absent vs `$0`, cold vs warm, the floor, which input bought it), and `--help` is the one place a reader always looks (`rule.require.help-on-demand`) |

## .taken, and why

**B.** a pointer to a brief sends the reader out of the tool for the sense of a figure the tool
just printed, which is the friction `help-on-demand` forbids. a `--help all` is a second flag
grammar for one command. the cheaper cure is order: `usage`, `inputs`, `examples` already lead.

## .rework, and why

**clean.** one print function and one snapshot.

## .confidence, and why it is not higher

if a reader confirms they scroll past the semantics on every recall, A wins on frequency.

## .where

`src/contract/cli/review._.cost.ts` (`printHelp`)

## .verdict

(open)
