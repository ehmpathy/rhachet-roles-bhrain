# rule: verify refs included

severity = blocker

## .what

verify that the reviewer has access to any referenced documents via the <refs> section.

if a <refs> section is present, confirm you can see its contents.

## .check

- if <refs> section exists and contains content: pass (no blocker)
- if <refs> section is empty or absent when expected: blocker
