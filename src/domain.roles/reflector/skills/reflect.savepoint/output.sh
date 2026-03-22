#!/usr/bin/env bash
######################################################################
# .what = owl-vibed output for reflect skills
#
# .why  = consistent output format across all reflect commands
#
# usage:
#   source output.sh
#   print_owl_header "know thyself"
#   print_tree_start "reflect.savepoint"
######################################################################

# print owl emoji + phrase
# usage: print_owl_header "know thyself"
print_owl_header() {
  local phrase="${1:-know thyself}"
  echo "🦉 $phrase"
  echo ""
}

# print tree start (skill name line)
# usage: print_tree_start "reflect.savepoint"
print_tree_start() {
  local skill_name="$1"
  echo "🌙 $skill_name"
}
