/**
 * .what = the shell command claude code runs for the memory guard PreToolUse hook
 * .why = a guard that cannot run must never halt the call it guards. so the hook:
 *        - runs the linked skill file directly, never via `rhx`, whose own lookup fault
 *          (an unlinked skill) exits 2 — the code claude code reads as block
 *        - anchors on CLAUDE_PROJECT_DIR, since hooks run in the current cwd, which a
 *          `cd` moves; `.` covers a bare shell run at the root
 *        - when the skill is absent, names the fault and its fix, and exits 1: the call
 *          proceeds, and the human sees the line (stderr on exit 0 is never shown)
 *        - names the dir it looked in, so a wrong CLAUDE_PROJECT_DIR shows itself
 *        - seals the skill's exits: it asks for codes 20 (allow), 21 (fault), and
 *          22 (block), and maps each back by `c - 20`. a skill file that cannot run
 *          as written (a syntax fault exits 2; an empty or cut file exits 0) ends
 *          with no sealed code, so it gets the fault line and exit 1, never a block
 *          and never a silent pass
 *        - holds the skill's stderr until the code is read, so the fault line leads:
 *          claude code shows the first stderr line
 *        - names a link whose package is gone apart from no link: a reinstall cures
 *          the first, a link the second. `roles link` links the skills dir, but the
 *          dangle may sit on any link along the path: the repo dir, the role dir,
 *          the skills dir, or the file
 * .note = the fix runs `./node_modules/.bin/rhachet`, never `npx rhachet`: rhachet's
 *         manifest check refuses `npx … rhachet` anywhere in a hook command string
 */
export const LEARNER_MEMORY_GUARD_HOOK_COMMAND = [
  'd="${CLAUDE_PROJECT_DIR:-.}"; r="$d/.agent/repo=bhrain"; s="$r/role=learner/skills"; f="$s/memory.guard.sh";',
  '[ -f "$f" ] && { e="$(MEMORY_GUARD_HOOK_EXIT_ALLOW=20 MEMORY_GUARD_HOOK_EXIT_FAULT=21 MEMORY_GUARD_HOOK_EXIT_BLOCK=22 bash "$f" --mode hook 2>&1 >/dev/null)"; c=$?;',
  'case "$c" in 20|21|22) [ -n "$e" ] && printf "%s\\n" "$e" >&2; exit $((c - 20));; esac;',
  'echo "📜 memory.guard: could not run (skill ended with exit $c, short of a sealed code, at $f); call allowed. fix: reinstall rhachet-roles-bhrain" >&2; [ -n "$e" ] && printf "%s\\n" "$e" >&2; exit 1; };',
  '{ [ -L "$r" ] || [ -L "$r/role=learner" ] || [ -L "$s" ] || [ -L "$f" ]; } && { echo "📜 memory.guard: could not run (skill link dangles at $f); call allowed. fix: reinstall rhachet-roles-bhrain, then ./node_modules/.bin/rhachet roles link --repo bhrain --role learner" >&2; exit 1; };',
  'echo "📜 memory.guard: could not run (skill not linked under $d); call allowed. fix: ./node_modules/.bin/rhachet roles link --repo bhrain --role learner" >&2; exit 1',
].join(' ');

/**
 * .what = the time claude code gives the memory guard hook
 * .why = memory.guard.sh holds its own deadlines under this budget, so a slow guard
 *        is named rather than killed silent; declared once, and the skill's
 *        MEMORY_GUARD_HOOK_BUDGET_MS is clamped equal to it by a unit test
 */
export const LEARNER_MEMORY_GUARD_HOOK_BUDGET = 'PT5S';
