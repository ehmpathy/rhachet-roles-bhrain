#!/usr/bin/env bash
######################################################################
# .what = output helper functions for route.foreground guard
#
# .why = consistent zen owl aesthetic for block messages
#        separated from logic for testability and readability
#
# usage:
#   source route.foreground.guard.output.sh
#   print_block_message
######################################################################

# print owl header with presence philosophy
print_owl_header() {
  echo "🦉 walk this path in the open, not in shadow. be present."
  echo ""
}

# print guard tree for a blocked background call
print_block_tree() {
  echo "🗿 route.foreground guard"
  echo "   ├─ skill = route.stone.set"
  echo "   ├─ mode = background"
  echo "   ├─ access = blocked"
  echo "   │"
  echo "   ├─ route.stone.set speaks back — self-reviews, blockers, the way ahead"
  echo "   ├─ in background its voice is lost to a poll, and tokens are wasted"
  echo "   │"
  echo "   └─ instead, run it in the foreground"
  echo "      └─ remove run_in_background from your Bash call"
  echo ""
}

# print wisdom quotes on presence
print_wisdom_quotes() {
  echo "🔭 presence is a virtue"
  echo "   │"
  echo "   ├─ \"the present moment is the only moment available to us\" — thich nhat hanh"
  echo "   ├─ \"wherever you are, be there totally\" — eckhart tolle"
  echo "   ├─ \"do every act of your life as though it were the last\" — marcus aurelius"
  echo "   │"
  echo "   └─ \"tea first, then we proceed\" — the owl by the pond"
}

# print full block message
print_block_message() {
  print_owl_header
  print_block_tree
  print_wisdom_quotes
}
