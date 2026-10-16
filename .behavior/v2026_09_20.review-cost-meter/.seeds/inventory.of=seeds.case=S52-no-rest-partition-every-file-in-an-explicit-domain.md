# S52 — no rest partition; every file sits in an explicit domain partition

- said 2026-10-07, in reply to the report that 267 files fell to `rest` on 5.1, mostly `.agent/**`,
  briefs, and config, and a proposal to default unclaimed files into a remainder

## .said

> why do we have rest at all? shouldn't rest have been explicitly partitioned instead ? - 267 files
> fall into rest on 5.1. Most are .agent/**, briefs, and config. They are still reviewed, but rest
> is a catch-all, so its lanes get a mixed bag. Giving .agent/** and the briefs their own partition
> would make those lanes more focused.

## .settled

- a catch-all partition is a horizontal grab-bag by construction: it groups files by the fact that
  no domain claimed them, which is no domain at all. it is a `rule.forbid.horizontal-partitions`
  violation, and the tool must not propose, default to, or reward one
- every changed file sits in an explicitly named **domain** partition. a file with no obvious
  domain still has one — config, the agent's briefs, the agent's actors — and it gets a name
- the tool's default guidance for an unclaimed file is the named domain partition it belongs in:
  a `--claim` into an extant partition when one fits, or a new named partition when none does.
  never a remainder
- a remainder partition, proposed as the "match better by default" path of S51, is struck

## .landed

- (awaited) the repair, the partition parser, and the 5.1 guard's declared set
