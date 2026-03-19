#!/usr/bin/env bash
######################################################################
# .what = output helper functions for route.mutate guard
#
# .why = consistent zen owl aesthetic for block messages
#        separated from logic for testability and readability
#
# usage:
#   source route.mutate.guard.output.sh
#   print_block_message "$route" "$path" "$reason"
#   print_allow_message "$route" "$path"
######################################################################

# print owl header with focus philosophy
print_owl_header() {
  echo "🦉 to chase all paths, is to reach none. focus."
  echo ""
}

# print guard tree for blocked access
print_block_tree() {
  local route="$1"
  local path="$2"

  echo "🗿 route.mutate guard"
  echo "   ├─ route = $route"
  echo "   ├─ path = $path"
  echo "   ├─ access = blocked"
  echo "   │"
  echo "   ├─ the route is sealed"
  echo "   ├─ it reveals itself one stone at a time"
  echo "   │"
  echo "   └─ instead, run"
  echo "      └─ rhx route.drive"
  echo ""
}

# print guard tree for allowed access
print_allow_tree() {
  local route="$1"
  local path="$2"

  echo "🗿 route.mutate guard"
  echo "   ├─ route = $route"
  echo "   ├─ path = $path"
  echo "   └─ verdict = allowed"
}

# print wisdom quotes on focus
print_wisdom_quotes() {
  echo "🔭 focus is a virtue"
  echo "   │"
  echo "   ├─ \"a great task is accomplished by a series of small acts\" — lao tzu"
  echo "   ├─ \"the man who moves a mountain begins by carrying away small stones\" — confucius"
  echo "   ├─ \"it does not matter how slowly you go so long as you do not stop\" — confucius"
  echo "   │"
  echo "   ├─ \"if you seek tranquility, do less\" — marcus aurelius"
  echo "   ├─ \"curb your desire — don't set your heart on so many things\" — epictetus"
  echo "   ├─ \"beware the barrenness of a busy life\" — socrates"
  echo "   ├─ \"withdrawal from some to deal effectively with others\" — william james"
  echo "   ├─ \"you can do anything but not everything\" — greg mckeown"
  echo "   │"
  echo "   ├─ \"who acts in stillness finds stillness in his life\" — lao tzu"
  echo "   ├─ \"unify your attention\" — confucius"
  echo "   ├─ \"a calm mind is the greatest weapon\" — uncle iroh"
  echo "   │"
  echo "   └─ \"simplicity, patience, compassion — these three are your greatest treasures\" — lao tzu"
}

# print full block message
print_block_message() {
  local route="$1"
  local path="$2"

  print_owl_header
  print_block_tree "$route" "$path"
  print_wisdom_quotes
}

# print full allow message
print_allow_message() {
  local route="$1"
  local path="$2"

  print_allow_tree "$route" "$path"
}
