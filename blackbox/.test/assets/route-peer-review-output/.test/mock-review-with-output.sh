#!/usr/bin/env bash
######################################################################
# .what = mock review that writes to --output path
# .why = tests that $output variable substitution works in guards
#
# behavior:
#   - emits blockers/nitpicks to stdout (for guard to parse)
#   - writes detailed report to --output path (for driver to read)
######################################################################
set -euo pipefail

# parse --output flag
OUTPUT_PATH=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --output)
      OUTPUT_PATH="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

# emit to stdout (guard parses this)
echo "---"
echo "blockers: 0"
echo "nitpicks: 1"
echo "---"
echo "review passed (mock with output)"
echo ""
echo "## nitpicks"
echo "- consider more comments"

# write to output file if specified
if [[ -n "$OUTPUT_PATH" ]]; then
  mkdir -p "$(dirname "$OUTPUT_PATH")"
  cat > "$OUTPUT_PATH" << 'EOF'
# detailed review report

this is the detailed review report that was written to the $output path.

## summary

the review found no blockers but 1 nitpick.

## nitpicks

1. consider more comments to improve code readability

## notes

this file proves that the --output $output variable substitution works correctly.
EOF
fi
