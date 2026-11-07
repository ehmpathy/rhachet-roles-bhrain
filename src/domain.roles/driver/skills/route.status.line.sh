#!/usr/bin/env bash
######################################################################
# .what = prints the claude code status line from the bound route's status file
#
# .why = the harness runs this command on every repaint of every seat. a
#        node boot per repaint held whole cores on a busy box, so the render
#        moved to the writers (each move of the route rewrites
#        $route/.route/.status.line.json), and a repaint only reads
#
# usage:
#   bash .agent/repo=bhrain/role=driver/skills/route.status.line.sh
#   (run from the repo root, as the harness does)
#
# guarantee:
#   ✔ no command it runs is found on PATH: builtins and file redirects alone,
#     so it runs with PATH empty (no node, no git, no jq, no sed). the bash
#     the harness starts is the one process a repaint costs
#   ✔ bash 3.2 compatible: [[ ]], =~, -nt, ${x//a/b}, read — no mapfile,
#     no ${x,,}, no associative arrays, no $EPOCHSECONDS
#   ✔ a bound branch the pointer names, or a bound .behavior/* route, never
#     reads blank: a stale file reads as stale, an absent or unreadable one
#     reads as unknown, both name the fix
#   ✘ a route bound outside .behavior/ before any writer named it in the
#     pointer reads blank, since the reader cannot walk the repo to find it;
#     the next route.drive names it
#   ✔ always exits 0: the line is a display, never a gate
#
# states:
#   unbound (no flag, detached HEAD, no .git)  → blank
#   bound, fresh                → the line the writer rendered
#   bound, stale                → <line> · stale, rhx route.drive
#   bound, absent or unreadable → 🗿 status unknown, rhx route.drive
#   bound, no pointer yet       → 🗿 status unknown, rhx route.drive
#   two routes bound            → 🗿 two routes bound to this branch, rhx route.bind.get
#
#   a cwd below the repo root walks up to it first (via `cd`, a builtin)
######################################################################

# one byte per char: the branch flat-name rule below matches ascii alone
LC_ALL=C

# the paths the writers keep (status line pointer dir, the status file name)
DIR_OF_POINTERS=".agent/.cache/repo=bhrain/role=driver/skill=route.status.line"
NAME_OF_STATUS_FILE=".status.line.json"
MARK_OF_MULTI_BIND="@multi-bind"

# read the first line of a file into the named var; false when the file is absent
# usage: read_first_line into=<var> path=<path>
# .note = args are named, via `local "$@"`: a builtin, so still no process
read_first_line() {
  local into="" path="" __line=""
  local "$@"
  [[ -f "$path" ]] || return 1
  IFS= read -r __line < "$path" || [[ -n "$__line" ]] || return 1
  printf -v "$into" '%s' "$__line"
}

# the branch the HEAD file names; false on a detached HEAD or no .git
# .note = mirrors getOneBranchFromHeadFileOrNull: a worktree's .git is a
#         `gitdir: <path>` file, a plain checkout's .git is the dir itself
read_branch() {
  local git_dir=".git" pointer="" head=""
  if [[ -f ".git" ]]; then
    read_first_line into=pointer path=".git" || return 1
    [[ "$pointer" =~ ^gitdir:\ (.+)$ ]] || return 1
    git_dir="${BASH_REMATCH[1]}"
  elif [[ ! -d ".git" ]]; then
    return 1
  fi
  read_first_line into=head path="$git_dir/HEAD" || return 1
  [[ "$head" =~ ^ref:\ refs/heads/(.+)$ ]] || return 1
  BRANCH="${BASH_REMATCH[1]}"
}

# the branch's flat name, the bash twin of sanitizeBranchName (src/utils/git)
# .note = four rules, in order: slash → dot; other unsafe chars → dash;
#         a run of specials collapses to its first; one special trimmed
#         from each end. a parity test holds the twins together
as_flat_branch() {
  local branch="" re_pair='^(.*[-_.])[-_.](.*)$'
  local "$@"
  local flat="$branch"
  flat="${flat//\//.}"
  flat="${flat//[^a-zA-Z0-9._-]/-}"
  while [[ "$flat" =~ $re_pair ]]; do
    flat="${BASH_REMATCH[1]}${BASH_REMATCH[2]}"
  done
  flat="${flat#[-_.]}"
  flat="${flat%[-_.]}"
  FLAT="$flat"
}

# whether any render input in the route's state dir is newer than the status file
is_stale() {
  local state_dir="" status_file="" flag_name="" input=""
  local "$@"
  for input in "$state_dir/passage.jsonl" "$state_dir/reviewPeerMeters.jsonl" "$state_dir/$flag_name" "$state_dir"/*.guard.promise.*.md; do
    [[ -e "$input" && "$input" -nt "$status_file" ]] && return 0
  done
  return 1
}

# the line a status file holds; false when it does not parse
# .note = the writer fixes the shape: compact json, `line` last. json
#         escapes `\` and `"`; both are unescaped here, `\\` first
read_line_from_status() {
  local path="" raw="" re_line='"line":"(.*)"}$' sep=$'\001'
  local "$@"
  read_first_line into=raw path="$path" || return 1
  [[ "$raw" =~ $re_line ]] || return 1
  raw="${BASH_REMATCH[1]}"
  raw="${raw//\\\\/$sep}"
  raw="${raw//\\\"/\"}"
  LINE="${raw//$sep/\\}"
}

# the fixes the line names
LINE_OF_UNKNOWN="🗿 status unknown, rhx route.drive"
LINE_OF_MULTI_BIND="🗿 two routes bound to this branch, rhx route.bind.get"
SUFFIX_OF_STALE=" · stale, rhx route.drive"

# --help → what it prints and why, then exit; a repaint passes no args
# .note = any position: `rhx route.status.line --help` puts its own --repo/--role/--skill
#         ahead of the human's args, so a check of $1 alone would repaint where help was asked
WANT_HELP=""
for ARG in "$@"; do
  [[ "$ARG" == "--help" || "$ARG" == "-h" ]] && WANT_HELP="true"
done
if [[ -n "$WANT_HELP" ]]; then
  printf '%s\n' \
    "route.status.line - print the claude code status line from the bound route's status file" \
    "" \
    "usage:" \
    "  BASH_ENV= bash .agent/repo=bhrain/role=driver/skills/route.status.line.sh" \
    "  (run from the repo root, as the harness does; init.claude.status-line binds it)" \
    "" \
    "options:" \
    "  --help, -h   show this help message" \
    "" \
    "output:" \
    "  unbound branch            (empty line)" \
    "  bound, fresh              the line the route writers rendered" \
    "  bound, stale              <line>$SUFFIX_OF_STALE" \
    "  bound, absent status file $LINE_OF_UNKNOWN" \
    "  bound, no pointer yet     $LINE_OF_UNKNOWN (route under .behavior/)" \
    "  bound, no pointer yet     (empty line, route outside .behavior/, until its next drive or bind)" \
    "  two routes bound          $LINE_OF_MULTI_BIND" \
    "" \
    "note:" \
    "  a repaint spawns no process: the writers (route.drive, stone set, bind, meter)" \
    "  rewrite \$route/.route/$NAME_OF_STATUS_FILE when the route moves, and this reads it." \
    "  stale = a passage, meter, promise, or bind flag newer than the file." \
    "" \
    "examples:" \
    "  BASH_ENV= bash .agent/repo=bhrain/role=driver/skills/route.status.line.sh" \
    "  rhx route.drive   # refresh a stale or absent status file"
  exit 0
fi

# walk up to the repo root, where the writers keep the pointer; a seat whose cwd drifted
# into a subdir still reads its line. `cd` is a builtin, so still no process
while [[ ! -e ".git" && "$PWD" != "/" ]]; do
  cd .. || exit 0
done

# find the branch; none → blank, as an unbound seat
read_branch || exit 0
as_flat_branch branch="$BRANCH"

# find the route the branch is bound to; no pointer → unknown where this branch holds a bind
# flag (a bind made before the pointer existed, a fresh worktree or clone), else blank
# .note = the bounded glob is a builtin, over the conventional route home alone
if ! read_first_line into=ROUTE path="$DIR_OF_POINTERS/branch=$FLAT.route"; then
  for FLAG_FOUND in .behavior/*/.route/".bind.$FLAT.flag"; do
    if [[ -e "$FLAG_FOUND" ]]; then
      printf '%s\n' "$LINE_OF_UNKNOWN"
      exit 0
    fi
  done
  exit 0
fi
if [[ "$ROUTE" == "$MARK_OF_MULTI_BIND" ]]; then
  printf '%s\n' "$LINE_OF_MULTI_BIND"
  exit 0
fi

# the pointer's route must still hold this branch's flag; else unbound → blank
STATE_DIR="$ROUTE/.route"
NAME_OF_FLAG=".bind.$FLAT.flag"
[[ -e "$STATE_DIR/$NAME_OF_FLAG" ]] || exit 0

# read the status file; absent or unreadable → unknown, with the fix
STATUS_FILE="$STATE_DIR/$NAME_OF_STATUS_FILE"
if ! read_line_from_status path="$STATUS_FILE"; then
  printf '%s\n' "$LINE_OF_UNKNOWN"
  exit 0
fi

# a render input newer than the file → the line, marked stale, with the fix
if [[ -n "$LINE" ]] && is_stale state_dir="$STATE_DIR" status_file="$STATUS_FILE" flag_name="$NAME_OF_FLAG"; then
  printf '%s\n' "$LINE$SUFFIX_OF_STALE"
  exit 0
fi

# fresh → the line the writer rendered
printf '%s\n' "$LINE"
exit 0