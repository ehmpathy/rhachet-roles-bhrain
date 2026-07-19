/**
 * .what = renders the route's status-line state into the claude code status line string
 * .why = single source of truth for the moai-prefixed status line format
 *
 * .note = the moai stone-head 🗿 is the driver's own icon (the driver
 *         navigates stones; a moai is a stone head). three render states:
 *         - blank    → '' (unbound, or a route with no stones; harness blanks the line)
 *         - stone    → '🗿 <stone>' (the current stone of a bound route)
 *         - complete → '🗿 route complete 🎉' (a bound route whose stones all passed)
 */
export const asStatusLine = (
  input:
    | { kind: 'blank' }
    | { kind: 'stone'; stone: string }
    | { kind: 'complete' },
): string => {
  // a bound route whose stones all passed → celebrate the finish
  if (input.kind === 'complete') return '🗿 route complete 🎉';

  // a current stone → the moai stone-head prefix + the stone name
  if (input.kind === 'stone') return `🗿 ${input.stone}`;

  // blank → empty so the harness renders an absent line
  return '';
};
