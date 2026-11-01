#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for the memory.guard skill (learner PreToolUse hook)
#
# .why = halts writes to claude native memory and redirects to durable capture.
#        a guard that cannot run must never halt the call it guards: only the
#        verdict's own `blocked` may exit 2, since claude code reads exit 2 as block.
#
# usage:
#   ./memory.guard.sh --mode hook   # pretool check (reads tool input from stdin)
#
# exit codes:
#   0 = allowed (not a native-memory write)
#   2 = blocked (native-memory write; owl nudge to stderr)
#   1 = the guard could not run; the call proceeds, and claude code shows the
#       human the one stderr line as a `hook error` notice (stderr on exit 0
#       never reaches the human)
######################################################################
set -euo pipefail

# the one fault line, declared once; bash and node both render it from this format
# .note = it stays one line, not a tree: claude code shows a hook's first stderr
#         line, so a fix on a later line would never reach the human
export MEMORY_GUARD_FAULT_FORMAT='📜 memory.guard: could not run (%s); call allowed. fix: %s'

# the private exits node uses to tell bash how it ended; bash maps each to the hook's
# own code below. the block is private too, so the map's one `exit 2` is the only
# source of a 2: a stray 2 from node falls to the fault arm, and the call proceeds
export MEMORY_GUARD_EXIT_FAULT=3     # node named its own fault
export MEMORY_GUARD_EXIT_DEADLINE=4  # node hit its own deadline
export MEMORY_GUARD_EXIT_BLOCK=5     # the verdict blocked; the nudge is on stderr

# the codes this file ends with: the hook's own on a direct run (0 allow, 2 block,
# 1 fault). the hook command passes sealed codes and maps them back, so a file that
# cannot run as written (a syntax fault, an empty or cut file) ends with a code no
# healthy run gives, and the call proceeds (see LEARNER_MEMORY_GUARD_HOOK_COMMAND)
HOOK_EXIT_ALLOW="${MEMORY_GUARD_HOOK_EXIT_ALLOW:-0}"
HOOK_EXIT_BLOCK="${MEMORY_GUARD_HOOK_EXIT_BLOCK:-2}"
HOOK_EXIT_FAULT="${MEMORY_GUARD_HOOK_EXIT_FAULT:-1}"

# report a fault the human can act on, then let the call through
emit_fault() {
  local cause="$1"
  local fix="$2"
  # shellcheck disable=SC2059 # the format is this file's own constant
  printf "${MEMORY_GUARD_FAULT_FORMAT}\n" "$cause" "$fix" >&2
  exit "$HOOK_EXIT_FAULT"
}

# a setup step that fails under `set -e` exits with its own status, and a 2 reads as
# block. so every such fault becomes the one fault line, exit 1
trap 'emit_fault "setup step exited $? at line $LINENO" "reinstall rhachet-roles-bhrain"' ERR

# capture stdin in bash before node starts (node -e has issues with stdin inheritance)
# only read stdin if in hook mode
if [[ "${*}" == *"--mode hook"* || "${*}" == *"--mode=hook"* ]]; then
  # check if stdin has data (fd 0 is not a terminal)
  # .note = held in a shell var, never exported: linux caps one env string near
  #         128KB, so an exported payload past it fails every later exec. node reads
  #         it on its own stdin, via a here-string below
  if [ ! -t 0 ]; then
    PAYLOAD="$(cat)" || emit_fault "tool payload unreadable on stdin" \
      "none needed for this call; if it recurs, report it at https://github.com/ehmpathy/rhachet-roles-bhrain/issues"
  fi
fi

# locate the cli from this file's own package, never from the cwd's node lookup
# .note = follow the file's own links one hop at a time (bsd readlink lacks -f), then
#         let `cd -P` settle any linked dir, so a linked dir, a linked file, or no link
#         all land in <package>/{src,dist}/domain.roles/learner/skills
# .note = each step is its own assignment, since a failure nested inside another
#         substitution's argument is invisible to `set -e`
# .note = the hops are bounded, so a cyclic link is named, never a hang past the deadline
SKILL_FILE="${BASH_SOURCE[0]}"
SKILL_HOPS=0
while [ -L "$SKILL_FILE" ]; do
  SKILL_HOPS=$((SKILL_HOPS + 1))
  if [ "$SKILL_HOPS" -gt 32 ]; then
    emit_fault "skill link loops at $SKILL_FILE" "./node_modules/.bin/rhachet roles link --repo bhrain --role learner"
  fi
  SKILL_LINK="$(readlink "$SKILL_FILE")"
  case "$SKILL_LINK" in
    /*) SKILL_FILE="$SKILL_LINK" ;;
    *)
      SKILL_LINK_DIR="$(dirname "$SKILL_FILE")"
      SKILL_FILE="$SKILL_LINK_DIR/$SKILL_LINK"
      ;;
  esac
done
SKILL_DIR="$(dirname "$SKILL_FILE")"
PACKAGE_ROOT="$(cd -P "$SKILL_DIR/../../../.." && pwd)"
CLI_PATH="$PACKAGE_ROOT/dist/contract/cli/memory.js"
if [[ ! -f "$CLI_PATH" ]]; then
  emit_fault "cli absent at $CLI_PATH" "reinstall rhachet-roles-bhrain"
fi

# name an absent node as itself; a reinstall of this package would not cure it
if ! command -v node >/dev/null; then
  emit_fault "node not found on the PATH" "install node, or put it on the PATH claude code gives its hooks"
fi

# hold deadlines under the hook's own budget, so a slow guard is named, not silent
# .note = the budget is the hook entry's timeout (LEARNER_MEMORY_GUARD_HOOK_BUDGET,
#         PT5S); a unit test clamps the two equal. both deadlines derive from it
# .note = claude code discards a timed-out hook's output. node holds the first
#         deadline itself (exit 4), which bounds an async stall (a slow load, a
#         hung read) on every host; it cannot interrupt the verdict, which runs
#         synchronously, so the verdict is held linear in the command length
#         instead (a unit row grades 50KB+ commands under 1.5s). `timeout`, where
#         the host has it, is the backstop that can interrupt both
MEMORY_GUARD_HOOK_BUDGET_MS=5000
export MEMORY_GUARD_DEADLINE_MS=$((MEMORY_GUARD_HOOK_BUDGET_MS - 1500))
BACKSTOP_MS=$((MEMORY_GUARD_HOOK_BUDGET_MS - 500))
DEADLINE=()
if command -v timeout >/dev/null; then
  DEADLINE=(timeout "$((BACKSTOP_MS / 1000)).$((BACKSTOP_MS % 1000 / 100))")
fi

# run the guard; node names its own fault and exits 3. the allowlist:
# - a module absent at load is an install fault: reinstall cures it, one line
# - any other load rejection (a top-level throw, a syntax fault) and any run throw is
#   a shipped defect a reinstall cannot cure: its full stack follows the fault line,
#   so a report carries what a debug needs
# - a payload the guard cannot judge comes back from the guard as a fault: one line
# - a blocked write comes back as the nudge: written to stderr, exit 2, the one block
# .note = the fault line leads, since claude code shows the first stderr line
# .note = a quoted heredoc, so bash expands no `$`, backtick, or `\` in the js
# .note = `read -d ''` returns 1 at the heredoc's end by design; `|| true` keeps
#         that expected status off the ERR trap
read -r -d '' MEMORY_GUARD_RUN <<'NODE' || true
const asCause = (error) =>
  (error?.name ?? 'Error') + ': ' + String(error?.message ?? error).split('\n')[0];
const emitFault = (input) => {
  const [head, tail] = process.env.MEMORY_GUARD_FAULT_FORMAT.split('%s');
  console.error(head + input.cause + tail + input.fix);
  if (input.stack) console.error(input.stack);
  process.exit(Number(process.env.MEMORY_GUARD_EXIT_FAULT));
};
const FIX_REPORT =
  'report it at https://github.com/ehmpathy/rhachet-roles-bhrain/issues, with the stack below';
const deadline = setTimeout(
  () => process.exit(Number(process.env.MEMORY_GUARD_EXIT_DEADLINE)),
  Number(process.env.MEMORY_GUARD_DEADLINE_MS),
);
const isModuleAbsent = (error) =>
  ['MODULE_NOT_FOUND', 'ERR_MODULE_NOT_FOUND'].includes(error?.code);
import(process.env.MEMORY_GUARD_CLI)
  .catch((error) =>
    isModuleAbsent(error)
      ? emitFault({ cause: 'load failed, ' + asCause(error), fix: 'reinstall rhachet-roles-bhrain', stack: null })
      : emitFault({ cause: 'load defect, ' + asCause(error), fix: FIX_REPORT, stack: error?.stack ?? String(error) }),
  )
  .then((m) => m.memoryGuard())
  .then((result) => {
    clearTimeout(deadline);
    if (result?.fault) emitFault({ ...result.fault, stack: null });
    if (result?.nudge) {
      console.error(result.nudge);
      process.exit(Number(process.env.MEMORY_GUARD_EXIT_BLOCK));
    }
  })
  .catch((error) =>
    emitFault({ cause: 'guard defect, ' + asCause(error), fix: FIX_REPORT, stack: error?.stack ?? String(error) }),
  );
NODE
STATUS=0
MEMORY_GUARD_CLI="$CLI_PATH" ${DEADLINE[@]+"${DEADLINE[@]}"} node -e "$MEMORY_GUARD_RUN" -- "$@" <<<"${PAYLOAD-}" || STATUS=$?

# map the exit: only the verdict may halt the call
case "$STATUS" in
  0) exit "$HOOK_EXIT_ALLOW" ;;
  "$MEMORY_GUARD_EXIT_BLOCK") exit "$HOOK_EXIT_BLOCK" ;;
  "$MEMORY_GUARD_EXIT_FAULT") exit "$HOOK_EXIT_FAULT" ;;
  "$MEMORY_GUARD_EXIT_DEADLINE" | 124) emit_fault "timed out under the hook's $((MEMORY_GUARD_HOOK_BUDGET_MS / 1000))s budget" "none needed for this call; if it recurs, the host is overloaded" ;;
  *) emit_fault "guard exited ${STATUS}" "reinstall rhachet-roles-bhrain" ;;
esac
