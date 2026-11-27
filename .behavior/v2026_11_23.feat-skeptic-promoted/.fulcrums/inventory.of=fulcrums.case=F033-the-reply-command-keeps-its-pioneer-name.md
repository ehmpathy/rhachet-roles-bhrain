# F033 — the reply command keeps its pioneer name

- **fork**: replace `director.reply` (read by three Stop checks' turn query, and by `asCitedRead`) and `DIRECTOR_CORRECTION_FILM` (read by `razor.hold.check`) with `SKEPTIC_*` inputs; or keep the names the pioneer consumer (nheuron) speaks
- **read**:
  - `rhx grepsafe --pattern director` over the role's skills: `razor.stop.check.sh:93`, `razor.hold.check.sh:103`, `skeptic.answer.check.sh:140`, `skeptic.answer.check.sh:264`
  - the vision's seam 3 kept the film env as the source held it, and F11 kept the `director.reply` and film paths as optional inputs
  - a seat with no `director.reply` command never matches the pattern, so the read is inert, not wrong. no refusal turns on it
- **taken**: keep both names in 5.1. a rename to `SKEPTIC_REPLY_COMMAND` and `SKEPTIC_HOLD_FILM` changes the input contract nheuron calls today. that is a choice for the wisher, not a drive-by edit
- **rework**: clean — one env read per check, a default, and a readme row
- **confidence**: 65%; the arch reviewer reads the name as a scope leak, and a generic role that names one consumer is one
- **where**: the four lines above, plus the readme inputs table
- **verdict**: overturned by the driver (seed S11): the name that serves a consumer that is not the director is one that names the role's own input, not one consumer's skill. landed:
  - `SKEPTIC_REPLY_COMMAND`: the command a session replies to its human through. three Stop checks read the turn's last Bash call that names it, and `asCitedRead` never counts it as a read. unset → the reply text alone is read. nheuron sets `director.reply`
  - `SKEPTIC_HOLD_FILM` replaces `DIRECTOR_CORRECTION_FILM` in `razor.hold.check`
  - no `director` name is left in a skill's logic (`rhx grepsafe --pattern 'director\\.reply|DIRECTOR_' --path src/domain.roles/skeptic/skills --glob '*.sh'`: help examples alone)
  - clamps: `razor.hold.check` `[t2]` (a `desk.reply` consumer, refused) and `[t2.1]` (unset, passes); `skeptic.answer.check` case11 `[t0]`/`[t1]` and case `[t1]` with `rhx desk.reply`. red with the hardcoded `director.reply` restored, then green
  - readme inputs table lists both
