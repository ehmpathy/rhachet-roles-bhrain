# F018 — seed ids the seeds check cannot read

- **fork**: ship the seeds and `skeptic.seeds.check` as is; restore full ids in each entry; or widen the check's id pattern to read the masked form the entries hold
- **read** (by the code; the check was not run, since a run of an executable outside the repo needs a grant):
  - `skeptic.seeds.check.sh:55` `ID_RE='20[0-9]{2}-[0-9]{2}-[0-9]{2}T[0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]+Z'`
  - `:87-89`: an entry whose `- inbox:` line holds no match is a defect, "no '- inbox: <id>' line"
  - entry S1 `:3` `- inbox: 2026-11-18`; S9 `:3` `2026-11-18`: the minute's last digit is an `x`, so `T21-5x` fails `T[0-9]{2}-[0-9]{2}`
  - the summary shows a masked id on S1–S54 and full ids on S55–S58 (S58 entry `:3` reads `2026-11-22`)
  - #818 says the suite ran green "on the real role dir", so the mask likely came after that run
- **taken**: widen `ID_RE` to accept a masked digit (`[0-9x]`), with a suite case per form. full ids live in nheuron's inbox, which this repo cannot read, and the masked form is what the record holds
- **rework**: clean — one pattern and two suite cases
- **confidence**: 70%. inferred from the code, not from a run; execution runs the check on the promoted dir first, and that run decides
- **where**: `src/domain.roles/skeptic/skills/skeptic.seeds.check.sh`, its suite
- **verdict**: open — research 11
